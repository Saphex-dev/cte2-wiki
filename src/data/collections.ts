import index from '../../data/_index.json';

type Collection = { key: string; count?: number; nodes?: number; groups?: string[] };

const byKey = new Map<string, Collection>(
	(index.collections as Collection[]).map((c) => [c.key, c])
);

/** Entry count for a collection, or 0 if it does not exist yet. */
export const count = (key: string): number => byKey.get(key)?.count ?? 0;

/** Subfolder groups a collection was filed under. */
export const groups = (key: string): string[] => byKey.get(key)?.groups ?? [];

/** Placed nodes across the talent trees. */
export const treeNodes = (): number => byKey.get('talent_trees')?.nodes ?? 0;

export const pack = {
	version: index.pack_version,
	minecraft: index.minecraft,
	mods: index.mod_count,
};

/* Spell folders that are plumbing rather than a playable class. */
const SUPPORT_GROUPS = new Set([
	'basic_summon_spells',
	'cast_sound_spells',
	'entity_cast_spells',
	'gear_spells',
	'identifier_spells',
]);

/** The twelve playable classes, with how many skills each owns. */
export function classes(): { id: string; label: string; skills: number }[] {
	const g = groups('spells');
	return g
		.filter((x) => !x.includes('/') && !SUPPORT_GROUPS.has(x))
		.map((id) => ({
			id,
			label: id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
			skills: g.filter((x) => x === id || x.startsWith(`${id}/`)).length,
		}))
		.sort((a, b) => a.label.localeCompare(b.label));
}
