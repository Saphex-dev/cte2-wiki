# Wiki page structure

How the pack's systems ([`PACK_OVERVIEW.md`](PACK_OVERVIEW.md)) become pages.

Two rules govern everything here:

1. **Pages are generated from data.** A page type is written once and renders for every
   entry. Hand-written prose is additive, never the source of a number.
2. **No implementation vocabulary reaches a reader.** See §4 — this is a hard rule, not
   a preference, and §4.3 proposes making it enforceable at build time.

---

## 1. Sections

Five, matching the navigation rail already on the landing page.

| Section | Covers | Generated pages |
|---|---|---:|
| **Items** | uniques, base gear, affixes, runes and runewords, gems, support gems, sets | ~500 |
| **Character** | classes, skills, talents, ascendancy, stats, effects, auras | ~300 |
| **World** | dimensions, dungeons, mobs | ~50 |
| **Atlas** | atlas nodes, maps, prophecies, omens, bosses, relics | ~450 |
| **Crafting** | currency, professions, recipes | ~150 |

Plus **Guides** — entirely hand-written prose, living in Starlight.

Roughly 1,450 generated pages at full coverage. The proof of concept builds three.

---

## 2. Routes

```
/                                   landing

/items/                             section index
/items/uniques/                     filterable list of 251
/items/uniques/<name>/              one unique          ← the flagship page type
/items/sets/<name>/                 one armour set (6)
/items/base/                        43 base types
/items/base/<name>/                 one base type, with its rarity ladder
/items/affixes/                     reference tables, by pool
/items/runewords/                   60
/items/runewords/<name>/            one runeword
/items/gems/                        9 types x 8 tiers
/items/gems/<type>/                 one gem type across its tiers
/items/support-gems/                86

/character/                         section index
/character/classes/                 12
/character/classes/<name>/          one class, its skills and ascendancy
/character/skills/<name>/           one skill (267)
/character/talents/                 the passive tree
/character/ascendancy/              ascendancy trees
/character/stats/                   stat reference
/character/effects/                 buffs, debuffs, ailments (195)

/world/                             the run — the act ladder, full size
/world/<dimension>/                 one dimension (8)
/world/dungeons/                    29
/world/mobs/                        rarities, affixes, what lives where

/atlas/                             endgame index
/atlas/nodes/                       322
/atlas/maps/                        map modifiers (77)
/atlas/prophecies/                  60
/atlas/omens/                       9
/atlas/bosses/                      uber bosses and arenas
/atlas/relics/                      types, rarities, stats

/crafting/                          section index
/crafting/currency/                 84
/crafting/currency/<name>/          one currency item
/crafting/professions/<name>/       one profession (9)
/crafting/recipes/                  813, filtered by profession

/guides/<slug>/                     hand-written prose (Starlight)
```

Slugs come from the entry id, hyphenated. Ids never appear *in* a page — only in its
URL, where they are unavoidable and harmless.

---

## 3. Page types

Eight templates cover every generated page.

### 3.1 Unique item — the flagship

The tooltip (D5) is the page. Everything else arranges around it.

- **Tooltip block** — name in its rarity colour, base type, stat rolls with ranges, all
  on the mandated scrim.
- **Where it sits in the run** — the act ladder with this item's band lit. Derived from
  its drop level; worded as *position*, never as a drop location (D2).
- **How it is found** — only when the pack actually says. 39 of 251 name a mechanic;
  the other 212 say nothing, and the page must say nothing rather than inventing a
  "general pool".
- **Build tags** — playstyle keywords, derived from the stats it rolls.
- **Related** — same base type, same set, items sharing its signature stats.
- **Notes** — optional hand-written prose. The only editorial block, visibly editorial.

### 3.2 Skill

Description with values resolved and glyphs rendered as icons — never raw tokens.
Class, school, level requirement, what grants it.

### 3.3 Class

Identity, its skills, its ascendancy options, the stats it scales with, uniques tagged
for its playstyle.

### 3.4 Dimension

Level band, difficulty relative to neighbours, what lives there, dungeons found there,
its position in the run. Twilight Forest needs its brutal stat block explained in
words.

### 3.5 Currency item

What it can be used on, what must be true first, what it does — the three-part grammar
every one of the 84 shares. Written as English sentences, never as a predicate list.

### 3.6 Base gear / runeword / gem

