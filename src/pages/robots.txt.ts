import type { APIRoute } from 'astro';

/* Generated rather than a static file in public/, so the sitemap line follows
   `site` in astro.config.mjs. A hardcoded hostname here would quietly go stale
   the moment a custom domain is set. */
export const GET: APIRoute = ({ site }) =>
	new Response(
		[
			'User-agent: *',
			'Allow: /',
			'',
			`Sitemap: ${new URL('sitemap-index.xml', site).href}`,
			'',
		].join('\n'),
		{ headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
	);
