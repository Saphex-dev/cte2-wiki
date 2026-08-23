# CTE2 Wiki — Appearance standard

**Settled 2026-08-23. This file is authoritative for what the site looks like.**
`CLAUDE.md` § Visual design carries the short form; where the two disagree, this
file wins. The decision is logged in `docs/ROADMAP.md` § D15.

The site is modelled on two existing modpack wikis, because players arriving here
have already used them and should not have to learn a new interface to look up a
sword.

| | |
|---|---|
| **Primary reference** | Official Calamity Mod Wiki — `calamitymod.wiki.gg` |
| **Secondary reference** | RLCraft Wiki — `rlcraft.fandom.com` |
| **When they conflict** | Calamity wins |

## 0. What was actually looked at

Pages read in a browser on 2026-08-23, at a ~1540px viewport:

- Calamity — `Murasama` (item page + infobox), `Weapons` (browse page),
  `Calamity Mod Wiki` (main page)
- RLCraft — `Dragon's Eye` (item page + infobox + crafting), `Lycanites_Mobs`
  (long-list page)

**Confidence note.** `calamitymod.wiki.gg` blocks script execution from the
browser extension, so exact computed values — hex codes, font stacks, pixel
measurements — could **not** be read off the page. Everything numeric below is
either a proportion measured off a screenshot, which is scale-independent and
reliable, or a target chosen for *our* layout and marked as ours. **No hex value
from either reference is reproduced here, and none should be** — our palette is
sampled from the pack and stays that way (D8, D9, D13). We are copying *structure
and density*, not colour.

Calamity was already measured once, in D12, against its brand band and backdrop.
That measurement stands and this file builds on it.

---

## 1. Page architecture

Both references put an opaque content frame on top of a full-bleed themed
background. Calamity does it with a red nebula behind a bordered dark panel;
RLCraft with a photographic banner strip. **We take Calamity's version**, and the
themed background is the dimension backdrop from D2.

```
+----------------------------------------------------------+
|  full-bleed dimension backdrop -- page ground             |
|                                                           |
|          brand band -- logotype, ON the backdrop          |
|                                                           |
|    +================================================+     |
|    |  wiki name                       [ search ]    |     |
|    +==========+=====================================+     |
|    |  rail    |  breadcrumb                         |     |
|    |  groups  +-------------------------------------+     |
|    |          |  H1                                 |     |
|    |  Wiki    |  +-------------------+------------+ |     |
|    |  Items   |  | prose + sections  |  infobox   | |     |
|    |  Char    |  |  ~72% of frame    |  ~22%      | |     |
|    |  World   |  |                   |            | |     |
|    |  Atlas   |  +-------------------+------------+ |     |
|    |  Craft   |                                     |     |
|    +==========+=====================================+     |
+----------------------------------------------------------+
```

> **Corrected 2026-08-23, on building it.** An earlier version of this diagram
> put the brand band *inside* the frame. That was wrong twice over. D12 had
> already measured the opposite from Calamity — "the atmosphere is a page-level
> backdrop with the logo floating over it, not a composite image in a box" — and
> in practice a 1440px frame leaves gutters too thin for the backdrop to read at
> all on a normal screen. The band above the frame is the only place the
> atmosphere gets real estate. The band is where the brand spend goes; the frame
> below it stays plain.

**Rules:**

1. **The content frame is opaque and square-cornered.** It is the scrim. This
   retires the standing worry that a busy mythic backdrop eats stat text — the
   backdrop never sits behind text at all, only behind the page gutters. D2's
   "dark scrim is non-negotiable" is now satisfied structurally rather than by
   per-component effort. *Built* — `src/components/Backdrop.astro` and `.frame`
   in `src/styles/site.css`.
2. **No `border-radius`, anywhere.** Calamity is square throughout. RLCraft is
   rounded; that is the single largest thing we do not take from it.
3. **The rail is always visible** on desktop and carries the grouped link lists
   already in `src/data/nav.ts`. It collapses to a disclosure below 900px.
4. **Search sits in the content frame's top bar, right-aligned.** Both references
   put it there. We currently have no search in the chrome at all — that is a gap,
   not a difference of opinion.
5. **Breadcrumb above the H1**, as a category line. Calamity uses MediaWiki tabs;
   RLCraft uses `in: Items, Renewable resources, …`. Ours already does breadcrumbs
   and they stay.

