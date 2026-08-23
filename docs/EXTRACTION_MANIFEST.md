# Extraction Manifest

**Craft to Exile 2** v2.0.4 "Atlas Update" · Minecraft 1.20.1 / Forge 47.4.22 · 405 mods

**5,869 entries · 37 collections · 3 talent trees (1,786 placed nodes) · 7.8 MB JSON**

Regenerate with `python extract/extract.py --instance "<path>" --out data/`.

Every registry is read in three layers, in the order the game resolves them:

| Layer | `origin` | Source | Entries |
|---|---|---|---:|
| Mod default, registered in Java | `code` | `assets/mmorpg/modpack_dev_helper/<registry>.txt` | 353 |
| Mod default, shipped as JSON | `mod` | `<jar>!/data/<namespace>/<registry>/` | 1,128 |
| Pack datapack | `pack` | `config/openloader/data/cte_mns/data/…` | 4,379 |

The pack **overlays** the mod defaults file by file — it does not replace them.
2,178 of the pack's entries override a mod default; the rest are new. Entries
carrying `base_source` are the ones the pack changed.

*Named* = entries with a translated display name. The rest fall back to a humanized id
(`name_source: "derived"`) and need hand-written titles.

---

## Character & builds

| Collection | Count | Named | Notes |
|---|---:|---:|---|
| `stats` | 1,151 | 1,132 | 353 registered in code — name and description only, no numeric definition |
| `perks` | 1,064 | 364 | passive tree nodes |
| `spells` | 267 | 266 | 27 groups — 12 classes + sub-spells |
| `value_calcs` | 253 | 0 | powers `[calc:]` refs in spell descriptions |
| `exile_effects` | 195 | 195 | buffs / debuffs / ailments |
| `auras` | 28 | 28 | |
| `spell_schools` | 12 | 0 | |
| **`talent_trees`** | **3** | — | talents 1,321 · ascendancy 243 · atlas 222 |

**Player classes** (from spell folder grouping): Brawler, Chronomancer, Crusader, Hunter,
Minstrel, Rogue, Shaman, Elementalist, Warlock, Fighter, Cryolancer, Sanguimancer.

## Gear & itemization

| Collection | Count | Named | Notes |
|---|---:|---:|---|
| `affixes` | 489 | 225 | 10 groups: prefix, suffix, implicit, jewel, enchant, corruption, … |
| `uniques` | 251 | 251 | 47 groups by base type · 50 deprecated skipped |
| `item_modifications` | 94 | 84 | |
| `support_gems` | 86 | 86 | |
| `gems` | 72 | 0 | |
| `runewords` | 60 | 60 | |
| `base_gear` | 43 | 43 | |
| `gear_slots` | 23 | 23 | holds weapon types alongside armour slots |
| `runes` | 22 | 0 | |
| `weapon_types` | 13 | 0 | |

## World

| Collection | Count | Named | Notes |
|---|---:|---:|---|
| `dimensions` | 9 | 0 | level bands per dimension — the pack's progression ladder |

`dimensions` is the source of the act ladder. Eight are real places; the ninth,
`default`, is the mod's catch-all for any dimension without its own config and should
be filtered out of anything player-facing.

Names are `derived` and deliberately so. The pack does not translate dimension names —
each mod does, under its own key (`dimension.minecraft.overworld`,
`generator.blue_skies.everbright`, `dimension.twilightforest.twilight_forest`) — and
`registry_map.LANG_SOURCES` reads only Mine and Slash plus the pack's `resources.zip`.
Widening it to reach those keys would re-resolve names across all 37 collections, so
titles are hand-written site-side in `ActLadder.astro`, each quoted from a lang key and
cited inline.

| Dimension | Levels | `mob_tier` |
|---|---|---:|
| `minecraft:overworld` | 1–15 | 0 |
| `minecraft:the_nether` | 10–30 | 0 |
| `undergarden:undergarden` | 25–40 | 1 |
| `blue_skies:everbright` | 35–55 | 1 |
| `blue_skies:everdawn` | 35–55 | 1 |
| `minecraft:the_end` | 50–65 | 2 |
| `deeperdarker:otherside` | 60–75 | 2 |
| `twilightforest:twilight_forest` | 90–100 | 3 |

The bands **overlap** (10–15 is both Overworld and Nether) and leave a **gap** —
nothing covers 76–89. Both are the pack's, not an extraction artefact.

## Endgame & Atlas

