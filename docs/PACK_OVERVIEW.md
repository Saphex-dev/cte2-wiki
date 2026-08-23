# Craft to Exile 2 — Systems Overview

**v2.0.4 "Atlas Update"** · Minecraft 1.20.1 / Forge 47.4.22 · 405 CurseForge files

What the pack contains, by system. Every count and value here was read out of `data/`
or the reference instance — nothing is remembered or reconstructed. Where a number is
*derived* rather than stated by the pack, it says so.

This is a map of the territory, written to decide what the wiki covers and in what
order. It is not the wiki. For how the data is produced see
[`../extract/README.md`](../extract/README.md); for what exists in what quantity,
[`EXTRACTION_MANIFEST.md`](EXTRACTION_MANIFEST.md); for the decisions built on top,
[`ROADMAP.md`](ROADMAP.md).

**Extracted total: 5,869 entries across 37 collections**, plus 3 talent trees holding
1,786 placed nodes.

---

## 1. Character

### Classes

Twelve, each a folder of spells in `mmorpg_spells`:

| Class | Spells | | Class | Spells |
|---|---:|---|---|---:|
| Shaman | 24 | | Rogue | 18 |
| Elementalist | 23 | | Hunter | 17 |
| Crusader | 20 | | Fighter | 16 |
| Cryolancer | 19 | | Sanguimancer | 16 |
| Warlock | 19 | | Minstrel | 14 |
| Brawler | 18 | | Chronomancer | 12 |

216 class spells of 267 total; the remainder are plumbing — summon behaviours, cast
sounds, mob-cast spells, gear-granted spells, identifiers.

> **The pack disagrees with itself on two class names.** `spell_schools` lists
> `sorcerer` and `warrior`; the spell folders say `elementalist` and `fighter`. Both
> sources give twelve. The folders are what actually carry the spells. Which name a
> player sees in game is unresolved and worth checking before publishing class pages.

### Skills

267 spells. Descriptions carry two inline conventions that must be rendered, not
stripped:

- **`[calc:<id>]`** — a reference into `value_calcs` (253 entries) holding the real
  number. All 258 references resolve. Example, `fire_golem_basic`:
  *"Attack dealing `[calc:pet_basic]` ☀ Fire Damage to a single enemy."*
- **Glyphs** — `☀` marks a damage type, `★` an attribute. They need mapping to icons.

`[VAL1]`-style placeholders appear in stat names for the same reason.

### Talents and ascendancy

Three trees, 1,786 placed nodes, every one resolving to a perk:

| Tree | Nodes |
|---|---:|
| Talents (main passive tree) | 1,321 |
| Ascendancy | 243 |
| Atlas passives | 222 |

Backed by **1,064 perks**. Only 364 are translated; the rest fall back to a humanised
id and need hand-written titles.

### Stats and effects

**1,151 stats.** 619 declare a `format` — the colour the game prints them in: aqua on
572, red on 26 (damage over time, leech, crit damage), green on 10 (durations, regen,
projectile speed), yellow on 9 (healing), blue on 2 (area damage).

> **353 stats are registered in the mod's Java and ship no definition at all** — an
> empty `data` object, name and description only. `health`, `mana` and `armor` are
> among them. Anything reading a stat's numeric definition, unit, or colour has to
> tolerate their absence.

**195 exile effects** — buffs, debuffs and ailments (Physical Agony, Arachnid
Inoculation, Banner of the Blizzard…). **28 auras.**

`learn_<spell>` appearing in a perk's or affix's stat list is not a stat — it grants a
skill. 142 of 145 resolve; the other three point at deprecated spells.

---

## 2. World

### Dimensions — the run

The pack assigns every dimension a level band. **Mobs scale to the band, not to the
player.**

| Dimension | Levels | `mob_tier` | Mob strength |
|---|---|---:|---:|
| Overworld | 1–15 | 0 | ×1.0 |
| The Nether | 10–30 | 0 | ×1.1 |
| Undergarden | 25–40 | 1 | ×1.2 |
| Everbright | 35–55 | 1 | ×1.3 |
| Everdawn | 35–55 | 1 | ×1.3 |
| The End | 50–65 | 2 | ×1.4 |
| Otherside | 60–75 | 2 | ×1.5 |
| Twilight Forest | 90–100 | 3 | ×1.5 |

The bands **overlap** and leave a **gap** — nothing covers 76–89. Both are the pack's.
A ninth entry, `default`, is the mod's catch-all for unconfigured dimensions.

Twilight Forest is the only dimension carrying its own stat block, and it is punishing:
`more health 800%`, `+25%` armor, `+25%` dodge, `+25` elemental and chaos resist.

