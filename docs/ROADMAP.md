# CTE2 Wiki — Roadmap

Decisions, the data audit behind them, and the order of work. Written 2026-08-22
against pack **2.0.4 "Atlas Update"** and the extracted `data/` of the same date.

`CLAUDE.md` states the standing rules. This document records *why* the shape of the
site is what it is, and which of those rules were revised once the data was read.
When the two disagree, this file is the newer of the two — reconcile rather than
guess.

---

## 1. Data audit

Everything in this section was read out of `data/` or the reference instance. Nothing
is remembered or inferred unless it says so.

### 1.1 What a unique item actually carries

All 251 entries in `data/uniques.json` carry exactly these twelve `data` keys, with no
variation:

```
base_gear  guid  flavor_text  force_item_id  league  min_drop_lvl
min_tier   rarity  replaces_name  runable  unique_stats[]  weight
```

Distributions that matter:

| Field | Reality |
|---|---|
| `rarity` | `"unique"` on **all 251**. Not a variable. |
| `flavor_text` | Empty on **all 251**. The pack ships no lore prose for uniques. |
| `league` | Empty on 212. The other 39: prophecy 17, obelisk 5, uber 5, strongbox 4, harvest 4, imprisoned_monster 3, pinnacle 1. |
| `min_drop_lvl` | 1 on 58 items, then the decades 10–90 (plus a single 55). The strongest progression signal present. |
| `min_tier` | 0 on 183 — map tier gate, only meaningful on the other 68. |
| `weight` | 1000 on 219, reduced on 28, `0` on 4 (undroppable). |
| `runable` | `false` on all 251. |
| `replaces_name` | `true` on all 251. |
| `force_item_id` | Empty on 197; the other 54 point at a concrete mod item. |
| `group` | 47 values — base type, including six `set_armor/*` sets. |

**There is no drop-source field and no icon field.** Two things the visual design
assumed exist do not exist.

### 1.2 The dimension ladder — real, and unextracted

`mmorpg_dimension` is listed in the manifest as an unmapped registry. All eight pack
files were read. They are a complete, pack-authored progression ladder:

| Dimension | `min_lvl` | `max_lvl` | `mob_tier` | `mob_strength_multi` |
|---|---:|---:|---:|---:|
| `minecraft:overworld` | 1 | 15 | 0 | 1.0 |
| `minecraft:the_nether` | 10 | 30 | 0 | 1.1 |
| `undergarden:undergarden` | 25 | 40 | 1 | 1.2 |
| `blue_skies:everbright` | 35 | 55 | 1 | 1.3 |
| `blue_skies:everdawn` | 35 | 55 | 1 | 1.3 |
| `minecraft:the_end` | 50 | 65 | 2 | 1.4 |
| `deeperdarker:otherside` | 60 | 75 | 2 | 1.5 |
| `twilightforest:twilight_forest` | 90 | 100 | 3 | 1.5 |

Each also carries `secondary_lvl_range` (the endgame/map re-scaling band) and an
optional `stats` block — Twilight Forest is the only one that uses it, and it is
brutal: `more health 800%`, `+25% armor`, `+25% dodge`, `+25` elemental and chaos
resist.

Two gaps to respect: the bands **overlap** (10–15 is both Overworld and Nether), and
**76–89 is uncovered** by any primary band.

### 1.3 The rarity ladder

`mmorpg_gear_rarity`, also unmapped, is eight files:

| id | weight | `item_tier` | `text_format` | `stat_percents` |
|---|---:|---:|---|---|
| common | 729 | 0 | GRAY | 0–17 |
| uncommon | 243 | 1 | GREEN | 18–34 |
| rare | 81 | 2 | AQUA | 35–51 |
| epic | 27 | 3 | LIGHT_PURPLE | 52–68 |
| legendary | 9 | 4 | GOLD | 69–85 |
| mythic | 3 | 5 | DARK_PURPLE | 86–100 |
| unique | 6 | 5 | RED | 0–100 |
| runeword | 27 | 10 | YELLOW | 0–100 |

