/* Dimension display names.
 *
 * Moved here from ActLadder.astro so the item page and the ladder cannot drift
 * apart on what a dimension is called. There is exactly one copy of this table.
 *
 * The pack does not translate dimension names — each mod does, under its own
 * key — and `registry_map.LANG_SOURCES` deliberately reads only Mine and Slash
 * plus the pack's resources.zip, so widening it to reach them would re-resolve
 * names across all 37 collections. Every title below is QUOTED from a lang key,
 * cited inline; none is invented.
 *
 * `default` is excluded on purpose: it is the mod's catch-all for any dimension
 * without its own config, not a place you can go.
 */
export const DIMENSION_TITLES: Record<string, string> = {
	'minecraft:overworld': 'Overworld', //           dimension.minecraft.overworld
	'minecraft:the_nether': 'The Nether', //         dimension.minecraft.the_nether
	'undergarden:undergarden': 'Undergarden', //     dungeon_realm.words.map_name_undergarden
	'blue_skies:everbright': 'Everbright', //        generator.blue_skies.everbright
	'blue_skies:everdawn': 'Everdawn', //            generator.blue_skies.everdawn
	'minecraft:the_end': 'The End', //               dimension.minecraft.the_end
	'deeperdarker:otherside': 'Otherside', //        advancements.deeperdarker.explore_otherside
	'twilightforest:twilight_forest': 'Twilight Forest', // dimension.twilightforest.twilight_forest
};

/** Titles for a list of dimension ids, skipping any without a quoted name. */
export const bandTitles = (ids: string[]): string[] =>
	ids.map((id) => DIMENSION_TITLES[id]).filter(Boolean);

/* Two of the eight titles are quoted from lang keys that carry their own
   definite article — "The Nether", "The End". A sentence that supplies its own
   "the" has to strip theirs or it reads "the The Nether band". Stripping here
   rather than editing the table keeps every title exactly as the pack spells
   it, which is the point of the citations above. */
export const stripArticle = (title: string): string => title.replace(/^The\s+/, '');

/** "the Nether", "the Nether and Undergarden", "A, B and C". */
export function joinTitles(titles: string[]): string {
	if (titles.length === 0) return '';
	if (titles.length === 1) return titles[0];
	return `${titles.slice(0, -1).join(', ')} and ${titles[titles.length - 1]}`;
}
