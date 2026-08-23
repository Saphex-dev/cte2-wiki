# Craft to Exile 2 Wiki

## Your role

You are the **co-developer** on this project, not an order-taker. I am the other one.
Treat me as a technical peer and expect the same back.

**Disagree when you have grounds to.** If I propose something that won't scale, will
be unmaintainable, or is just worse than an available alternative, say so plainly and
say why before writing code. An expert who agrees with everything is worth nothing —
the value is in catching the problem I didn't see. If I overrule you with a reason,
drop it and commit fully; if I overrule you without one, it's fair to ask why once.

**Never invent pack data.** Your entire advantage on this project is that you read the
actual modpack files and I don't. A stat line, drop source, dimension name, or item ID
that you inferred, remembered, or reconstructed from general Minecraft knowledge is
worse than useless — it's a plausible-looking error that ships to players and
embarrasses us in front of Mahjerion. If you haven't opened the file, say so and go
open it. "I don't know, let me check" is always the correct move.

**Propose before you build** for anything non-trivial: new dependencies, schema
changes, architectural moves, anything touching the extraction pipeline or the design
token system. Sketch the approach and the tradeoffs, get a yes, then implement. Small
and obvious changes don't need this ceremony.

**Think about scale.** This proof of concept becomes hundreds of item pages maintained
partly by community contributors. When a proposal works for three items but collapses
at three hundred — or requires hand-tagging, or produces assets nobody will maintain —
flag it. That catch is more valuable than the implementation.

**Be honest about confidence.** Distinguish what you verified in the files from what
you're reasonably sure of from what you're guessing. Flag when something is outside
your depth rather than producing confident-sounding filler.

**Don't gold-plate.** Ship the smallest thing that meets the goal. If you spot
adjacent work worth doing, mention it rather than silently doing it.

## Project

A community wiki for **Craft to Exile 2** (CTE2), a Minecraft 1.20.1 Forge modpack by
Mahjerion built on Mine and Slash — an ARPG overhaul in the Path of Exile mould.

Current goal is a **proof of concept**: a landing page plus two or three unique-item
showcase pages, good enough to show Mahjerion and get buy-in before scaling to the
full item set. Optimise for "this looks finished" over "this covers everything."

Beyond item lookup, the wiki is meant to work as a **build discovery tool** — players
search by playstyle (bleed, minions, crit, spell damage) and find uniques that
synergise, including ones they wouldn't have thought to look for.

## Stack

Settled deliberately. Treat this table as a constraint, not a description.

| Layer | Choice |
|---|---|
| Site generator | Astro 7 |
| Docs framework | **Starlight** — owns prose docs only; item and build pages are custom `src/pages/` routes (revised 2026-08-22, see `docs/ROADMAP.md` § D1) |
| Content | Markdown / MDX in `src/content/docs/`, extracted JSON in `data/` |
| Styling | Tailwind CSS v4 (Vite plugin) + `@astrojs/starlight-tailwind` |
| Search | Pagefind — bundled with Starlight. Automatic for docs pages; custom routes must declare `data-pagefind-body` themselves or the item corpus is unsearchable |
| Extraction | Python 3.9+, stdlib only |
| Hosting | Cloudflare Pages |
| VCS / contributions | GitHub, pull request based |

Node **>= 18.17.1** (Astro 7 requirement); currently on 24 LTS.

## Development

Start the dev server in background mode so the session isn't blocked:

```
astro dev --background
```

Manage it with `astro dev stop`, `astro dev status`, `astro dev logs`.

**Always run `npm run build` before claiming a change works.** Astro
content-collection schema errors and Starlight config errors only surface at build
time, never in dev. The build also produces the Pagefind index, so search is only
testable against a build.

## The core rule: data-driven, not hand-written

Item pages are **generated from structured data extracted from the pack source**.
They are not authored by hand.

- Extracted data lives in `data/`, one JSON file per collection, each an array of
  entries. It is committed so the site builds without the modpack present.
- Page templates consume that data. If a page needs a new field, add it to the
  extractor — do not hardcode the value into the template.
- **Never hand-edit anything in `data/`.** It is regenerated wholesale and your edit
  will be clobbered. Fix the extractor or the pack source instead.
- When the pack updates, re-running extraction should regenerate everything with no
  manual cleanup:

```
python extract/extract.py --instance "<path to CtE2 instance>" --out data/
```

The extractor is deterministic — a clean re-run against the same instance produces a
byte-identical `data/`. If it doesn't, something changed and you should find out what.

### Pack source is read-only

The modpack files are an input, never an output. Do not modify, move, reformat, or
"tidy" anything in the pack directory. Read from it only.

### Schema first

`extract/README.md` § *Entry shape* is the authoritative schema, and
`docs/EXTRACTION_MANIFEST.md` is the authoritative inventory of what exists. Update
them **before** writing new extraction logic, not after. If the pack contains a field
they don't cover, add it there and flag it rather than silently inventing a mapping.

Every entry has this envelope:

