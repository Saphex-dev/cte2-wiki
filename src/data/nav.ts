/* The navigation rail, shared by every page so it cannot diverge.
 *
 * An entry gets an `href` only when that route genuinely exists. The rest
 * render as plain text — honest about the fact that the destination is not
 * built yet, rather than a link that goes nowhere. As pages land, they get
 * hrefs here and nowhere else.
 */
export type NavItem = { label: string; href?: string };
export type NavGroup = { title: string; items: NavItem[] };

export const RAIL: NavGroup[] = [
	{
		title: 'Wiki',
		items: [
			{ label: 'Main page', href: '/' },
			{ label: 'Documentation', href: '/guides/example/' },
			{ label: 'Contributing', href: 'https://github.com/Saphex-dev/cte2-wiki' },
		],
	},
	{
		title: 'Items',
		items: [
			{ label: 'Overview', href: '/items/' },
			{ label: 'Uniques', href: '/items/uniques/' },
			{ label: 'Base gear' },
			{ label: 'Runewords' },
			{ label: 'Support gems' },
		],
	},
	{
		title: 'Character',
		items: [
			{ label: 'Overview', href: '/character/' },
			{ label: 'Classes' },
			{ label: 'Skills' },
			{ label: 'Talents' },
			{ label: 'Ascendancy' },
		],
	},
	{
		title: 'World',
		items: [
			{ label: 'Overview', href: '/world/' },
			{ label: 'Dimensions' },
			{ label: 'Dungeons' },
			{ label: 'Mobs' },
		],
	},
	{
		title: 'Atlas',
		items: [
			{ label: 'Overview', href: '/atlas/' },
			{ label: 'Map modifiers' },
			{ label: 'Prophecies' },
			{ label: 'Omens' },
		],
	},
	{
		title: 'Crafting',
		items: [
			{ label: 'Overview', href: '/crafting/' },
			{ label: 'Currency' },
			{ label: 'Professions' },
		],
	},
];
