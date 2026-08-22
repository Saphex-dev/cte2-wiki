// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [
      starlight({
          title: 'Craft to Exile 2 Wiki',
          customCss: ['./src/styles/global.css'],
          social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/Saphex-dev/cte2-wiki' }],
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