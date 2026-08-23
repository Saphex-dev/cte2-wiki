import biomeData from '../../data/dimension_biomes.json';
import dimensionsData from '../../data/dimensions.json';

/* The per-dimension backdrop palette (ROADMAP D2, D15; docs/DESIGN.md § 1).
 *
 * The extractor mirrors the pack and interprets nothing — `dimension_biomes.json`
 * is every biome's raw `sky_color` and `fog_color` plus the dimension's
 * `has_skylight`. Deciding which of those two reads as the place, and turning a
 * list of them into one backdrop, is a display decision, so it lives here (D3).
 *
 * WHICH CHANNEL — read from the pack, not chosen.
 *   `has_skylight` is the field that makes the two comparable. A dimension with
 *   no skylight never draws its sky, so the Nether's `sky_color` is the vanilla
 *   blue #6eb1ff and means nothing on screen — what you actually see there is
 *   fog. Sky for dimensions that have one, fog for those that do not.
 *
 * WHY TWO COLOURS.
 *   Neither aggregate works alone, and this was measured rather than guessed:
 *     - The MEAN across biomes is never arbitrary, but averaging chroma away
 *       leaves the Overworld and Everbright both a similar blue.
 *     - The MODAL value keeps chroma, but the Nether's five biomes have five
 *       distinct fog colours, so "most common" picks one arbitrarily.
 *   So the mean becomes the muted `ground`, and the most saturated value that
 *   more than one biome shares becomes the `accent` — which is what recovers the
 *   Nether's red (#330303, crimson forest) and Everdawn's peach. See `build()`
 *   for why the accent requires a repeat and what happens when nothing repeats.
 *
 * THE LIGHTNESS IS OURS, THE HUE IS THE PACK'S.
 *   Raw values are mostly bright — a full-bleed #78a7ff behind a dark wiki would
 *   be unreadable. So hue is taken verbatim and lightness is clamped into the
 *   chrome's own dark band. Saturation is clamped too, at both ends: the floor
 *   stops Undergarden (whose fog is literally #272727, no hue at all) from
 *   rendering as flat grey, and the ceiling stops a saturated dimension from
 *   glaring behind the content frame.
 */

type RawDimensionBiomes = {
	id: string;
	source: string | null;
	data: {
		has_skylight: boolean;
		has_ceiling: boolean;
		biomes: { id: string; sky_color: number | null; fog_color: number | null }[];
	};
};

type RawDimension = { id: string; data: { min_lvl?: number; max_lvl?: number } };

/* ---- colour helpers ---------------------------------------------------- */

type RGB = [number, number, number];

const toRgb = (n: number): RGB => [(n >> 16) & 255, (n >> 8) & 255, n & 255];

const toHex = ([r, g, b]: RGB): string =>
	'#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

/** HSV saturation × value — "how much colour is here", 0..1. */
function chroma(n: number): number {
	const [r, g, b] = toRgb(n).map((v) => v / 255) as RGB;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	return max === 0 ? 0 : ((max - min) / max) * max;
}

