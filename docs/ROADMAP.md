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

### 1.5 Icons — the mapping exists, and it is small

The manifest lists "~2,800 textures" as an unsolved problem. The number the wiki
actually needs is **223**, and the mapping to reach them is already in `data/`.

`base_gear.possible_items` maps each of the 43 base types to concrete item ids, one
per rarity tier:

```jsonc
"possible_items": [
  { "item_id": "roe_weapons:axe_0", "min_rar": "common",    "weight": 1 },
  { "item_id": "roe_weapons:axe_5", "min_rar": "mythic",    "weight": 100000 }
]
```

Add the 54 uniques carrying an explicit `force_item_id` and the set is 223 distinct
item ids, across 10 namespaces — `roe_weapons` 108, `cte_essentials` 72,
`cte2modpackarmors` 28, the rest single digits.

Resolution chain, verified end to end: `item_id` →
`assets/<ns>/models/item/<name>.json` → `textures.layer0` →
`assets/<ns>/textures/<path>.png`. **220 of 223 resolve.**

Known exceptions:

- `minecraft:elytra` and `minecraft:trident` have no simple item model — they are
  special-rendered by the game. Two items, need hand-supplied art.
- `born_in_chaos_v1:great_reaper_axe` has a model whose `layer0` texture is missing
  from the jar.
- **Some models are multi-layer.** `blue_skies:horizonite_axe` resolves to
  `handle_short.png` — the handle, not the axe. Taking `layer0` alone yields a
  partial icon for these. They need the layers composited. The count of affected
  items has not been measured yet; measure before building the pipeline.

**There are no per-unique textures.** The M&S jar was searched for `starforge`,
`voltaxic` and `quill_rain` — nothing. A unique renders as whatever base-gear item it
sits on, so every greatsword unique shares one icon. This is a design constraint, not
a gap to be filled: see D5.

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

### D5 — The item tooltip is the signature component

The in-game item tooltip becomes the core visual unit of the site. Item pages are
built around it; index pages quote it. Beveled frame, rarity-coloured name, base type
and level line, stat rolls on a dark scrim.

*Why:* in Path of Exile and in Mine and Slash, the tooltip **is** the visual identity
of the genre — players read one at a glance. Adopting it gives four things at once:
a job for the bevel the brief calls its signature, the natural home for rarity colour,
the natural home for the mandated scrim, and a component that scales to hundreds of
items with no per-item work.

*It is also forced by the data.* §1.5 establishes there is no per-unique art. If the
picture cannot carry identity, the frame and the type must. A design that leaned on
item imagery would have nothing to lean on.

*The line it must not cross:* this is ARPG grammar, not Minecraft cosplay. The brief's
warning about dirt-texture headers and cobblestone borders still stands. Reference the
tooltip's structure and proportions, not its literal pixels.

*Consequence for the landing page:* it currently renders three uniques as bespoke
cards. Those become tooltips, and the component moves out of the page into shared code.

### D6 — Icons are a curated subset, extracted by the pipeline

The extractor gains a step that resolves the 223 item ids of §1.5 and writes only
those textures into `public/`, with a manifest joining item id to file.

*Why:* it satisfies "do not commit pack assets wholesale" by construction, it
regenerates on a pack update like everything else, and 223 files is a size nobody has
to think about. The alternative — dumping ~2,800 textures and filtering at build —
inverts the rule and bloats the repo permanently.

*Open work before building it:* count the multi-layer models and decide whether to
composite them at extraction time or accept partial icons. Compositing needs an image
library, which is a new dependency and therefore needs asking first — the extractor is
stdlib-only today.

*Scope discipline:* icons are texture, not subject. A 32px mark inside the tooltip.
They are not hero images, and they must never be the thing a page's layout depends on,
because 220 of them are shared across base types.

### D7 — Monocraft is self-hosted, and confined to display sizes

Self-host Monocraft. Use it for headings, item names, and the wordmark. Never for body
copy, and never for stat lines.