**Target widths** — ours, chosen to match Calamity's proportions:

| Region | Target |
|---|---|
| Frame max width | 1440px |
| Rail | 176px |
| Prose column | up to 1000px |
| Infobox | 288px fixed |

**288px is measured, not chosen.** Against the 1,323 real roll entries in
`data/uniques.json`, stat names run **median 14 characters, p90 42, max 126**, and a
unique carries **median 5 rolls, max 9**. At 13px IBM Plex Mono a 288px box fits ~33
characters per line, so **88% of stat lines do not wrap at all**. Widening to 352px
only moves 12% to 9% and costs 64px of prose column, so it is not worth it.

*Verified against the built page, not just arithmetic:* the worst entry in the set —
Lantern of Lost Ghosts' 125-character Ghost Shroud line — wraps to **five** lines, one
more than the character count alone predicts, because the value column and its gap take
width the estimate ignored. Nothing overflows and the page gains no horizontal scroll.
Five wrapped lines is what Calamity's Murasama tooltip already does, so this is the
reference's own behaviour rather than a defect.

RLCraft's content column measures roughly **330px of actual prose** once its
infobox and rails are subtracted. That is a consequence of Fandom's ad inventory,
not a design decision, and copying it would make a 40-row stat table unreadable.
**We go wide.**

---

## 2. Density — the two-scale grid

This is the substantive amendment to the old standard, which said "big visuals,
generous spacing" and mandated a hard 16px grid.

**Wiki density is the point of the reference.** Calamity's infobox rows sit roughly
4px apart, and its rail type is small enough to fit six link groups above the fold.
A 16px minimum turns a seven-roll unique into a screen and a half of whitespace,
and a 40-row stat table into something nobody scrolls.

So the 16px grid survives, but only where it was ever doing work:

| Scale | Steps | Governs |
|---|---|---|
| **Macro** — the original grid | 16 / 32 / 48 / 64 / 96 / 128 | Page margins, frame padding, gaps between panels, vertical rhythm between sections |
| **Micro** — new | 2 / 4 / 8 / 12 | *Only* inside data components: infobox rows, table cells, stat lines, tag chips, rail links |

**The boundary is the rule.** Micro spacing is not a general-purpose escape hatch
for tightening a layout that feels loose. If a value is not inside a row of
repeating data, it uses the macro scale.

Type sizes follow the same split — the reference is dense and so are we:

| Role | Size |
|---|---|
| Body prose | 15px |
| Data rows, tables, infobox values | 13px |
| Rail links, captions, chips | 12px |
| Group titles, small-caps labels | 11px |

Press Start 2P remains exempt: it is drawn on an 8px grid and is only crisp at
multiples of 8, so it is sized 8 / 16 / 24 / 32 regardless of the table above (D11).

---

## 3. The infobox

**The infobox is the anchor of every item, mob, dimension and skill page.** Prose
leads the main column; every structured field lives in the box. This supersedes D5,
which made the in-game tooltip the hero — see § 9.

Structure, taken from Calamity's `Murasama`:

```
+----------------------------+
|         Starforge          |  title bar -- darker, centred, bold
+----------------------------+
|                            |
|          [ icon ]          |  sprite well, centred, pixelated
|                            |
+----------------------------+
|         Statistics         |  section bar -- full width, centred
+----------------------------+
|    Type  Sword             |  label right-aligned, value left-aligned
|   Level  40 (act 3)        |  qualifier in parens, smaller, dim
|    Slot  Main hand         |
|  Rarity  Unique            |  value takes the pack's own colour (D13)
+----------------------------+
|         Stat rolls         |  section bar
+----------------------------+
|  +15% Increased Physical   |  full-width block, mono, wraps freely
|       Damage over Time     |
|  +22  Strength             |
+----------------------------+
|  "flavour line"            |  italic -- the pack's own tooltip text
+----------------------------+
```

**Rules:**

1. **Two-column for scalars, full-width for stat lines.** Calamity's label/value
   pair works because its values are short — `2200`, `65%`, `6.5`. CTE2 stat names
   reach 126 characters at the worst measured case. Anything that wraps gets a
   full-width block rather than a cramped value cell.
2. **Labels are right-aligned and dim; values are left-aligned and bright.** This
   is the Terraria/Calamity idiom, and it is what makes a twelve-row box scannable:
   the values form a clean left edge to run your eye down.
