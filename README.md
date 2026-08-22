# cte2-wiki

Lets make a wiki for Craft to Exile 2 Atlas Update

Built with [Astro](https://astro.build) + [Starlight](https://starlight.astro.build).

## Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## Game data

Wiki game data is **generated** from a reference copy of the modpack, not hand-typed.

```sh
python extract/extract.py --instance "<path to CtE2 instance>" --out data/
```

- `extract/` — Python extractor (stdlib only, no deps). See [`extract/README.md`](extract/README.md)
  for the extraction contract, entry shape, and known gotchas.
- `data/` — 38 generated JSON files, committed so the site builds without the modpack present.
- `docs/` — [extraction manifest](docs/EXTRACTION_MANIFEST.md) (what was extracted) and
  [source inventory](docs/SOURCE_INVENTORY.md) (where it came from).

Currently 4,385 entries across 36 collections, plus 3 talent trees (2,296 placed nodes).
Re-running the extractor against a newer pack version regenerates `data/` in one step.

## Structure

- `src/content/docs/` — wiki pages (`.md` / `.mdx`); each file becomes a route
- `src/assets/` — images referenced from content
- `public/` — static files served as-is (favicon, etc.)
- `astro.config.mjs` — site title, sidebar navigation, social links
