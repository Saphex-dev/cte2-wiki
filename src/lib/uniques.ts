import uniquesData from '../../data/uniques.json';
import dimensionsData from '../../data/dimensions.json';
import { renderRoll, type Roll, type RenderedRoll } from './stats';

/* The flat item record. ROADMAP D3 puts joins and interpretation here rather
   than in the extractor: the extractor mirrors the pack, this layer decides
   what any of it means. */

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
		unique_stats?: Roll[];
	};
};

type RawDimension = {
	id: string;
	data: { min_lvl?: number; max_lvl?: number; mob_tier?: number };
};

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

export interface Unique {
	id: string;
	slug: string;
	name: string;
	baseType: string;
	dropLevel: number;
	mapTier: number;
	/** Player-facing mechanic name, or null when the pack does not say. */
	mechanic: string | null;
	rolls: RenderedRoll[];
	tags: string[];
	/** Dimension ids whose level band contains this item's drop level. */
	bands: string[];
}

const humanise = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function build(raw: RawUnique): Unique {
	const rolls = (raw.data.unique_stats ?? []).map(renderRoll);
	const statIds = (raw.data.unique_stats ?? []).map((r) => r.stat).join(' ');
	const lvl = raw.data.min_drop_lvl ?? 1;

	return {
		id: raw.id,
		slug: raw.id.replace(/_/g, '-'),
		name: raw.name,
		baseType: humanise(raw.data.base_gear ?? raw.group ?? ''),
		dropLevel: lvl,
		mapTier: raw.data.min_tier ?? 0,
		mechanic: raw.data.league ? (MECHANIC[raw.data.league] ?? null) : null,
		rolls,
		tags: TAGS.filter((t) => t.re.test(statIds)).map((t) => t.label),
		/* Bands OVERLAP, so this is a list, not a lookup. An item at level 10
		   genuinely sits in two dimensions' ranges — presenting one would be a
		   guess dressed as a fact. */
		bands: dimensions
			.filter((d) => lvl >= (d.data.min_lvl ?? 0) && lvl <= (d.data.max_lvl ?? 100))
			.map((d) => d.id),
	};
}

export const all: Unique[] = (uniquesData as RawUnique[]).map(build);

export const bySlug = new Map(all.map((u) => [u.slug, u]));

/** Other uniques on the same base type, for the related list. */
export function siblings(u: Unique, limit = 8): Unique[] {
	return all
		.filter((o) => o.slug !== u.slug && o.baseType === u.baseType)
		.slice(0, limit);
}
