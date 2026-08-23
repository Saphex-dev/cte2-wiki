// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import tailwindcss from '@tailwindcss/vite';

/* Absolute site URL. Required for canonical links, social card images and the
   sitemap — all of which need absolute URLs and none of which can be generated
   without it.

   Read from the environment so a custom domain never needs a code change: set
   SITE_URL in the Cloudflare Pages build settings. The fallback is the default
   pages.dev hostname for this repo and is a GUESS — correct it the moment the
   real domain is known, because a wrong value silently produces broken social
   cards rather than an error. */
const SITE = process.env.SITE_URL ?? 'https://cte2-wiki.pages.dev';

/* Cloudflare Web Analytics. CLAUDE.md wants this in from the start, to learn
   which item pages earn hand-written prose beyond generated stats.

   The beacon needs a token from the Cloudflare dashboard, so it stays inert
   until CF_BEACON_TOKEN is set rather than shipping a script that 404s. */
const BEACON = process.env.CF_BEACON_TOKEN ?? '';

const DESCRIPTION =
	'A community wiki for Craft to Exile 2 — every unique, skill and passive, generated from the modpack itself.';

/** @type {import('astro').AstroUserConfig['integrations']} */
export default defineConfig({
	site: SITE,

	integrations: [
		starlight({
			title: 'Craft to Exile 2 Wiki',
			description: DESCRIPTION,
			customCss: ['./src/styles/global.css'],
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/Saphex-dev/cte2-wiki',
				},
			],
			/* Starlight sets its own title/description/canonical per page. These
			   are the cards it does not emit: the social image, and the analytics
			   beacon. Custom routes carry their own — see src/pages/index.astro. */
			head: [
				{
					tag: 'meta',
					attrs: { property: 'og:image', content: `${SITE}/banner-cte2.webp` },
				},
				{
					tag: 'meta',
					attrs: { name: 'twitter:card', content: 'summary_large_image' },
				},
				{
					tag: 'meta',
					attrs: { name: 'twitter:image', content: `${SITE}/banner-cte2.webp` },
				},
				...(BEACON
					? [
							{
								tag: /** @type {const} */ ('script'),
								attrs: {
									defer: true,
									src: 'https://static.cloudflareinsights.com/beacon.min.js',
									'data-cf-beacon': `{"token":"${BEACON}"}`,
								},
							},
						]
					: []),
			],
			sidebar: [
				{
					label: 'Guides',
					items: [
						// Each item here is one entry in the navigation menu.
						{ label: 'Example Guide', slug: 'guides/example' },
					],
				},
				{
					label: 'Reference',
					items: [{ autogenerate: { directory: 'reference' } }],
				},
			],
		}),
	],

	vite: {
		plugins: [tailwindcss()],
	},
});
