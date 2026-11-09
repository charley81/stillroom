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

Local development uses the public `development` dataset. Netlify production must set `PUBLIC_SANITY_DATASET=production`. Copy `.env.example` to `.env`, add local-only migration credentials, a Viewer `SANITY_API_READ_TOKEN`, and a random `SANITY_PREVIEW_SESSION_SECRET` of at least 32 characters. The write token is not needed by the deployed website.

Presentation enables draft preview through `/api/preview/enable`; `/api/preview/exit` clears the signed, secure preview cookie. Authenticated Studio and preview access are restricted to `http://localhost:4321` and `https://stillroom-app.netlify.app`. Configure those exact origins with credentials in Sanity project CORS settings; do not add Netlify Deploy Preview wildcards.

Sanity source is organized under `src/sanity/`, with generated schema and query types in `sanity.types.ts`. Regenerate them with `pnpm sanity:typegen`.

Work Projects and the complete Journal journey load from Sanity at request time. Journal Articles, Authors, Journal Categories, and the Journal singleton are migrated with `pnpm sanity:migrate:journal` (drafts) or `pnpm sanity:migrate:journal:publish`.

## Structure

- `src/components/site/`: shared site modules such as the header, footer, buttons, and project invitation
- `src/components/content/`: Work Project and Journal Article cards
- `src/layouts/Layout.astro`: document shell and shared site chrome
- `src/styles/global.css`: Tailwind import, theme tokens, and minimal global accessibility styles
- Component and page styling uses Tailwind utility classes directly in `.astro` files
- `public/images/`: optimized WebP exports from Figma

The newsletter and project inquiry forms validate in the browser. Submission is intentionally inactive until external services or API endpoints are provided.