function toHsl([r, g, b]: RGB): [number, number, number] {
	const rn = r / 255;
	const gn = g / 255;
	const bn = b / 255;
	const max = Math.max(rn, gn, bn);
	const min = Math.min(rn, gn, bn);
	const l = (max + min) / 2;
	const d = max - min;
	if (d === 0) return [0, 0, l];
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	let h: number;
	if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
	else if (max === gn) h = ((bn - rn) / d + 2) / 6;
	else h = ((rn - gn) / d + 4) / 6;
	return [h * 360, s, l];
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Keep the pack's hue, force our own lightness and a usable saturation band. */
function restage(n: number, lightness: number, satFloor: number, satCeil: number): string {
	const [h, s] = toHsl(toRgb(n));
	const sat = clamp(s, satFloor, satCeil);
	return `hsl(${h.toFixed(1)} ${(sat * 100).toFixed(1)}% ${(lightness * 100).toFixed(1)}%)`;
}

/* ---- palette ------------------------------------------------------------ */

export interface DimensionPalette {
	id: string;
	/** `data-dimension` attribute value — the id is not attribute-safe. */
	slug: string;
	channel: 'sky_color' | 'fog_color';
	biomeCount: number;
	/** Mean of the channel across biomes, restaged dark. The page ground. */
	ground: string;
	/** The most saturated single biome value, restaged. The atmosphere. */
	accent: string;
	/** Raw pack values, kept so a page can cite what it derived from (D4). */
	rawGround: string;
	rawAccent: string;
}

export const dimensionSlug = (id: string): string => id.replace(/[^a-z0-9]+/gi, '-');

function build(entry: RawDimensionBiomes): DimensionPalette | null {
	const channel: 'sky_color' | 'fog_color' = entry.data.has_skylight
		? 'sky_color'
		: 'fog_color';
	const values = entry.data.biomes
		.map((b) => b[channel])
		.filter((v): v is number => typeof v === 'number');
	if (values.length === 0) return null;

	const mean = values
		.map(toRgb)
		.reduce<RGB>(
			(acc, c) => [acc[0] + c[0] / values.length, acc[1] + c[1] / values.length, acc[2] + c[2] / values.length],
			[0, 0, 0]
		);
	const meanInt =
		(Math.round(mean[0]) << 16) | (Math.round(mean[1]) << 8) | Math.round(mean[2]);
	/* The accent is the most saturated value that MORE THAN ONE biome uses,
	   falling back to the most saturated overall when every biome differs.
	
	   The repeat requirement is there to reject one-off outliers. Undergarden is
	   the case that motivated it: 16 biomes, and the single most saturated fog
	   is a violet #251c53 used by exactly one of them, which rendered the whole
	   dimension purple. Requiring a repeat gives #191508 instead — a dark olive
	   several of its biomes share.
	
	   The fallback is not a loose end, it is the Nether: its five biomes have
	   five distinct fogs, and the most saturated of them is crimson forest's
	   #330303, which is exactly the red the dimension should wear. Measured
	   across all eight, this rule changes Undergarden and nothing else.
	
	   Ties resolve to the first in the extractor's sorted biome order, so this is
	   stable across runs rather than deterministic by accident. */
	const counts = new Map<number, number>();
	for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
	const repeated = [...counts.entries()].filter(([, n]) => n > 1).map(([v]) => v);
	const pool = repeated.length > 0 ? repeated : values;
	const accentInt = pool.reduce((best, v) => (chroma(v) > chroma(best) ? v : best), pool[0]);

	return {
		id: entry.id,
		slug: dimensionSlug(entry.id),
		channel,
		biomeCount: values.length,
		/* 8% lightness: dark enough that the opaque content frame still reads as
		   the brighter surface sitting on top of it. */
		ground: restage(meanInt, 0.08, 0.14, 0.4),
		/* 22% and allowed more saturation — it only ever appears as a large soft
		   wash, never behind text. */
		accent: restage(accentInt, 0.22, 0.2, 0.55),
		rawGround: toHex(toRgb(meanInt)),
		rawAccent: toHex(toRgb(accentInt)),
	};
}

export const palettes: DimensionPalette[] = (biomeData as RawDimensionBiomes[])
	.map(build)
	.filter((p): p is DimensionPalette => p !== null);

export const paletteById = new Map(palettes.map((p) => [p.id, p]));

/* ---- choosing one dimension for a level -------------------------------- */

export interface Band {
	id: string;
	lo: number;
	hi: number;
}

const bands: Band[] = (dimensionsData as RawDimension[])
	.filter((d) => d.id !== 'default')
	.map((d) => ({ id: d.id, lo: d.data.min_lvl ?? 1, hi: d.data.max_lvl ?? 100 }))
	.sort((a, b) => a.lo - b.lo || a.hi - b.hi || a.id.localeCompare(b.id));

/**
 * The dimension whose backdrop an item's page wears.
 *
 * Bands OVERLAP — level 40 sits in Undergarden, Everbright and Everdawn at once
 * — and the pack records no drop location, so there is no true answer. This
 * picks the band with the highest `min_lvl`, i.e. the furthest into the run you
 * could be and still find it.
 *
 * That is a DISPLAY choice and nothing on the page presents it as a fact: the
 * act ladder lights every band the level touches, and the prose names them all.
 * The backdrop is atmosphere, which is exactly the licence D2 grants it.
 *
 * Returns null for the 76–89 gap, where no band applies and the page falls back
 * to the plain chrome ground.
 */
export function deepestBand(level: number): Band | null {
	const hit = bands.filter((b) => level >= b.lo && level <= b.hi);
	if (hit.length === 0) return null;
	return hit.reduce((best, b) => (b.lo > best.lo ? b : best), hit[0]);
}

export function backdropFor(level: number): DimensionPalette | null {
	const band = deepestBand(level);
	return band ? (paletteById.get(band.id) ?? null) : null;
}

/** The ladder in run order, for grouping a browse page. */
export const ladder: Band[] = bands;
