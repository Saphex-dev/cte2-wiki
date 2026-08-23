import uniquesData from '../../data/uniques.json';
import dimensionsData from '../../data/dimensions.json';
import baseGearData from '../../data/base_gear.json';
import gearSlotsData from '../../data/gear_slots.json';
import spellsData from '../../data/spells.json';
import { renderRoll, type Roll, type RenderedRoll } from './stats';

/* The flat item record. ROADMAP D3 puts joins and interpretation here rather
   than in the extractor: the extractor mirrors the pack, this layer decides
   what any of it means.

   Everything below is a JOIN against a pack registry, never a reconstruction.
   Where a field cannot be sourced it is null and the infobox omits the row —
   see DESIGN.md § 3 rule 7. */

type RawUnique = {
	id: string;
	group: string | null;
	name: string;
	data: {
		base_gear?: string;
		min_drop_lvl?: number;
		min_tier?: number;
		league?: string;
		weight?: number;
		rarity?: string;
		flavor_text?: string;
		unique_stats?: Roll[];
	};
};

type RawDimension = {
	id: string;
	data: { min_lvl?: number; max_lvl?: number; mob_tier?: number };
};

type RawBaseGear = {
	id: string;
	name?: string;
	data: {
		gear_slot?: string;
		style?: string;
		base_stats?: Roll[];
		req?: { base_req?: Record<string, number>; scaling_req?: Record<string, number> };
	};
};

type RawGearSlot = { id: string; name?: string; data: { fam?: string } };
type RawSpell = { id: string; name?: string };

/* Player-facing names for the mechanics the pack tags an item with. The pack
   stores a short key; these are the words a reader gets. An untagged item is
   NOT "the general pool" — the pack simply says nothing, and so do we. */
const MECHANIC: Record<string, string> = {
	prophecy: 'Prophecies',
	obelisk: 'Ancient Obelisks',
	uber: 'Uber bosses',
	strongbox: 'Strongboxes',
	harvest: 'The Harvest',
	imprisoned_monster: 'Imprisoned Monsters',
	pinnacle: 'Pinnacle bosses',
};

/* Provisional build vocabulary. Matching on stat ids is a stopgap: ROADMAP
   Phase 5 replaces it with a reviewed stat_id → tag map across all 1,151
   stats, because substring matching silently misses stats whose id does not
   contain the obvious word. Keep the vocabulary small and deliberate. */
const TAGS: { label: string; re: RegExp }[] = [
	{ label: 'Spell damage', re: /spell/ },
	{ label: 'Chaos', re: /chaos|poison/ },
	{ label: 'Cold', re: /cold|water|freeze|chill/ },
	{ label: 'Fire', re: /fire|burn|ignite/ },
	{ label: 'Lightning', re: /lightning|shock|electrify/ },
	{ label: 'Critical', re: /crit/ },
	{ label: 'Minions', re: /summon|minion|totem/ },
	{ label: 'Bleed', re: /bleed/ },
	{ label: 'Leech', re: /leech|lifesteal|manasteal|energysteal/ },
];

const dimensions = (dimensionsData as RawDimension[])
	.filter((d) => d.id !== 'default')
	.sort((a, b) => (a.data.min_lvl ?? 0) - (b.data.min_lvl ?? 0));

const baseGear = new Map((baseGearData as RawBaseGear[]).map((b) => [b.id, b]));
const gearSlots = new Map((gearSlotsData as RawGearSlot[]).map((g) => [g.id, g]));
const spells = new Map((spellsData as RawSpell[]).map((s) => [s.id, s]));

export interface Grant {
	id: string;
	name: string;
}

export interface Unique {
	id: string;
	slug: string;
	name: string;
	/** `base_gear.name` — a real lang-sourced name, not the id humanised. */
	baseType: string;
	/** `gear_slots[...].data.fam` — Weapon / Armor / Jewelry / OffHand. */
	family: string | null;
	/** Slot name, only when it says something the base type does not. */
	slot: string | null;
	/** The base's own weapon damage range, e.g. "4–8". Weapons only. */
	baseDamage: string | null;
	/** Attribute the base scales on, read from `req.scaling_req`. */
	scaling: { attribute: string; factor: number } | null;
	dropLevel: number;
	mapTier: number;
	rarity: string;
	/** Player-facing mechanic name, or null when the pack does not say. */
	mechanic: string | null;
	/** Stat rolls, with `learn_*` removed — those are grants, not stats. */
	rolls: RenderedRoll[];
	/** Spells this item teaches, joined from `learn_<spell>` rolls. */
	grants: Grant[];
	/** `flavor_text`. Empty on all 251 today; the row is conditional. */
	flavour: string | null;
	tags: string[];
	/** Dimension ids whose level band contains this item's drop level. */
	bands: string[];
}

