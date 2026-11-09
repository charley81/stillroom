# Stillroom website

Responsive Astro implementation of the approved Figma `final` designs.

## Commands

```sh
pnpm install
pnpm sanity:dataset:ensure
pnpm sanity:migrate:publish
pnpm dev
pnpm test
pnpm check
pnpm build
```

## Routes

- `/`
- `/services`
- `/work`
- `/work/[slug]`
- `/contact`
- `/about`
- `/journal`
- `/journal/[slug]`
- `/studio` for the embedded Sanity Studio
- `404.astro` for unknown routes

## Content

Site Settings is loaded at request time from published Sanity content through the CDN. The shared header, footer, newsletter copy, contact details, social links, footer tagline, and default SEO metadata have no local-content fallback.

Local development uses the public `development` dataset. Netlify production must set `PUBLIC_SANITY_DATASET=production`. Copy `.env.example` to `.env`, add local-only migration credentials, then run the dataset and migration commands above. The write token is not needed by the deployed website.

Sanity source is organized under `src/sanity/`, with generated schema and query types in `sanity.types.ts`. Regenerate them with `pnpm sanity:typegen`.

Work Projects and Journal Articles still use Astro content collections in this first CMS slice:

- `src/content/work-projects/`
- `src/content/journal-articles/`
- Schemas: `src/content.config.ts`

## Structure

- `src/components/site/`: shared site modules such as the header, footer, buttons, and project invitation
- `src/components/content/`: Work Project and Journal Article cards
- `src/layouts/Layout.astro`: document shell and shared site chrome
- `src/styles/global.css`: Tailwind import, theme tokens, and minimal global accessibility styles
- Component and page styling uses Tailwind utility classes directly in `.astro` files
- `public/images/`: optimized WebP exports from Figma

The newsletter and project inquiry forms validate in the browser. Submission is intentionally inactive until external services or API endpoints are provided.
