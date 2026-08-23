# Extractor

Generates `data/` from a reference copy of the **Craft to Exile 2** modpack
(v2.0.4 "Atlas Update", MC 1.20.1 / Forge). Game data on the wiki is generated,
never hand-typed; prose is hand-written. Re-running this against a newer pack
version regenerates `data/` so the wiki updates in one step.

```sh
python extract/extract.py --instance "/path/to/Craft to Exile 2 - 2.0 Atlas Update" --out data/
```

Python 3.9+. No dependencies. Takes a few seconds.

## Layout

```
extract/
  registry_map.py   declarative registry -> collection map (edit this when the pack adds content)
  extract.py        the extractor
data/               generated JSON, committed so the site builds without the modpack present
docs/               extraction manifest and source inventory
src/content/docs/   the wiki itself — Astro + Starlight
```

## How it reads the pack

A registry entry can come from three layers. The extractor reads all three, in the
order the game resolves them:

| Layer | `origin` | Where |
|---|---|---|
| Registered in Java, no file | `code` | `assets/mmorpg/modpack_dev_helper/<registry>.txt` |
| Mod default JSON | `mod` | `<jar>!/data/<namespace>/<registry>/` |
| Pack datapack | `pack` | `config/openloader/data/cte_mns/data/…` |

**The datapack overlays the mod defaults file by file — it does not replace them.**
Entries the pack never ships still resolve to the mod's copy in game. Reading only
`cte_mns` drops them silently, which is what the first version of this extractor did:
it lost 1,481 entries, including `health`, `mana` and `armor`, and left 58% of the
talent trees pointing at perks that were never extracted.

Merging is keyed on the **entry id**, not the filename — the registries are id-keyed
in game, and the pack sometimes files an override under a different subfolder than the
jar used.

Display names merge from two lang sources, in this order (5,564 keys):

1. `mods/Mine_and_Slash-*.jar` → `assets/mmorpg/lang/en_us.json` (3,623 keys)
2. `config/openloader/resources/resources.zip` → same path (2,800 keys, **2,654 of which change a base value**)

Getting that order wrong publishes wrong numbers, so it is centralized in
`registry_map.LANG_SOURCES`.

## What gets extracted

5,869 entries across 37 collections, plus 3 talent trees (1,786 placed nodes) and
8 dimensions' biome colours (283 biomes).
Full breakdown in [`docs/EXTRACTION_MANIFEST.md`](../docs/EXTRACTION_MANIFEST.md);
where each source lives, in [`docs/SOURCE_INVENTORY.md`](../docs/SOURCE_INVENTORY.md).

**Player classes** (from spell folder grouping): Brawler, Chronomancer, Crusader, Hunter,
Minstrel, Rogue, Shaman, Elementalist, Warlock, Fighter, Cryolancer, Sanguimancer.

### Talent trees

`data/talent_trees.json` holds three trees — `talents` (1,321 nodes), `ascendancy`
(243), `atlas_passives` (222) — on a 173-column grid, 138 rows deep (139 for
ascendancy).

The source encodes a tree as a CSV string inside a JSON field: rows split on newline,
cells on comma. `E` is the empty border. Every cell naming a real perk becomes a node;
everything else is a **layout glyph** the renderer uses to draw connecting lines, kept
in `markers` with its coordinates. The mod uses a whole alphabet of them — `o k p u n
i j v l h m` on the talent and atlas trees, `X O Y K` on ascendancy, `[CENTER]` on all
three — so glyphs are identified by *not* resolving against the perk registry rather
than by an allowlist. An allowlist rots the moment the pack adds a glyph, and each
unrecognised one becomes a phantom perk.

### Dimension biomes

`data/dimension_biomes.json` holds, per dimension, whether it renders a sky and
every one of its biomes' raw `sky_color` and `fog_color`. It is the source of the
per-dimension page backdrop (ROADMAP D16). 8 dimensions, 283 biomes.

It **mirrors and interprets nothing** — which of the two colours reads as the
place, and how a list of them becomes one backdrop, is a display decision and
lives in `src/lib/backdrop.ts` (D3).

Three things make it different from every other collection:

- **It needs the vanilla client jar**, not just `mods/`. Three of the eight
  dimensions are Minecraft's own. The path is derived from the instance and the
  manifest's Minecraft version; `--client-jar` overrides it. The run **fails**
  rather than skipping vanilla, because skipping would make `data/` depend on
  the machine it was extracted on.