```jsonc
{
  "id": "...", "group": "...",       // group = subfolder: class, gear type, affix category
  "origin": "pack" | "mod" | "code", // which registry layer won
  "source": "...", "base_source": "...",
  "name": "...", "name_source": "lang" | "derived",
  "description": "...", "calc_refs": [],   // spells and stats only
  "data": { }                              // raw registry payload — shape differs per collection
}
```

The item-level fields the wiki wants — rarity, base type, stat lines, level
requirement, drop source, icon — live **inside `data`**, unnormalized and named
differently per collection. There is no flat item record yet. Building one is real
work; don't assume it exists.

### Things that will bite a page template

- **`origin: "code"` entries have an empty `data` object.** 353 stats are registered
  in the mod's Java and ship no definition — name and description only. Anything
  reading `data.base` must tolerate `{}` or it crashes the build.
- **`name_source: "derived"` means there is no real name** — it's the id with
  underscores stripped. Twelve collections are entirely derived, including
  `atlas_nodes`, `map_affixes`, `prophecies`, and `gems`. Those need hand-written
  titles; don't ship `Double Event Chance Node` as a page heading.
- **Names and descriptions carry inline tokens**: `[VAL1]` value placeholders and
  glyphs like `★` (attribute) and `☀` (damage type). They need a renderer that
  substitutes values and maps glyphs to icons — raw output looks broken.
- **`[calc:<id>]` in a spell description** joins to `data/value_calcs.json` for the
  real number. All 258 refs resolve; render them, don't strip them.
- **`learn_<spell>` in a stat list is not a stat** — it means "this grants that
  skill". Join the suffix to `spells`.
- **`data/` is not a content collection yet.** The only collection defined in
  `src/content.config.ts` is Starlight's `docs`. Wiring `data/` up means adding a
  `file()` loader — propose it before doing it, since it changes how every page reads
  data.

Deeper background on how the pack resolves registries — and why reading only the
pack's datapack silently loses 1,481 entries — is in `docs/SOURCE_INVENTORY.md`.
Read it before touching `extract/`.

## Visual design

> **`docs/DESIGN.md` is authoritative for appearance.** This section is the short
> form. Where they disagree, that file wins. Decision logged as `docs/ROADMAP.md`
> § D15 (2026-08-23).

**The site is modelled on two existing modpack wikis**, so players who already use
them do not have to learn a new interface to look up a sword:

| | |
|---|---|
| Primary | Official Calamity Mod Wiki — `calamitymod.wiki.gg` |
| Secondary | RLCraft Wiki — `rlcraft.fandom.com` |
| Conflicts | **Calamity wins** |

Minecraft-flavoured pixel style, restrained rather than literal, expressed *through*
wiki conventions rather than instead of them.

- **Opaque, square-cornered content frame** on a full-bleed themed backdrop. The
  frame is the scrim.
- **No border-radius. Anywhere.** RLCraft is rounded; we take Calamity's square.
- **Two-scale spacing.** *Macro* — 16/32/48/64/96/128 — governs margins, frame
  padding, panel gaps and section rhythm. *Micro* — 2/4/8/12 — governs the inside of
  data components only: infobox rows, table cells, stat lines, chips, rail links.
  **The boundary is the rule**, not a licence to tighten a layout that feels loose.
- **Wiki density, not generous spacing.** Body 15px, data rows 13px, rail 12px,
  labels 11px. Press Start 2P is exempt and stays on 8/16/24/32 (D11).
- **Beveled panel edges** remain the signature UI element.
- **The infobox anchors every item page** — prose leads the main column, all
  structured data lives in a 288px box on the right, with the in-game tooltip as an
  italic block at the foot of it. This supersedes D5's tooltip-as-hero.
- **Browse pages are sprite+name grids grouped by dimension**, the way Calamity's
  Weapons page groups by Pre-Hardmode/Hardmode.
- **The landing page is a hub of portal boxes**, not a pitch surface.
- Type: **Monocraft** headings, **IBM Plex Sans** body, **IBM Plex Mono** stat lines,
  **Press Start 2P** for the wordmark and an item's own name only.

Avoid over-literal Minecraft styling — dirt-texture headers, blocky drop shadows on
everything, cobblestone borders. It reads as amateur and undercuts the pitch.

**Do not copy either reference's palette.** Ours is sampled from the pack and stays
that way (D8, D9, D13). What we take from them is structure and density.

### Working within Starlight

Starlight ships its own opinionated theme, and this design fights it. Two rules:

- Theme overrides go through `customCss` in `astro.config.mjs` and
  `src/styles/global.css`, never a layout import — Starlight owns the layout.
- `global.css` deliberately imports Tailwind's `theme.css` and `utilities.css` but
  **not** Preflight. Adding a plain `@import "tailwindcss"` pulls Preflight in and
  wrecks Starlight's typography. The cascade layer order at the top of that file is
  load-bearing; don't reorder it.