3. **Parenthetical qualifiers**, smaller and dimmer, carry the derived reading —
   `40 (act 3)`, `2.4s (slow)`. Calamity does exactly this with `2200 (True melee)`.
   Per D4 this is also where a derived-not-stated value gets flagged.
4. **Section bars** divide the box. Any number of them; they are how a box grows
   without becoming an undifferentiated list.
5. **The in-game tooltip becomes an italic block at the foot of the box**, not the
   page hero. Calamity renders Murasama's tooltip this way, flavour line and all.
   *Built, but currently never renders:* `flavor_text` exists in the unique
   schema and is **empty on all 251 items**, so the block is conditional and no
   item shows one today. It is worth asking Mahjerion whether flavour text is
   planned — it is the one thing the reference has that our data does not, and
   it is the difference between an item page that feels authored and one that
   feels generated.
6. **The sprite well tolerates a missing icon.** § 1.5 of the roadmap establishes
   that icon coverage is a curated subset; the well falls back to a base-type glyph,
   never a broken image.
7. **Every row is optional.** `origin: "code"` entries ship an empty `data` object.
   A box that renders three rows is correct output, not a bug.
8. **`learn_<spell>` gets its own row type, not a stat row.** Measured against
   `data/uniques.json`: of 1,323 roll entries across the 251 uniques, **15 do not
   resolve against `data/stats.json`, and all 15 are `learn_*`** — `learn_prayer`,
   `learn_grand_cross`, `learn_puncture` and eleven more. These are not stats; the
   suffix joins to `spells`. They render as a **Grants** section bar with the
   spell's name as a link. A box that renders them as stat lines with a missing
   label is the failure mode to avoid.

RLCraft's stacked label-over-value zebra rows are the alternative. They handle long
values better but cost roughly double the vertical space per field, and a CTE2
unique carries more fields than a Fandom bauble. Rule 1 solves the same problem
more cheaply.

---

## 4. Browse pages

Calamity's `Weapons` page is the strongest single pattern either reference offers,
and it maps onto our 251 uniques with no adaptation:

- **Sprite + name grid** inside a bordered box. Icon at native pixel size, name
  beside it as a link. Roughly seven across at full width, reflowing down.
- **Grouped by progression tier**, with a small heading per group. Calamity uses
  `Pre-Hardmode` / `Hardmode`. **We use the dimension ladder** — this is the native
  wiki idiom for exactly the thing the act ladder was invented for, which is strong
  independent evidence that the act ladder is right.
- A sub-label under the name where a qualifier is needed. Calamity uses
  `(Unattuned)`; ours carries the level or the mechanic tie.

This is also the answer to "how do 250 uniques become a page." They become one page
with eight groups.

**Built 2026-08-23** — `src/pages/items/uniques/`. Two things came out different
from this spec, both deliberate:

- **Two groupings, not one.** By run position *and* by base type, on one page
  with a Contents box. The base grouping exists because the landing page and the
  items overview already talk about uniques by base type and needed somewhere to
  link a base *to*; `#base-sword` is that somewhere.
- **Run groups key on the band's RANGE, not its dimension id.** Everbright and
  Everdawn are both levels 35–55 — the same rung under two names. Keying on the
  id sent every item in that range to whichever won the tie-break and left the
  other dimension showing zero uniques, which is true of neither. The heading
  names both.

One entry is filtered out: `empty` / "Empty/Invalid Unique" is the mod's
null-object, not an item. It is excluded **by id**, not by `weight === 0` —
three real uniques (Elytra, Insight, Flügel Tiara) also carry weight 0, which
means "never rolled from the drop pool", not "not an item".

### A CSS trap worth knowing before you style a component

This project builds with Astro's `scopedStyleStrategy: "where"`, so a component's
`.grid` compiles to `.grid:where(.astro-xxxx)` — specificity **(0,1,0)**, because
`:where()` contributes nothing. Any two-part global selector in `site.css`, such
as `.prose ul`, is (0,1,1) and **wins**.

This bit once already: `.prose ul { max-width: 72ch }` — a reading measure, right
for a prose bullet list — silently capped the browse grid at 648px inside a
1000px column and forced two columns where four fit, and the component's own
`max-width: none` could not override it.

**Scoped styles do not reliably beat global ones here.** When they clash, fix the
global rule (that one is now `.prose > ul`) rather than escalating specificity in
the component.