*Why the restriction:* pixel faces lose legibility below roughly 16px, and the stat
tables are the one place on this site where legibility is not negotiable — they are
the reason players came. Plex Sans and Plex Mono keep body and numerics.

*Why it moved up the queue:* with no per-item art (§1.5), typography is the primary
carrier of character rather than a finishing touch. Until the font is installed, every
heading falls back to Plex Mono and **nobody has seen the intended design** — including
us. Judge nothing until it renders.

*Check before bundling:* confirm the licence permits redistribution in this repo.

### D8 — Chrome and data palettes are separate

Rarity colours are reserved for rarity. UI chrome — headings, rules, links, panel
borders — draws from its own neutral set.

*Why:* the landing page currently spends `--r-rare` (AQUA) on five panel headings,
plus `--r-legendary` and `--r-unique` as accent chrome. Harmless in isolation, but the
site is teaching players that aqua means rare and gold means legendary. Once item pages
exist, decorative aqua headings actively mislead. A colour cannot be both a label and a
decoration.

*This is a correction, not a preference.* It falls straight out of D4: rarity colour is
a rendered pack fact, and pack facts do not get borrowed for atmosphere.

### D9 — The brand palette is sampled from the icon, and it is quarantined

The site palette derives from the CurseForge icon, read off the pixels rather than
chosen:

| token | hex | role |
|---|---|---|
| `--brand-violet` | `#844DEC` | wordmark, left two-thirds |
| `--brand-magenta` | `#C730ED` | wordmark, at the numeral |
| `--brand-lavender` | `#C57EFF` | wordmark outer rim |
| `--brand-violet-deep` | `#472281` | wordmark counters and shading |
| `--stroke` | `#211533` | glyph and edge outline |
| `--bg` | `#231E2A` | night — page ground |
| `--bg-earth` | `#2B1A12` | earth — page foot |
| `--accent` | `#FFDEDB` | torch — links and emphasis |

*Why sampled:* the brief's "prefer extracted values over invented ones" applies to
colour as much as to stat lines. A palette taken from Mahjerion's own icon is one he
will recognise.

**The quarantine is the load-bearing part.** Saturated violet and magenta sit directly
on top of two pack rarity hues — `--r-epic` is LIGHT_PURPLE `#ff55ff` and `--r-mythic`
is DARK_PURPLE `#aa00aa`. Those are pack facts and cannot move, so the brand must.
Therefore:

- **Saturated brand violet and magenta appear in the wordmark and nowhere else.** Not
  as a heading colour, not as a link, not as a border.
- **Chrome draws from the dark end** — `night`, `earth`, `stroke`, `--line #2E2740` —
  plus `torch` for anything interactive. Torch is the one colour in the sampled set
  that collides with no rarity tier, which is precisely why it inherits the job the
  borrowed aqua was doing.
- **The ground turns warm.** `#231E2A` grading to `#2B1A12`, replacing the cold
  `#0b0d12`. Warm dark reads as Minecraft; blue-black reads as a developer tool.

*Also settled here:* the bevel moves from 1px to 2px. At 1px it was indistinguishable
from a plain rule on screen, so the element the brief calls the signature was doing no
work at all.

### D10 — Press Start 2P is the display face; Plex keeps body and stat lines