| Collection | Count | Named |
|---|---:|---:|
| `atlas_nodes` | 322 | 0 |
| `map_affixes` | 77 | 0 |
| `prophecies` | 60 | 0 |
| `dungeons` | 29 | 0 |
| `shrine_buffs` | 10 | 0 |
| `omens` | 9 | 0 |
| `boss_arenas` | 5 | 0 |
| `uber_bosses` | 4 | 0 |

## Mobs

| Collection | Count | Named | Notes |
|---|---:|---:|---|
| `entities` | 190 | 0 | 3 groups: all_mobs_in_mod, mob_types, specific_mobs |
| `mob_affixes` | 25 | 25 | |
| `mob_lists` | 17 | 0 | |
| `mob_rarities` | 10 | 10 | |

## Economy & crafting

| Collection | Count | Named | Notes |
|---|---:|---:|---|
| `profession_recipes` | 813 | 0 | across 5 professions |
| `currency` | 84 | 75 | |
| `professions` | 9 | 9 | |

## Relics

| Collection | Count | Named |
|---|---:|---:|
| `relic_stats` | 32 | 30 |
| `relic_affixes` | 30 | 0 |
| `relic_rarities` | 6 | 0 |
| `relic_types` | 5 | 0 |

---

## Cross-reference health

Checked after every extraction — these are the joins the site is built on.

| Join | Refs | Unresolved |
|---|---:|---:|
| talent tree node → `perks` | 1,786 | **0** |
| spell description `[calc:]` → `value_calcs` | 258 | **0** |
| perk stat → `stats` | 626 | 1 (`golem_damage`) |
| affix stat → `stats` | 213 | 0 |

`learn_<spell>` entries in a perk's or affix's stat list are not stats — they are the
mod's way of granting a skill. Join the suffix to `spells` instead: 142 of the 145
resolve, the other 3 point at deprecated spells.

## Skipped

- **149 entries** flagged `hide_from_wiki: true` by the pack authors — 99 legacy spells, 50 legacy uniques.
- **6 entries** in `temp_unused`.

## Work queue — collections with no translations

These run entirely on humanized ids and need hand-written titles. Ordered by impact:

| Collection | Count | Why it matters |
|---|---:|---|
| `profession_recipes` | 813 | likely rendered from data rather than titled |
| `atlas_nodes` | 322 | endgame Atlas section |
| `value_calcs` | 253 | rendered inline in spell descriptions |
| `entities` | 190 | likely rendered from data |
| `map_affixes` | 77 | map modifier reference |
| `gems` | 72 | derive from `gem_type` + tier instead |
| `prophecies` | 60 | league mechanic |
| `dungeons` | 29 | endgame content list |
| `relic_affixes` | 30 | |
| `runes` | 22 | |
| `mob_lists` | 17 | |
| `weapon_types` / `spell_schools` / `shrine_buffs` / `omens` | 13 / 12 / 10 / 9 | |

## Registries not yet mapped

Present in the pack or the jars, absent from `registry_map.REGISTRIES`. Counts are
jar / pack:

| Registry | Files | Wiki value |
|---|---:|---|
| `mmorpg_stat_condition` | 170 / 154 | when a conditional stat applies — needed to render conditional affixes |
| `mmorpg_stat_effect` | 98 / 137 | what a stat actually does on hit |
| `library_of_exile_item_requirement` | 92 / 2 | level and class requirements on gear |
| `mmorpg_stat_compat` | 30 / 72 | cross-mod stat mapping |
| `mmorpg_orb_extension` | 12 / 0 | currency orb behaviour |
| `mmorpg_stat_buff` | 12 / 12 | |
| `library_of_exile_map_content` | 9 / 6 | map content weighting |
| `mmorpg_gear_rarity` | 8 / 8 | **rarity tiers — referenced all over the site** |
| `library_of_exile_map_finish_rar` | 6 / 6 | |
| `mmorpg_chaos_stat` | 6 / 0 | |
| `ancient_obelisks_obelisk` | 1 / 5 | obelisk events |
| `the_harvest_harvest_arena` | 2 / 6 | Harvest arenas |
| `mmorpg_atlas_layout` | 1 / 1 | Atlas map layout |

## Not yet extracted

- **FTB Quests** (`config/ftbquests/quests/`, 21 chapters) — SNBT, needs its own parser.
  Source for campaign structure: Acts 0–V, ascendancy, professions, epilogue.
- **Patchouli guidebook** (`patchouli_books/cte2/`, 63 files) — dev-written prose, needs a
  converter for `$(...)` / `&c` formatting codes and `$(c:/ftbquests open_book <hash>)` cross-links.
- **Icons** — ~2,800 textures across the M&S jar and `resources.zip`.