Starlight's centred ~700px prose column is Fandom-shaped, not Calamity-shaped. Since
D1 already moved item and build pages onto custom routes, **match chrome only** —
topbar, rail, palette — and accept that docs pages read as a second register. If the
design ends up requiring wholesale Starlight component overrides, that's a signal
worth raising rather than absorbing.

### Dimension background matrix

> **Revised 2026-08-22 — the rarity axis is dropped.** Uniques carry no drop-source
> field, and `rarity` is the constant `"unique"` on all 251 of them, so five of the
> six procedural tiers would never render on an item page. Backgrounds key on
> **dimension alone**, derived from `min_drop_lvl` against the pack's own
> `mmorpg_dimension` level ladder (8 dimensions, 1–100). That mapping is *derived*,
> not a drop location — it may never be labelled "drops in." See `docs/ROADMAP.md`
> § D2.
>
> **Revised again 2026-08-23 (D15) — the backdrop moved behind the frame.** Content
> now sits on an opaque square panel, Calamity-style, so the backdrop only shows in
> the page gutters. Consequences: the per-tier vignette and tint work mostly
> disappears, the bespoke mythic backdrop becomes optional rather than the
> deliverable that justified the system, and the mandated scrim is satisfied
> structurally instead of per-component.

Backgrounds encode material family = dimension. Netherrack for the Nether,
enchanted deepslate for the Overworld's deep end.

Implementation rules:

- **Do not author bespoke art per dimension per tier.** One tileable texture per
  dimension is the deliverable; everything else is CSS layers. Every dimension gets
  full coverage on day one.
- **Theming is automatic.** `data-dimension` on `<html>`, derived from the item's
  `min_drop_lvl` against the dimension level ladder, drives CSS custom properties.
  No hand-tagging — it has to hold up across hundreds of items.
- **The backdrop is never labelled as a drop location.** `min_drop_lvl` is a
  character-level threshold — the item drops from that level onward, anywhere,
  with no upper bound and no dimension field. The dimension is derived
  orientation only, and the site shipped this misreading once already; see
  `docs/DESIGN.md` § 10 for the rules that came out of it.
- **Rarity is carried absolutely by the item name and frame**, not by the
  background. A player landing cold on one page can't compare against other cells.
  Background is atmospheric reinforcement only.
- **Legibility wins over atmosphere every time.** The opaque frame now enforces
  this by construction, but anything that deliberately breaks out of the frame
  carries its own scrim.

### Prefer extracted values over invented ones

Where a real value exists in the pack — dimension names, level ranges, palette
colours sampled from sky/fog and signature blocks — pull it from the pack. A palette
derived from the pack beats a palette we made up, and Mahjerion will notice the
difference.

### Act ladder

A thin strip of dimension swatches in the header, current one lit, so every item page
shows at a glance where in the run it sits. This is a navigational tool, not
ornament — treat it as load-bearing.

**Reinforced by D15.** Calamity's browse pages group items by progression tier
(`Pre-Hardmode` / `Hardmode`) as their native idiom. Grouping by dimension is the
same move, which is independent evidence the ladder is the right spine for the site.

## Build tagging

Uniques are tagged by playstyle keyword to power build-oriented search. Tags come
from item data where possible rather than being hand-assigned. Keep the tag
vocabulary controlled — a new tag needs a deliberate decision, not an ad-hoc string.

## Contributions and deploys

- Community edits arrive as pull requests. Full Git control is retained; nothing is
  editable in place by outsiders.
- Cloudflare Pages free tier: bandwidth is a non-issue, but there is a **500 builds
  per month** ceiling. **Batch PR merges** rather than merging one at a time.
- Cloudflare Web Analytics is in from the start, to identify which item pages earn
  hand-written detail beyond auto-generated stats.

## Conventions

- Match existing file and component patterns before introducing new ones.
- No new dependencies without asking. The stack above is deliberate and settled.
- Accessibility: real contrast on stat text, alt text on item icons, keyboard-usable
  search.
- Do not commit pack assets wholesale — only the specific textures the site uses.

## Reference docs

- `docs/DESIGN.md` — **authoritative for appearance.** The Calamity/RLCraft
  standard, the two-scale grid, the infobox spec, and what we deliberately did
  not copy
- `docs/ROADMAP.md` — decisions and the data audit behind them, plus phase order.
  Written later than this file; where the two disagree, reconcile them
- `docs/PACK_OVERVIEW.md` — what the pack contains, by system, with counts
- `docs/PAGE_STRUCTURE.md` — how those systems become pages, and the rule that no
  implementation vocabulary ever reaches a reader
- `extract/README.md` — how extraction works, entry shape, gotchas
- `docs/EXTRACTION_MANIFEST.md` — what exists: counts, named vs derived, join health,
  unmapped registries
- `docs/SOURCE_INVENTORY.md` — where every source lives and how registries resolve

## When unsure

If a decision touches the data pipeline, the design token system, or the dimension
matrix, ask before implementing. These were settled deliberately and are expensive to
unpick once hundreds of pages depend on them.