The six-tier ladder is a clean 3× curve; `unique` and `runeword` sit outside it.
`stat_percents` is the roll-quality band and is the honest way to express "how good is
this rarity" — better than weight alone.

These values are currently **hardcoded into the site** (colours in
`src/styles/tokens.css`, weights in `src/pages/index.astro`). They were checked against
the pack and are correct, but they violate the extractor rule and they drop
`item_tier` and `stat_percents`. See Phase 1.

### 1.4 Corrections to `docs/EXTRACTION_MANIFEST.md`

- **`library_of_exile_item_requirement` is not "level and class requirements on gear."**
  All 94 files were read. They are *predicates on an item* used to gate currency and
  orb application — `is_gear`, `is_rarity`, `has_no_enchants`, `is_under_quality`,
  `max_uses`, `has_socket_of_type`. Genuinely useful, but for a *crafting* reference
  ("which orbs can I use on this?"), not for item requirements. Requirements data has
  not been located.
- The manifest's "Wiki value" column is a set of predictions written before the files
  were opened. Treat every uninspected row the same way.

---

## 2. Decisions

### D1 — Custom routes own the item surface; Starlight keeps prose docs

Item pages, build search and the landing page are custom `src/pages/` routes sharing
one layout. Starlight keeps `src/content/docs/` for guides and reference prose.

*Why:* the design brief (hard 16px grid, zero radius, beveled edges) fights Starlight's
theme on every surface it touches. Confining that fight to prose pages is cheaper than
overriding Starlight components across hundreds of item pages. The landing page had
already taken this path in practice.

*Revises `CLAUDE.md`,* which says Starlight owns the page shell.

*Cost, accepted:* Pagefind indexes what Starlight renders. Custom routes must declare
`data-pagefind-body` and their filter attributes explicitly, or the item corpus is
invisible to search — and search **is** the build-discovery product. This is not
optional polish; it ships with the first item page.

### D2 — Backgrounds key on dimension only

`data-dimension` on `<html>` derives from `min_drop_lvl` against the §1.2 ladder. The
rarity axis is dropped from the background system.

*Why:* `rarity` is constant across every unique (§1.1), so five of the six procedural
tiers would never render on an item page. The brief already says rarity is carried by
the item name and frame — that stays true and now carries it alone.

*Revises `CLAUDE.md`,* which specifies an N×5 dimension×rarity matrix driven by a
drop-source field that does not exist.

*The honesty constraint:* level band → dimension is a **derived** association, not a
drop location. Bands overlap and 76–89 is uncovered. It may be labelled "around here in
the run" or similar. It may never be labelled "drops in." Getting this wrong is exactly
the class of plausible-looking error that embarrasses us.

*Deliverable is unchanged in size:* one tileable texture per dimension plus a bespoke
backdrop for the top tier, with CSS layers between. Eight dimensions, so eight
textures.

### D3 — Four layers, and facts may only live in one

| Layer | Holds | Never holds |
|---|---|---|
| **Extractor** (`extract/`) | A faithful mirror of pack registries. Diffable against the pack. | Interpretation, joins, presentation. |
| **View model** (site-side, new) | The flat item record. Stat joins, `learn_<spell>` resolution, dimension derivation, build tags. | Raw pack facts it invented. |
| **Token renderer** (site-side, new) | `[VAL1]`, `★`, `☀`, `[calc:]` substitution. | Anything item-specific. |
| **Templates** | Layout and markup. Read layers 2 and 3. | Direct `data/` reads. Hardcoded pack values. |

The distinction that makes this work: **a pack fact goes in the extractor; a join or an
interpretation goes in the view model.** "Mythic is DARK_PURPLE" is a pack fact.
"min_drop_lvl 70 sits in the Deeper Dark band" is an interpretation.

### D4 — Every rendered value declares its provenance

Three kinds of value appear on this site and they are not interchangeable:

- **Pack fact** — read from a registry. Render freely.
- **Derived** — computed by the view model from pack facts. Must be worded so a reader
  cannot mistake it for a pack fact.
- **Hand-written** — editorial prose. Must be visibly editorial, and belongs in a
  Starlight doc or a clearly-marked block, never inline in a generated stat table.

---

## 3. Phase order

Dependency order, not priority order. Each phase leaves the build green.

### Phase 1 — Extractor: dimensions and rarities

Schema first: update `extract/README.md` § *Entry shape* and
`docs/EXTRACTION_MANIFEST.md` **before** writing logic.

- Map `mmorpg_dimension` → `data/dimensions.json` (8 entries).
- Map `mmorpg_gear_rarity` → `data/rarities.json` (8 entries), carrying `item_tier`
  and `stat_percents`, not just weight and colour.
- Delete the hardcoded rarity values from `tokens.css` and `index.astro`; generate the
  colour custom properties from `rarities.json`.
- Re-run extraction and confirm byte-identical output for untouched collections.

### Phase 2 — Token renderer

`[VAL1]`-family placeholders, `★` and `☀` glyph→icon mapping, and `[calc:<id>]`
resolution against `value_calcs.json` (258 refs, all resolving). One module, used by
every surface.

`index.astro` currently carries a local partial version in `renderRoll()`, including a
hand-tuned rule about `%` belonging to the value rather than the label. That rule is
real and should be carried across, then the local copy deleted.

### Phase 3 — Item view model

The flat item record that does not exist today. Per unique: name, base type, group,
stat lines with resolved names and roll ranges, level band, derived dimension, league
mechanic, build tags, set membership.

Decide here whether `data/` becomes a content collection via a `file()` loader or the
view model imports JSON directly. `CLAUDE.md` requires this be proposed before it is
built — it changes how every page reads data.

### Phase 4 — Item page template + three uniques

The proof-of-concept deliverable. Dimension background, act ladder in the header,
scrim behind every stat block. Pagefind attributes from the first page (D1).

### Phase 5 — Build tagging

A reviewed `stat_id → tag` map across all 1,151 stats, with a controlled vocabulary.

The landing page prototypes this with six regexes over stat ids (`/chaos|poison/` and
similar). That is a demo technique: it is an invented vocabulary living in a template,
it silently mismatches on stats whose ids do not contain the obvious substring, and it
does not survive review by anyone who knows the pack. Generate the map once, have it
checked, commit it as data.

### Phase 6 — Act ladder and dimension art

Eight tileable textures, one bespoke top-tier backdrop, CSS layers between. Palettes
sampled from the pack's own sky/fog and signature blocks rather than chosen.

---

## 4. Open risks

| Risk | Detail |
|---|---|
| **Icons** | ~2,800 textures across the M&S jar and `resources.zip`, none extracted. Item pages without icons read as unfinished, and "do not commit pack assets wholesale" means someone must choose the subset. Unresolved. |
| **Monocraft is not installed** | `tokens.css` falls back to IBM Plex Mono for headings. Nobody has yet seen the intended type. Self-host before judging the design. |
| **No lore copy exists** | `flavor_text` is empty on all 251 uniques (§1.1). Dev-written prose lives in the Patchouli guidebook, which has no parser. Item pages will be all-stats until that changes. |
| **Uncommitted work** | `src/pages/index.astro` and `src/styles/tokens.css` are untracked, and `src/content/docs/index.mdx` is deleted but unstaged. Commit before the next phase. |
| **Starlight scaffold** | `guides/example` and `reference/example` are still the only docs pages, and the landing page's nav links to `/guides/example/`. Replace before showing anyone. |
| **Cloudflare build ceiling** | 500 builds/month. Batch PR merges once contributions start. |

## 5. Out of scope for the proof of concept

Named so they are not drifted into: FTB Quests parsing (campaign structure), the
Patchouli guidebook converter, profession recipes (813), the Atlas passive tree,
mob pages, and the currency/orb crafting reference that §1.4 makes possible.