Display names are hand-written, quoted from each mod's own lang key — the pack does not
translate them.

### Dungeons and mobs

**29 dungeons**, each a room-graph definition (entrances, hallways, four-ways, ends)
gated by mob-list tags. **17 mob lists**, **190 entity mappings**, **25 mob affixes**.

**10 mob rarities**, with the multipliers that make the difference:

| Rarity | Weight | Damage | XP / loot |
|---|---:|---:|---:|
| Common | 1024 | ×1.0 | ×1.0 |
| Uncommon | 256 | ×1.15 | ×1.25 |
| Rare | 64 | ×1.3 | ×1.75 |
| Epic | 16 | ×1.45 | ×2.75 |
| Legendary | 4 | ×1.6 | ×4.75 |
| Mythic | 1 | ×1.75 | ×8.75 |
| Summon | — | ×1.3 | ×1.5 |
| Boss | — | ×1.9 | ×10.5 |
| Uber | — | ×2.05 | ×15.5 |
| Pinnacle | — | ×2.35 | ×20.0 |

The weighted six form a clean ×4 ladder. The four with weight 0 are not rolled — they
are placed.

---

## 3. Gear and itemisation

### Base gear and slots

**43 base gear types** across **23 gear slots** and **13 weapon types**. Each base type
maps to concrete item ids per rarity tier — `axe` → `roe_weapons:axe_0` … `axe_5` —
which is also how the wiki resolves item icons.

### Rarity

Read from `mmorpg_gear_rarity`. **Not yet extracted into `data/`** — this is Phase 1.

| Rarity | Weight | Tier | Colour | Roll quality |
|---|---:|---:|---|---|
| Common | 729 | 0 | GRAY | 0–17% |
| Uncommon | 243 | 1 | GREEN | 18–34% |
| Rare | 81 | 2 | AQUA | 35–51% |
| Epic | 27 | 3 | LIGHT_PURPLE | 52–68% |
| Legendary | 9 | 4 | GOLD | 69–85% |
| Mythic | 3 | 5 | DARK_PURPLE | 86–100% |
| Unique | 6 | 5 | RED | 0–100% |
| Runeword | 27 | 10 | YELLOW | 0–100% |

The six-tier ladder is a clean ×3 curve. `stat_percents` — the roll-quality band — is
the honest measure of a tier, better than weight alone.

### Uniques

**251**, across 47 base-type groups including six armour sets (Genji, Granats, Jubbans,
Last Tracker, Mage Hunter, Oath of Mahj). 50 more are flagged `hide_from_wiki`.

Each carries a stat roll list, a `min_drop_lvl` (1–90), a `min_tier` map gate, a drop
weight, and a `league`. Three things a wiki must not get wrong:

- **`rarity` is the constant `"unique"` on all 251.** The six-tier ladder above governs
  *rolled* gear, not uniques.
- **`min_drop_lvl` is a drop level, not an equip requirement.** No requirement data
  exists anywhere in the collection.
- **`flavor_text` is empty on all 251.** The pack ships no lore prose for uniques.

`league` is the only field resembling a drop source, and it is empty on 212. The other
39: prophecy 17, obelisk 5, uber 5, strongbox 4, harvest 4, imprisoned monster 3,
pinnacle 1.

### Affixes

**489**, in ten pools:

| Pool | Count | | Pool | Count |
|---|---:|---|---|---:|
| Enchant | 106 | | Watcher's Eye | 31 |
| Suffix | 70 | | Tool | 19 |
| Prefix | 69 | | Crafted jewel unique | 16 |
| Implicit | 63 | | Jewel corruption | 16 |
| Jewel | 52 | | Chaos stat | 47 |

### Runes and runewords

**22 runes** (Ano, Bri, Cen, Daw, Dos, End…) and **60 runewords**. A runeword is a rune
sequence, the slots it applies to, and the stats it grants. *Abyssal Depths* =
`ano + net + mos` in a chest, granting +40–50% gear defense, +5–10 health, +6–12 energy,
+10–25 summon damage.

### Gems and support gems

**72 skill gems** — nine types (amethyst, azurite, emerald, garnet, opal, ruby,
sapphire, topaz, tourmaline) at eight tiers each. A gem grants *different stats
depending on what it is socketed into*: `on_armor_stats`, `on_jewelry_stats`,
`on_weapons_stats`. Names are derived (`Amethyst0`) and should be rendered from
`gem_type` + `tier` instead.

**86 support gems**, **94 item modifications.**

---

## 4. Endgame and Atlas