**Sortable data tables** are the second browse mode, for build discovery — stat
column, level column, tag column. Both references use them; neither does it
especially well. Ours is a plain bordered table on the micro spacing scale, with a
section bar as its header row.

---

## 5. The landing page

Calamity's main page is a **grid of portal boxes**: a welcome panel carrying one
accent border, then boxed portals — `Items`, `Bosses and Mini Bosses`, `Mechanics` —
each holding a multi-column list of icon+link entries, with a decorative sprite in
the box's corner.

That is what our landing page becomes. It is a hub, not a pitch.

The existing hero and `FireBand` (D14, currently disabled) sit awkwardly against
this. D14's own reasoning — brand spend goes into one place, the chrome stays plain
— now applies to the landing page too, since the landing page has stopped being a
pitch surface. **Recommend leaving the fire band disabled and retiring the hero.**
Flagging rather than doing it.

---

## 6. Type

Unchanged from D7 / D11. The references do not contradict us here; both use plain
sans for headings rather than a game face.

| Role | Face |
|---|---|
| Headings, panel titles, nav, labels | Monocraft (self-hosted; Plex Mono until then) |
| Body prose | IBM Plex Sans |
| Stat lines, data values, mono chrome | IBM Plex Mono |
| Wordmark and an item's own name, **only** | Press Start 2P |

**The D11 reservation holds and is reinforced.** Calamity's infobox title is plain
bold sans, not a pixel face. Our pixel item name is a deliberate one-role deviation
that gives the item's identity a signature; applied any wider it becomes page
texture, which is the exact failure D11 was written to correct.

**Section headings carry a full-column-width bottom rule** in `--line`. Both
references do this, and it is most of what makes a long page navigable.

---

## 7. Colour

**No change.** `src/styles/tokens.css` stands as written: brand quarantined to the
wordmark, chrome from the sampled dark palette, pack colours applied only where the
pack applies them (D13).

The one thing to take from the references is **how much colour they spend**, which
is almost none. Calamity's chrome is grey-on-dark with link-blue and a single accent
border on the welcome panel; all the colour in the page comes from item sprites and
the pack's own rarity names. That is the discipline D12 already identified, and it
survives contact with a second reference.

**Link colour is the exception worth naming.** Both wikis lean hard on inline
linking — Calamity's Murasama intro links eight terms in three sentences — and the
link colour is doing navigational work, not decoration. `--accent` carries it.

---

## 8. What we deliberately do not take

| From | What | Why |
|---|---|---|
| RLCraft | Rounded corners | Contradicts the no-radius rule; Calamity is square |
| RLCraft | ~330px prose column | An ad-inventory artefact; unusable for stat tables |
| RLCraft | Horizontal dropdown nav | Puts every browse destination one click deep |
| RLCraft | Community widgets, Discord embeds, ads | Not our model |
| Calamity | MediaWiki `Page / Discussion / Read / Edit / History` tabs | We are PR-based; there is no in-place editing to expose |
| Both | Their palettes | Ours is sampled from the pack and stays that way |

**One relaxation, flagged rather than assumed.** `docs/PAGE_STRUCTURE.md` forbids
implementation vocabulary reaching a reader. Both references break this constantly —
RLCraft's infobox ships `Nameid: xat:dragons_eye` as a visible row. A collapsed
**Technical details** section at the foot of an item page is idiomatic here and is
genuinely useful to modders. Recommend relaxing the rule to "implementation
vocabulary never appears above the fold or in prose," rather than never. **Needs a
call — not applied.**

---

## 9. What this supersedes

**D5 — "The item tooltip is the signature component" — is demoted.** The tooltip is
no longer the item page's hero; the infobox is, and the tooltip becomes an italic
block inside it. D5's *reasoning* survives intact and is why the tooltip stays at
all: there is no per-unique art (§ 1.5), so the frame and the type must carry
identity. That is now the infobox's job. The tooltip keeps two roles — the block at
the foot of the infobox, and the hover preview on browse pages, which is where
"index pages quote it" actually belongs.

**"Big visuals, generous spacing" is retired**, replaced by § 2's two-scale grid.

**The hard 16px grid narrows** to the macro scale in § 2.

**D2 gets easier.** Backgrounds sit behind an opaque frame, so per-tier vignette and
tint work mostly disappears, and the bespoke mythic tier becomes optional rather
than the deliverable that justified the system.

Unaffected: D1, D3, D4, D6, D7, D8, D9, D11, D12, D13, D14.