const titleCase = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function build(raw: RawUnique): Unique {
	const allRolls = raw.data.unique_stats ?? [];
	const lvl = raw.data.min_drop_lvl ?? 1;

	/* `learn_<spell>` in a stat list is not a stat — CLAUDE.md flags this and
	   the data confirms it: all 15 roll entries that fail to resolve against
	   stats.json are `learn_*`, and all 14 distinct suffixes resolve against
	   spells.json. They are split out here so neither list lies. */
	const learns = allRolls.filter((r) => r.stat.startsWith('learn_'));
	const statRolls = allRolls.filter((r) => !r.stat.startsWith('learn_'));

	const grants: Grant[] = learns.map((r) => {
		const id = r.stat.slice('learn_'.length);
		return { id, name: spells.get(id)?.name ?? titleCase(id) };
	});

	const base = baseGear.get(raw.data.base_gear ?? '');
	const baseType = base?.name ?? titleCase(raw.data.base_gear ?? raw.group ?? '');
	const slotEntry = base?.data.gear_slot ? gearSlots.get(base.data.gear_slot) : undefined;
	const slotName = slotEntry?.name ?? null;

	/* Base weapon damage, straight off the base's own `base_stats`. */
	const wd = (base?.data.base_stats ?? []).find((s) => s.stat === 'weapon_damage');
	const baseDamage = wd ? (wd.min === wd.max ? `${wd.min}` : `${wd.min}–${wd.max}`) : null;

	/* The attribute comes from `scaling_req`'s KEY, which the pack spells out
	   ("strength"), not from `style`, which is an abbreviation ("STR") and is
	   set to a default on jewelry that scales on nothing. Reading the key means
	   the row only appears when the pack actually states a scaling. */
	const scalingReq = base?.data.req?.scaling_req ?? {};
	const scalingKey = Object.keys(scalingReq)[0];
	const scaling = scalingKey
		? { attribute: titleCase(scalingKey), factor: scalingReq[scalingKey] }
		: null;

	return {
		id: raw.id,
		slug: raw.id.replace(/_/g, '-'),
		name: raw.name,
		baseType,
		family: slotEntry?.data.fam ?? null,
		/* Suppressed when it merely repeats the base type — `sword` base sits in
		   the `sword` slot, and a row saying so twice is noise. */
		slot: slotName && slotName !== baseType ? slotName : null,
		baseDamage,
		scaling,
		dropLevel: lvl,
		mapTier: raw.data.min_tier ?? 0,
		rarity: raw.data.rarity ?? 'unique',
		mechanic: raw.data.league ? (MECHANIC[raw.data.league] ?? null) : null,
		rolls: statRolls.map(renderRoll),
		grants,
		flavour: raw.data.flavor_text?.trim() || null,
		tags: TAGS.filter((t) => t.re.test(statRolls.map((r) => r.stat).join(' '))).map(
			(t) => t.label
		),
		/* Bands OVERLAP, so this is a list, not a lookup. An item at level 10
		   genuinely sits in two dimensions' ranges — presenting one would be a
		   guess dressed as a fact. */
		bands: dimensions
			.filter((d) => lvl >= (d.data.min_lvl ?? 0) && lvl <= (d.data.max_lvl ?? 100))
			.map((d) => d.id),
	};
}

/* The mod's null-object entry, not an item. `empty` / "Empty/Invalid Unique" is
   what an invalid unique reference resolves to in game — a sword with a single
   +1% weapon damage roll and drop weight 0. It surfaced on the browse page
   sitting between Bloodletter and Ichimonji, which is exactly the kind of thing
   that makes a wiki look unfinished.

   Filtered by ID, deliberately, and NOT by `weight === 0`. Three other uniques
   carry weight 0 and every one of them is real: Elytra, Insight, and Flügel
   Tiara (a joke item with -95% total damage). Weight 0 means "never rolled from
   the drop pool", not "not an item" — filtering on it would silently delete
   three genuine pages. */
const PLACEHOLDER_IDS = new Set(['empty']);

export const all: Unique[] = (uniquesData as RawUnique[])
	.filter((u) => !PLACEHOLDER_IDS.has(u.id))
	.map(build);

export const bySlug = new Map(all.map((u) => [u.slug, u]));

/* "a unique greatsword" vs "unique brigandine pants".
 *
 * Only NUMBER matters, not the initial letter: "unique" always sits between the
 * article and the base type, so "a unique axe" is already correct and no vowel
 * rule is needed.
 *
 * Verified against all 42 distinct base names in the set — the 12 plurals are
 * every Boots and every Pants, and none of the 30 singulars ends in "s". A
 * future singular base that did (a "Chaos Blade") would misfire here and would
 * need this widened to check the last word against a known list. */
export const isPluralBase = (baseType: string): boolean => /s$/i.test(baseType.trim());

/** "a unique greatsword" / "unique brigandine pants" — article included. */
export const uniquePhrase = (baseType: string): string =>
	`${isPluralBase(baseType) ? '' : 'a '}unique ${baseType.toLowerCase()}`;

/* Anchors on the uniques browse page, so other pages can deep-link a base type
   instead of dumping the reader at the top of a 251-item list.

   `baseAnchors` exists because not every label elsewhere on the site IS a base
   type. The landing page collapses armour into six material families (cloth,
   plate, ...) and the pack files a couple of odds and ends under a group called
   `other`, and neither has a heading on the browse page. Callers check the set
   and fall back to the section — the same rule nav.ts uses for routes: a link
   points somewhere real or it does not exist. */
export const baseAnchor = (baseType: string): string =>
	`base-${baseType.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

export const baseAnchors: ReadonlySet<string> = new Set(all.map((u) => baseAnchor(u.baseType)));

/** `#base-sword` when that heading exists, else the section it lives in. */
export const baseHref = (label: string): string =>
	baseAnchors.has(baseAnchor(label))
		? `/items/uniques/#${baseAnchor(label)}`
		: '/items/uniques/#by-base';

/** Other uniques on the same base type, for the related list. */
export function siblings(u: Unique, limit = 8): Unique[] {
	return all.filter((o) => o.slug !== u.slug && o.baseType === u.baseType).slice(0, limit);
}