- **It reads worldgen through its own index**, `WorldgenIndex`, not through
  `JarRegistries`. Adding the client jar to the latter would put
  `data/minecraft/**` into registry resolution for every existing collection.
  Nothing reads a vanilla namespace today so the output would not change — but
  the contract here is a byte-identical re-run, and that is not a guarantee to
  risk for convenience.
- **Tags merge across providers.** `is_end` is provided by both the client jar
  and TheOuterEnd, and the dimension really does contain both sets: 8 biomes,
  not 5. Providers are merged in load order, `replace: true` resets, and `#tag`
  references are followed. Reading only the first provider silently loses
  entries — the same failure mode described under *How it reads the pack*.

Getting from a dimension to its biomes takes three routes, all pack-stated:

| Dimensions | Route |
|---|---|
| Overworld, Nether, End | the `is_overworld` / `is_nether` / `is_end` biome tags — vanilla dimensions ship no dimension file |
| Undergarden, Otherside | `generator.biome_source.biomes[]` in the mod's dimension file |
| Everbright, Everdawn, Twilight Forest | the mod's own membership tag — these use custom chunk generators, so their dimension file names no biomes |

## Entry shape

```jsonc
{
  "id": "arachnid_inoculation",
  "group": "shaman",              // subfolder; class, gear type, or affix category. null at top level
  "origin": "pack",               // "pack" | "mod" | "code" — which layer won
  "source": "config/openloader/...",  // provenance, for auditing a value
  "base_source": "mods/...jar!/...",  // only when a pack entry overrode a mod default
  "name": "Arachnid Inoculation",
  "name_source": "lang",          // "lang" = translated; "derived" = humanized from the id
  "description": "...",           // spells and stats only, and not all of those
  "calc_refs": [],                // [calc:x] refs joining to data/value_calcs.json
  "data": { }                     // raw registry payload; {} for origin "code"
}
```

`description` and `calc_refs` are present only on collections with a `desc_key` in
`registry_map` — today `spells` (263 of 267) and `stats` (532 of 1,151). Treat them as
optional everywhere.

`name_source` matters: collections the pack never translated (`map_affixes`,
`value_calcs`, `prophecies`, `entities`, `profession_recipes`, `dungeons`,
`atlas_nodes`, `gems`, `runes`) fall back to a humanized id and need hand-written
titles.

## Known gotchas

1. **Deprecated content is flagged.** 149 entries carry `hide_from_wiki: true` and are
   skipped — the mod authors anticipated a wiki. The flag is checked *after* merging,
   so a pack entry can un-hide a mod default. Notably **all 99 top-level spell files
   are deprecated**; the live spells live in the per-class subfolders. Folders in
   `EXCLUDE_GROUPS` (`temp_unused`) are dropped too.
2. **Some pack JSON contains raw control characters.** Parsed with `strict=False`,
   matching the game's own tolerance. Do not "fix" this by rejecting those files.
3. **Stat names carry inline tokens**: `[VAL1]` value placeholders and glyphs like `★`
   (attribute) and `☀` (damage type). The site needs a renderer that substitutes
   values and maps glyphs to icons.
4. **Spell descriptions reference `[calc:<id>]`** — join to `value_calcs` to show real
   numbers. All 258 refs resolve.
5. **`learn_<spell>` is not a stat.** It appears in a perk's or affix's stat list and
   means "this grants that skill" — join the suffix to `spells`, not `stats`.
6. **Spells nest one level deeper** for sub-spells (`shaman/sub_spells`). Treat those
   as children of their parent spell, not standalone pages.
7. Registries disagree on the id field (`id` / `guid` / `identifier`); `derive_id`
   handles this.
8. **353 stats have no numeric definition anywhere in the pack** — they are registered
   in Java. They arrive with `origin: "code"`, a real name and (for 159) a
   description, and an empty `data`. Any renderer reading `data.base` must tolerate
   that.

## Not yet extracted

- **14 registries** present in the pack but unmapped — see the table in
  `docs/EXTRACTION_MANIFEST.md`. `mmorpg_gear_rarity` and `mmorpg_stat_condition` /
  `mmorpg_stat_effect` are the ones the site will miss first.
- **FTB Quests** (`config/ftbquests/quests/`, 21 chapters) — SNBT, needs its own parser.
  Source for campaign structure: Acts 0–V, ascendancy, professions, epilogue.
- **Patchouli guidebook** (`patchouli_books/cte2/`, 63 files) — dev-written prose, needs a
  converter for `$(...)` / `&c` formatting codes and `$(c:/ftbquests open_book <hash>)` cross-links.
- **Icons** — ~2,800 textures across the M&S jar and `resources.zip`.
