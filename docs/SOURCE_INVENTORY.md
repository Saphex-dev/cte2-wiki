# Craft to Exile 2 — Wiki Source Inventory

Reference instance: `C:\Users\payan\curseforge\minecraft\Instances\Craft to Exile 2 - 2.0 Atlas Update Claude`
Pack version: **2.0.4 "Atlas Update"** · MC 1.20.1 · Forge 47.4.22 · 405 CurseForge files / 396 mod jars

---

## How a registry actually resolves

Read this before adding a source. A registry entry can come from three places, and
the extractor has to read all three, in this order:

1. **Java code inside the mod.** Registered at startup, ships no file. The only record
   is the plaintext dump at `assets/mmorpg/modpack_dev_helper/<registry>.txt`
   (one id per line). 353 stats live here, `health` and `mana` and `armor` among them.
2. **JSON inside the mod jar**, at `data/<namespace>/<registry>/`. Six jars carry
   registry data: Mine_and_Slash, Library_of_Exile, Dungeon-Realm, Ancient-Obelisks,
   The-Harvest, mine_and_meals.
3. **The pack's datapack**, `config/openloader/data/cte_mns/`. 5,798 files / 31 MB.

Layer 3 **overlays** layers 1–2 file by file. It does not replace them. An entry the
pack never ships still resolves to the mod's copy in game — so reading only `cte_mns`
silently drops it. That mistake cost 1,481 entries before it was found, including
every core stat.

Where both exist, the pack wins: it overrides 2,178 of the mod defaults and leaves the
rest untouched. Extracted entries record which layer won in `origin`, and an
overridden entry keeps the path it displaced in `base_source`.

---

## Tier 1 — Registries (mapped)

Counts are **jar / pack** files. Neither column is the entry count on the site; see
`EXTRACTION_MANIFEST.md` for merged totals.

### `data/mmorpg/`
| Registry | Jar | Pack | Wiki value |
|---|---:|---:|---|
| `mmorpg_profession_recipe` | 799 | 813 | Crafting across 5 professions |
| `mmorpg_perk` | 744 | 681 | Passive tree nodes |
| `mmorpg_stat` | 450 | 443 | Stat definitions (+353 code-only) |
| `mmorpg_unique_gears` | 51 | 302 | Uniques (50 flagged `hide_from_wiki`) |
| `mmorpg_spells` | 99 | 369 | Spell/skill definitions (behavior trees) |
| `mmorpg_affixes` | 212 | 473 | Prefix/suffix/implicit/jewel/enchant/corruption pools |
| `mmorpg_value_calc` | 70 | 251 | Numbers behind `[calc:]` refs |
| `mmorpg_exile_effect` | 34 | 189 | Buffs, debuffs, ailments |
| `mmorpg_entity` | 18 | 181 | Mob→RPG mapping (by-mod / by-type / specific) |
| `mmorpg_support_gem` | 59 | 86 | Support gems |
| `mmorpg_gems` | 72 | 72 | Skill gems |
| `mmorpg_map_affix` | 55 | 67 | Map/dungeon modifiers |
| `mmorpg_prophecy_modifier` | 36 | 60 | Prophecies |
| `mmorpg_runeword` | 9 | 59 | Runewords |
| `mmorpg_base_gear_types` | 22 | 43 | Base item types |
| `mmorpg_aura` | 24 | 28 | Auras |
| `mmorpg_mob_affix` | 13 | 25 | Rare/magic mob mods |
| `mmorpg_runes` | 22 | 22 | Runes |
| `mmorpg_gear_slot` | 14 | 14 | Equipment slots (and weapon types) |
| `mmorpg_spell_school` | 6 | 12 | Schools |
| `mmorpg_mob_rarity` / `weapon_type` / `shrine_buff` | 10 / 7 / 1 | 10 ea | — |
| `mmorpg_omen` | 8 | 9 | — |
| `mmorpg_profession` | 9 | 5 | — |

**`mmorpg_talent_tree/`** — the marquee dataset, 3 trees in each layer:
- `talents.json` — main passive tree, node graph + coordinates
- `ascendancy.json` — ascendancy classes
- `atlas_passives.json` — Atlas passive tree (the 2.0 headline feature)
- Also present: the devs' authoring source (`talents.ods`, `talents.csv`, `ascendancy_maker/`, `atlas_maker/`, `modpacker_resources/`) — useful cross-reference for intended names/groupings.

### `data/dungeon_realm/`
| Registry | Jar | Pack |
|---|---:|---:|
| `dungeon_realm_atlas_node` | 205 | 151 |
| `dungeon_realm_dungeon` | 17 | 29 |
| `dungeon_realm_boss_arena` | 1 | 5 |
| `dungeon_realm_uber_boss` | 1 | 4 |

