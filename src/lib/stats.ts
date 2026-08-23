import statsData from '../../data/stats.json';

/* Shared stat rendering. This is the beginning of the token renderer that
   ROADMAP Phase 2 calls for — pulled out of the landing page so item pages do
   not grow a second copy that drifts.
   Not yet handled: [calc:] resolution and glyph→icon mapping. */

type Stat = { id: string; name?: string; data?: { format?: string } };
const stats = statsData as Stat[];

const NAME = new Map(stats.filter((s) => s.name).map((s) => [s.id, s.name as string]));
const FORMAT = new Map(
	stats.filter((s) => s.data?.format).map((s) => [s.id, s.data!.format as string])
);

export type Roll = { type: string; min: number; max: number; stat: string };

export interface RenderedRoll {
	/** The number, signed, with a unit if one can be established. */
	value: string;
	/** The stat's name, with placeholders and glyphs stripped. */
	label: string;
	/** The colour the game prints this stat in. */
	colour: string;
}

export function renderRoll(r: Roll): RenderedRoll {
	const raw = NAME.get(r.stat) ?? r.stat.replace(/_/g, ' ');

	/* A `%` written immediately after the placeholder belongs to the value, not
	   the label — a stat can be a percentage while its roll type is FLAT. */
	const percentFromName = /\[VAL\d\]%/.test(raw);
	const percentFromType = r.type === 'PERCENT' || r.type === 'MORE';
	const suffix = percentFromName || percentFromType ? '%' : '';
	const sign = r.min < 0 ? '' : '+';
	const value =
		r.min === r.max
			? `${sign}${r.min}${suffix}`
			: `${sign}${r.min}–${r.max}${suffix}`;

	const label = raw
		.replace(/\[VAL\d\]%?/g, '')
		.replace(/[★☀]/g, '')
		.replace(/\s{2,}/g, ' ')
		.trim();

	const fmt = FORMAT.get(r.stat);
	return { value, label, colour: fmt ? `var(--mc-${fmt})` : 'var(--stat-default)' };
}

export const statName = (id: string): string => NAME.get(id) ?? id.replace(/_/g, ' ');