**Revised 2026-08-22, same day.** D10 originally confined Press Start 2P to the
wordmark. That was overruled deliberately: the blocky face is the character of the
site, so it now carries headings, panel titles, nav, group labels and item names as
well as the mark. Monocraft is demoted to a fallback behind it and is no longer
blocking (D7's install task stands, but nothing waits on it).

**Where the line actually falls, and why it is a measurement rather than a taste.**
Press Start 2P advances a full em per glyph — every character is a square box — so a
string is roughly 1.7× the width it would be in Plex Mono. Against the 1,151 real stat
names at 13px:

| | median | p90 | longest |
|---|---|---|---|
| Press Start 2P | 325px | 728px | 1,859px |
| IBM Plex Mono | 195px | 437px | 1,115px |

The content column is about 640px, so at p90 the line is already wider than the column.
Rendered, a *median-length* stat name — "Physical as Added Lightning Damage" — wraps to
**three lines** inside an item card, and the 143-character longest would run to roughly
twelve. Nav labels overflow their rail, and the rarity ladder breaks onto two rows.

So: **body prose and stat lines stay on the Plex family.** Not as a style preference —
the stat tables are the reason players visit, and a face that triples their height is
not serving them. Revisit if a narrower blocky face is found that holds up at 13px.

Two smaller rules that fall out of the same fact:

- **Small labels in narrow columns stay on mono.** "Weapons and offhand" in the display
  face is ~255px inside a 128px column. Anything under ~12px in a constrained column
  belongs to `--font-mono`.
- **Never ask for a weight Press Start 2P does not have.** It ships one. Requesting 600
  makes the browser synthesise a bold and smears the pixel grid. Likewise
  `letter-spacing` must stay at `normal` — fractional tracking puts stems between
  pixels.

*The wordmark should still ship as SVG.* The current component reproduces the outer
rim, dark outline and glow with `-webkit-text-stroke`, `paint-order` on HTML text and a
`z-index:-1` pseudo-element — Chrome-favouring, fragile against stacking contexts, and
unable to draw the inner line that gives the original glyphs their neon-tube
cross-section. A wordmark also has to survive as a favicon, an OG image, a README
banner and a Discord embed, none of which run CSS.

*The wordmark should ship as SVG, not CSS.* The current study reproduces the outer
rim, the dark outline and the glow with `-webkit-text-stroke`, `paint-order` on HTML
text and a `z-index:-1` pseudo-element — Chrome-favouring, fragile against stacking
contexts, and unable to reproduce the inner dark line that gives the original glyphs
their neon-tube cross-section. More decisively, a wordmark has to work as a favicon, an
OG image, a README banner and a Discord embed, none of which run CSS. As an asset it is
portable and pixel-exact; as a runtime effect it is neither.

### D11 — The pixel face is reserved for two roles

`--font-pixel` (Press Start 2P) sets **the wordmark** and **an item's own name**.
Nothing else. Not panel titles, not nav, not section headings, not labels.
Structural display goes to `--font-display`; body and stat text to the Plex family.

*Why, after D10 briefly put it everywhere:* applied across six levels of hierarchy —
hero heading, panel titles, nav, group labels, playstyle names, item names — the face
stopped reading as an accent and became the page's body texture. The result looked
cartoony. Character comes from contrast, and at six levels there was nothing left to
contrast against. Press Start 2P's caps also fill nearly the whole em where Plex Sans
fills about 70%, so 16px of it reads like 22px of a normal face and everything shouts
at once.

*Why by role and not by keyword:* the alternative considered was stylising selected
words. That means someone decides which words are special on every page — hand-tagging,
which does not survive three hundred item pages. A role is automatic: "an item's name
is blocky" needs no human judgement and holds across the whole item set.

*Why these two roles specifically:* the item name is the single most important string
on an item page and the thing players scan for, so making it the loudest element is
semantic rather than decorative. And both roles are short and can afford the width.

*Sizing rule:* pixel text sits at multiples of 8 — 8, 16, 24, 32. The face is drawn on
an 8px grid and interpolates at anything between, which reads as cheap rather than
small. Item names are 16px for this reason. It also ships one weight, so never request
a bold, and `letter-spacing` stays `normal`.

**This supersedes D10's promotion of the face to display duty.** The width measurement
recorded in D10 stands and is why body and stat text were never in scope.

### D12 — The pack owns the logo; the wiki owns the chrome

**Mahjerion's logotype is the only mark on the page.** The wiki names itself in text.
Our identity comes from palette, layout, density, typography and icons — never from a
second logo competing with his.

*Measured from the Official Calamity Mod Wiki* rather than recalled, since it is the
model this site was already built against:

| | |
|---|---|
| Brand band | 2545 × 240px — **10.6 : 1** |
| Backdrop | `Site-background.jpg` on `body`, `cover`, `50% 0%`, `no-repeat`, fallback `#43100E` |
| Marks on the page | **one** — the mod logotype. No wiki wordmark anywhere |
| Wiki's own name | plain text: "Welcome to the Official Calamity Mod Wiki" |
| Chrome | thin borders, dense 3–4 column link lists, one accent border on the welcome panel |
| Texture | hundreds of 16px sprite icons, not large artwork |

Two structural lessons. The atmosphere is a **page-level backdrop with the logo floating
over it**, not a composite image in a box — so it bleeds full width and content sits on
top. And the chrome below is deliberately plain: all the brand spend goes into one band.

*Why this settles our two-marks problem, and in which direction:* the pixel `CTE2`
wordmark was designed from the icon's **palette** before anyone had seen Mahjerion's
**logotype**, which is ornate and metallic and nothing like pixel art. Two visual
languages 40px apart read as two projects. Since the goal is to become the official
CTE2 wiki, the resolution is the one an official wiki always takes: inherit the parent
brand, express yourself in chrome.

**The pixel mark survives as the favicon only.** At tab size an ornate logotype is
illegible, and a four-glyph wordmark in a row would be four pixels per glyph — so it is
stacked 2×2. `public/favicon.svg` is generated by `scripts/genfavicon.py` from the real
Press Start 2P glyph bitmaps, read out of the font by rendering each glyph to a canvas
and downsampling to the face's native 8px grid. The colours come from the same ramp as
the wordmark and land on `#844dec #844dec #9545ec #c730ed`, identical to the compact
lockup in the original study. Verified rendering at 256/64/32/16px.

*Banner sizing is measured, not chosen.* The source is 560×300 and the logo's pixels
occupy rows 114–181, so a centred crop can reach **7.78 : 1** before it cuts
letterforms. The slot runs at 7 : 1, leaving about 4px of margin. Anything shorter needs
a different asset.

**Two asks of Mahjerion, both blocking the better architecture:**

1. **The logotype as a transparent PNG**, separate from the scene. With the logo on its
   own, the band can be any height and the atmosphere can move to a page backdrop the
   way Calamity does it. The baked composite is what forces the box.
2. **A higher-resolution source.** 560px is upscaled about 2× at the content column and
   is visibly soft.

### D13 — Colour is applied where the pack applies it, not where a word feels important

**Supersedes the exclusivity clause in D8.** The question "can we colour the important
words" has a data answer: **the pack already decides which words are coloured and what
colour they are.**

`stats.json` carries `data.format` on **619 of 1,151** stats, naming a Minecraft chat
colour:

| format | count | what it marks |
|---|---:|---|
| aqua | 572 | the default for stat text |
| red | 26 | damage over time, leech and steal, attack and crit damage |
| green | 10 | durations, regen, projectile speed |
| yellow | 9 | healing, crit chance |
| blue | 2 | area damage |

Rarities carry `text_format`, and so do `gems` (72), `mob_affixes` (25),
`mob_rarities` (10) and `relic_rarities` (6). None of it needs inventing.

**D8 said rarity colours were reserved to rarity and could never appear elsewhere. That
was wrong about how the pack works.** The pack formats text by naming one of Minecraft's
16 chat colours and reuses them across systems — AQUA is both the `rare` rarity *and*
the colour of 572 stat lines. The overlap is the game's, not ours.

So the test is provenance, not exclusivity: **did a registry tell us to use this colour
here?** Aqua on a stat line is the pack's instruction and matches what the player sees
in their inventory. Aqua on a panel heading is a designer's whim wearing a pack colour's
clothes — still forbidden, and still the actual defect D8 was reacting to.

*A correction this forces:* the D8 pass moved stat values off aqua onto `--ink`, on the
reasoning that aqua was a borrowed rarity colour. The colour was right and the source
was wrong — it pointed at `--r-rare` rather than at the stat's own format. Stat text is
aqua again, now driven by `data.format`.

**Where hand-picked emphasis is still legitimate.** Generated content — stat lines, item
names, rarities — is coloured from data and never by hand; that is what survives three
hundred pages. Hand-written prose is finite, so editorial emphasis there is fine, but it
uses **weight and brightness, not hue**. Hue means something on this site. Reserving it
keeps the meaning readable.

*Known gap:* 532 stats carry no format, almost all of them the code-origin stats that
ship an empty `data` object — the same 353 that block unit rendering in §4.5. They fall
back to aqua, which 92% of formatted stats use. That fallback is derived, not
pack-stated (D4), and closing it needs the same unmapped `mmorpg_stat_effect` registry.

### D14 — The fire band is the landing page's alone *(built, currently disabled)*

> **Disabled 2026-08-22**, same day it was built, pending a decision on what earns the
> bottom of the viewport. `FireBand.astro` is intact and re-enabling is one import plus
> one tag. Everything below still applies if it comes back.

A Minecraft-style fire animation runs along the bottom eighth of the viewport on the
landing page, cross-fading from ember orange to void violet as the reader scrolls.

*The palette is extracted, not chosen.* It is the modal colour of each luminance band
of vanilla `assets/minecraft/textures/block/fire_0.png` — the 16×512, 32-frame
animation strip — read out of the 1.20.1 client jar:

`#b64800` `#bb5100` `#d28108` `#dfa21a` `#eecc54` `#ffffff`

The violet end is built from the brand palette sampled from Mahjerion's icon.
Deliberately **not** `--mc-dark-purple` — that hex is the mythic rarity, and a rarity
colour spent on decoration is exactly what D13 still forbids.

**Landing page only. It must not follow us onto item pages.** Three reasons:

1. D2 already gives item pages a background system keyed to dimension. Two competing
   atmospheres on one page is one too many.
2. D12's lesson from Calamity is that the brand spend goes into *one* place and the
   chrome stays plain. The landing page is the pitch surface and gets to be loud; three
   hundred reference pages do not.
3. A permanent animation on every page is a battery cost paid by someone reading a stat
   table.

*Implementation constraints, all load-bearing:*

- **The cellular fire automaton on a canvas sized in whole 8px cells**, upscaled with
  `image-rendering: pixelated`. A CSS gradient would be smooth, and smooth is wrong —
  the point is that it is actually blocky. Cost is a few thousand cell updates a frame.
- **`prefers-reduced-motion` gets one settled static frame and no animation loop.**
- The loop also halts on `document.hidden` and when the band leaves the viewport.
- **Anything sitting over the band carries its own scrim.** The footer is the only such
  block and now has one; without it the flames ate the text outright. This is the
  brief's non-negotiable rule, and it bit immediately.

*Worth designing toward:* the orange→violet descent is decoration today, but the
dimension ladder runs Overworld at level 1 to Twilight Forest at 100, and the act ladder
is still unbuilt. If scroll depth ever maps to that ladder, the colour shift stops being
ornament and becomes orientation.

---

## 3. Phase order

Dependency order, not priority order. Each phase leaves the build green.

### Phase 0 — Make the design visible

Cheap, and everything after it is judged against the result. Nothing here is new
design work — it is making the design that was already decided actually render.

- ~~Split the chrome palette off the rarity palette~~ (D8, D9) — **done**. `tokens.css`
  now carries three separate palettes, the ground is warm, and the six chrome usages of
  rarity tokens in `index.astro` are gone. Rarity colour survives only where it labels
  an actual item: the ladder swatches, search-hit names, and the unique card frames.
- ~~Make the bevel read~~ — **done**. 2px, and it is finally visible.
- Self-host Monocraft (D7), licence checked, applied to headings and item names only.
- Export the wordmark as SVG (D10) and put it in the header, replacing the placeholder
  square and the `CTE2 Wiki` text.
- Re-screenshot and re-judge. The current page has never been seen in its own typeface.

*Interim state, honestly:* the palette rebase makes the page more coherent and removes
the false colour signals, but it has also made it quieter — the borrowed aqua was doing
work that nothing has yet replaced. The two items still open are what put character
back: the wordmark is the only place saturated brand colour is allowed, and Monocraft
is the only thing carrying display character. Judge the result after those, not now.

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

### Phase 3.5 — Icon pipeline

Resolve the 223 item ids of §1.5 and emit their textures plus a join manifest (D6).
Measure the multi-layer models first and decide compositing before writing code.

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
| **Icons** | *Downgraded.* §1.5 resolves the set to 223 ids, 220 of which map cleanly. What remains: measure the multi-layer models, decide compositing, and find art for `minecraft:elytra` and `minecraft:trident`. Note the manifest's `resources.zip` does not exist at that path — the instance has a `resources` **directory**. |
| **Monocraft is not installed** | *Promoted.* With no per-item art (§1.5), type carries the character. Every heading is currently falling back to IBM Plex Mono, so the design has never been seen as designed. Phase 0. |
| **No per-unique art** | Every greatsword unique shares one icon. Never promise Mahjerion per-item art, and never let a layout depend on icon distinctiveness. |
| **No lore copy exists** | `flavor_text` is empty on all 251 uniques (§1.1). Dev-written prose lives in the Patchouli guidebook, which has no parser. Item pages will be all-stats until that changes. |
| ~~**Uncommitted work**~~ | Resolved 2026-08-22. The landing page and tokens are committed and merged; `origin/main` carries everything. An earlier 592-line draft of `index.astro` sits in `stash@{0}` and can be dropped once nobody wants it. |
| **Starlight scaffold** | `guides/example` and `reference/example` are still the only docs pages, and the landing page's nav links to `/guides/example/`. Replace before showing anyone. |
| **Cloudflare build ceiling** | 500 builds/month. Batch PR merges once contributions start. |

## 4.5 Known defects on `main`

Found by reading the rendered landing page on 2026-08-22. All three are data-honesty
issues, which makes them higher priority than they look.

1. **`min_drop_lvl` is labelled "REQUIRES LEVEL".** The item cards print
   `REQUIRES LEVEL 70` for Starforge and `REQUIRES LEVEL 1` for Quill Rain. That field
   is the minimum level at which the item can *drop*, not a gate on equipping it. No
   requirement data exists anywhere in `uniques.json`, and §1.4 rules out
   `library_of_exile_item_requirement` as a source. The label invents a game rule.
   Reword to "drops from level N".

2. **Empty `league` is rendered as a pack fact.** The "Where Uniques Drop" panel is
   captioned *"The pack tags each unique with the system that drops it"* and lists
   "General Drop Pool 212". `league` is empty on those 212 — the pack tags 39 of 251,
   not all of them. The inference is probably right; stating it as pack-authored is
   not. D4 applies.

3. **Percent rendering is incomplete, and cannot be fixed from current data.**
   Starforge shows `+100 Physical to Lightning Damage` and `+100 Electrify Chance`
   with no unit, while `-25% Elemental Damage` gets one, because the renderer infers
   `%` from `type: PERCENT|MORE` and from a `[VAL1]%` token in the name. Neither is
   present for those stats. `phys_to_lightning` is `origin: "code"` with an **empty
   `data` object** — one of the 353 stats registered in Java that ship no definition —
   so the unit genuinely is not in `data/`. Closing this needs the unmapped
   `mmorpg_stat_effect` registry or a hand-maintained unit map, and it affects every
   stat line on every future item page. Bigger than Phase 2 as currently scoped.

## 5. Out of scope for the proof of concept

Named so they are not drifted into: FTB Quests parsing (campaign structure), the
Patchouli guidebook converter, profession recipes (813), the Atlas passive tree,
mob pages, and the currency/orb crafting reference that §1.4 makes possible.