Stat ranges by rarity; for gems, the three different results by socket type; for
runewords, the rune sequence and eligible slots.

### 3.7 Index / list

Filterable, sortable, dense. The Calamity lesson (D12): tight leading, multi-column,
small icons, minimal chrome. These carry most of the site's navigation.

### 3.8 Reference table

Stats, affix pools, map modifiers. Long sortable tables, searchable, no per-entry page.

---

## 4. The no-implementation-vocabulary rule

**Nothing that exists because of how the data is stored may appear on a page.** Not
field names, not registry names, not file paths, not JSON, not internal ids in prose.
A reader should never be able to tell what the extractor is called.

### 4.1 Translation table

| Data | Never write | Write |
|---|---|---|
| `min_drop_lvl: 70` | "min_drop_lvl 70", "requires level 70" | "Drops from level 70" |
| `min_tier: 20` | "min_tier 20" | "Found in tier 20 maps and above" |
| `league: prophecy` | "league: prophecy" | "Found through Prophecies" |
| `league: ""` | "General Drop Pool" | *say nothing* — the pack does not say |
| `weight: 1000` | "weight 1000" | omit, or "common among uniques" if it can be justified |
| `rarity: "unique"` | "rarity: unique" | the name's colour and frame already say it |
| `data.format: aqua` | never mentioned | just render the colour |
| `mob_tier: 3` | "mob_tier 3" | "the harshest band in the game" |
| `mob_strength_multi: 1.5` | "mob_strength_multi ×1.5" | "mobs hit half again as hard" |
| `origin`, `base_source` | never surfaced | — |
| `hide_from_wiki` | never surfaced | the entry simply is not there |
| `guid`, `identifier` | never in prose | slug in the URL only |
| `[VAL1]`, `[calc:x]`, `☀`, `★` | never raw | resolved value / icon |
| `learn_<spell>` | "learn_fireball" | "Grants Fireball" |
| `stat_percents: 86–100` | "stat_percents" | "rolls in the top 15% of its range" |
| registry names | `mmorpg_unique_gears` | — |
| collection names | "the uniques collection" | "unique items" |

### 4.2 Derived names must not ship raw

Twelve collections have no translated names, so the humanised id is a placeholder, not
a title. `Bastion Tier100`, `Amethyst0`, `Minecraft:Overworld` and
`Double Event Chance Node` are all unshippable. Each needs either a composed title
(gem type + tier) or a hand-written one. The act ladder already does this: its eight
titles are hand-written, each quoted from a lang key.

### 4.3 Make it enforceable

The rule will decay under contribution unless it is checked. Proposal: a build step
that scans rendered HTML for a denylist — field names, registry prefixes (`mmorpg_`,
`library_of_exile_`, `dungeon_realm_`), unresolved tokens (`[VAL`, `[calc:`), and the
known bad strings above — and fails the build on a hit.

Cheap to write, catches the failure mode that matters, and gives community contributors
an unambiguous signal instead of a style note nobody reads. Worth doing before the page
count grows.

---

## 5. Generated, hand-written, or both

| | Source | Editable by contributors |
|---|---|---|
| Numbers, stat lines, ranges, counts | generated, always | no — fix the extractor |
| Titles for derived-name entries | hand-written, cited | yes |
| "Notes" blocks on item pages | hand-written, optional | yes |
| Guides | hand-written | yes |
| Everything else | generated | no |

Cloudflare Web Analytics exists to answer one question: which pages earn a hand-written
Notes block. Do not write prose speculatively across 251 items; write it where readers
actually go.

---

## 6. Search

Every generated page must declare `data-pagefind-body` and its filter attributes —
section, item type, rarity, level band, build tags. This is the cost D1 accepted when
item pages moved off Starlight, and it is not optional polish: **search is the
build-discovery product.** A page that is not indexed does not exist.

---

## 7. Build order

1. **One unique item page**, end to end, with the tooltip, the ladder, tags and search
   attributes. Every later template borrows from it.
2. **The uniques index** — proves the filterable list type, and gives the landing
   page's 85 dead entries somewhere to point.
3. **Skills and classes** — the second-largest corpus, and the one needing the token
   renderer most.
4. **World and Atlas** — the act ladder already exists; dimensions are eight pages.
5. **Crafting** — currency has the cleanest grammar of any collection and will read
   well early.
6. **Reference tables** — stats and affixes last; highest volume, lowest traffic.