### `data/library_of_exile/`
Currency (81 / 43), item modifications (91 / 13), relic affixes (30 / 29), mob lists
(7 / 17), relic stats (27 / 5), relic rarity (6 / 6), relic type (6 / 4). Split across
four jars — Library_of_Exile owns the namespace, and Dungeon-Realm, Ancient-Obelisks
and The-Harvest each add to it. Five ids are defined by two jars at once (all
harvest-related); the extractor reports them.

## Tier 1b — Registries not yet mapped

See the table in `EXTRACTION_MANIFEST.md`. The two worth doing first are
`mmorpg_gear_rarity` (rarity tiers, referenced site-wide) and `mmorpg_stat_condition`
+ `mmorpg_stat_effect` (what a conditional stat does and when).

---

## Tier 2 — Authored prose

- **`patchouli_books/cte2/`** — 63 files. The in-game guidebook, written by the pack devs.
  Structure: `categories/` + `entries/{lost_pages/ACT1..ACT5, dimensions, professions, storage, disabled}`.
  Already explains Favor, gear rarity/quality, weapon types, dimensions. **Highest-quality prose in the pack** — near-publishable as wiki body text after stripping Patchouli `$(...)` / `&c` formatting codes.
- **`config/ftbquests/quests/`** — 72 SNBT files, 931 KB.
  Chapters: `act_0` … `act_v`, `ascendancy`, `epilogue`, `campaign_talent_rewards`, `completionist`, `exploration`, `professions`, `repeatables`, `homestead`, `fishing`, `culinary_delights`, `magical_flora`, `gem_shop`, `storage_solutions`, `other_hobbies`, `jolly_cooperation`.
  Gives the **campaign structure, progression order, and reward tables**. Needs an SNBT parser (not JSON).

---

## Tier 3 — Naming & presentation

- **`mods/Mine_and_Slash-*.jar` → `assets/mmorpg/lang/en_us.json`** — 3,623 keys (base display names)
- **`config/openloader/resources/resources.zip` → `assets/mmorpg/lang/en_us.json`** — 2,800 keys (**pack overrides — apply on top**), 5,564 keys merged
- Same zip carries per-mod lang overrides for ~40 mods (dungeon_realm, ancient_obelisks, blue_skies, cte2modpackarmors, …)
- **Icons/textures**: 693 mmorpg textures in `resources.zip`, 2,147 in the M&S jar, plus 608 models. Enough to render item/gem/perk icons on the site.

---

## Tier 4 — Supporting

- **`mods/*.jar → assets/mmorpg/modpack_dev_helper/*.txt`** — 117 plaintext registry
  dumps. Promoted out of "nice to have": for `mmorpg_stat` this is the **only** source
  for 353 entries, and every dump doubles as a completeness oracle for its registry.
- `config/openloader/data/cte_configuration/data/` — 7.3 MB of per-mod tuning across ~50 mods (loot, spawns, structures)
- `config/openloader/data/cte_events/` — 21 KB
- `manifest.json` — full mod list with CurseForge projectID/fileID (→ mod credit pages + links)
- `kubejs/` — small (5 scripts), minor custom items/stats

---

## Notable gotchas

1. **The datapack overlays, it does not replace.** Read jar defaults first, the code
   registry dump under that, and `cte_mns` on top. Getting this wrong drops entries
   silently — nothing errors, the collection is just short.
2. **Some defaults exist only in Java.** `health`, `mana`, `armor`, `dodge` and 349
   more have no JSON anywhere. Their names and descriptions come from lang; their
   numeric definitions are not recoverable from the pack at all. Extracted with
   `origin: "code"` and an empty `data`.
3. **`hide_from_wiki: true`** appears on 149 entries (deprecated/unused content). The
   data model already anticipates a wiki — honor this flag, and honor it *after*
   merging, so a pack entry can un-hide a mod default.
4. **Merge on id, not filename.** The registries are id-keyed in game, and the pack
   sometimes files an override under a different subfolder than the jar used. Merging
   on id also collapses the six duplicate ids the old per-file extraction produced.
5. **FTB Quests are SNBT**, not JSON. Needs a dedicated parser.
6. **Patchouli formatting codes** (`$(l)`, `$(br)`, `&e`, `$(c:/ftbquests open_book <hash>)`) need a converter. The quest-hash links are cross-references worth preserving as internal wiki links.
7. Spell JSONs are **behavior trees** (nested acts/ifs/targets), not flat stat blocks — rendering them readably is the hardest single problem on this project.
8. Some registry dirs are nested one level deeper (`mmorpg_affixes/prefix/…`, `mmorpg_entity/specific_mobs/…`) — glob recursively.
9. **Talent-tree grids use an alphabet of layout glyphs**, not a fixed few. `talents`
   and `atlas_passives` use `o k p u n i j v l h m`; `ascendancy` uses `X O Y K`; all
   three use `[CENTER]`. Identify them by *not* resolving against the perk registry —
   an allowlist rots the moment the pack adds a glyph, and every unrecognised glyph
   becomes a phantom perk.