| System | Count | Notes |
|---|---:|---|
| Atlas nodes | 322 | the 2.0 headline feature; tiered (Bastion, Bastion Tier10…Tier100) |
| Atlas passive tree | 222 nodes | a third passive tree, for maps |
| Map affixes | 77 | modifiers rolled onto maps and dungeons |
| Prophecies | 60 | filed by gear type (Axe, Bow, Brigandine Boots…). Whether these are what the 17 uniques tagged `league: prophecy` drop from is **unverified** |
| Omens | 9 | Blood, Echoes, Fangs, Flames, Mirrors, Shadows, Spite, Storms, Waves |
| Shrine buffs | 10 | Acceleration, Brutal, Charges, Critical Strikes, Impenetrable… |
| Boss arenas | 5 | Arena, Biome, Mine, Moo, Sandstone |
| Uber bosses | 4 | |

### Relics

**5 types** (Mmorpg, Dungeon Realm, Ancient Obelisks, The Harvest, Empty), **6
rarities**, **32 relic stats**, **30 relic affixes**. Relic stats are drop-rate
modifiers — currency drop rate, gear drop rate, gem drop rate, uber fragment drop rate,
chance of any content.

---

## 5. Economy and crafting

### Currency

**84 currency items** — mostly orbs, plus a few map-modifying items (Add Spawn Rate,
Add Tier, Add Wave). Spread across rarities: rare 24, legendary 17, uncommon 15,
epic 13, mythic 10, unique 2, common 2, runeword 1.

Every one has the same grammar: what it can be applied to, what must be true before it
can be, and what it does.

#### Worked example — Orb of Knowledge

```jsonc
id:                     "omen_rarity_random_upgrade"
rar:                    "legendary"
item_type_requirement:  ["is_omen"]
req: [ "is_not_corrupted", "is_not_mirrored",
       "omen_has_higher_rar", "max_uses_codex_rarity_uses" ]
always_do_item_mods:  [ "upgrade_omen_rarity",
                        "increment_uses_codex_rarity_uses" ]
potential:            { needs_potential: true, potential_cost: 0 }
```

Read as English: *a legendary orb, usable only on an omen that is not corrupted, not
mirrored, still has a higher rarity available, and has not exhausted its rarity-upgrade
uses. It raises the omen's rarity and burns one use.*

The `req` entries are the `library_of_exile_item_requirement` registry — 94 predicates
covering `is_gear`, `is_rarity`, `has_no_enchants`, `is_under_quality`,
`has_socket_of_type`, `max_uses` and more. That registry is **currency applicability**,
not gear requirements, and it is the natural backbone of a crafting reference.

### Professions

Nine. Note that three display under a different name than their id:

| Id | Display | Recipes |
|---|---|---:|
| `alchemy` | Alchemy | 302 |
| `cooking` | Cooking | 216 |
| `gear_crafting` | Gear Crafting | 150 |
| `enchanting` | **Infusing** | 145 |
| `farming` | Farming | — |
| `fishing` | Fishing | — |
| `husbandry` | **Bounty Hunting** | — |
| `mining` | Mining | — |
| `salvaging` | Salvaging | — |

**813 recipes, all in four professions.** The other five are progression tracks with XP
sources and tiered drops rather than recipe lists.

---

## 6. Reading this data safely

Four traps, all of which have already caught someone:

1. **`origin: "code"` entries have an empty `data` object.** 353 stats. Anything
   reading `data.<field>` must tolerate `{}`.
2. **`name_source: "derived"` means there is no real name** — it is the id with
   underscores stripped. Twelve collections are entirely derived, including
   `atlas_nodes`, `map_affixes`, `prophecies`, `gems` and `dimensions`.
3. **Names and descriptions carry inline tokens.** `[VAL1]`, `[calc:…]`, `☀`, `★`. Raw
   output looks broken.
4. **The pack overlays the mod defaults file by file — it does not replace them.**
   Reading only the pack's datapack silently loses 1,481 entries, including every core
   stat.

## 7. Not yet extracted

- **FTB Quests** (`config/ftbquests/quests/`, 21 chapters, SNBT) — the campaign
  structure: **Acts 0–V**, ascendancy, professions, epilogue. This is the pack's own
  narrative spine and the wiki has none of it.
- **Patchouli guidebook** (`patchouli_books/cte2/`, 63 files) — dev-written prose, the
  only real lore text in the pack.
- **Icons** — 223 item ids resolve to textures across the mod jars; none extracted yet.
- **Registries still unmapped**, most valuable first: `mmorpg_gear_rarity`,
  `mmorpg_stat_condition` (when a conditional stat applies), `mmorpg_stat_effect` (what
  a stat does on hit — the missing piece for stat units and colours),
  `library_of_exile_item_requirement`, `mmorpg_atlas_layout`.
