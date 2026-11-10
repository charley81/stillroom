# Stillroom website

Responsive Astro implementation of the approved Figma `final` designs.

## Commands

```sh
pnpm install
pnpm sanity:dataset:ensure
pnpm sanity:migrate:all:publish
pnpm sanity:cutover:check
pnpm dev
pnpm test
pnpm check
pnpm build
pnpm verify:site # with the background dev server running
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

`PUBLIC_SITE_ORIGIN` is the single non-secret production-origin setting used by Astro, canonical and Open Graph metadata, structured data, Sanity Presentation, trusted-preview checks, and verification tooling. It must be an HTTP(S) origin without a path, query, credentials, or fragment. When it is unset, runtime rendering, builds, Presentation, and read-only site verification fall back to the current production origin, `https://stillroom-app.netlify.app`. The production editorial mutation check requires the variable explicitly so it cannot target an implicit destination.

Presentation enables draft preview through `/api/preview/enable`; `/api/preview/exit` clears the signed, secure preview cookie. Authenticated Studio and preview access are restricted to the explicit allowlist containing `http://localhost:4321` and `PUBLIC_SITE_ORIGIN` (or its documented fallback). Configure those exact origins with credentials in Sanity project CORS settings; do not add Netlify Deploy Preview wildcards or individual Deploy Preview origins.

Sanity source is organized under `src/sanity/`, with generated schema and query types in `sanity.types.ts`. Regenerate them with `pnpm sanity:typegen`.

Home, Work Projects, Services, About, Contact, and the complete Journal journey load from Sanity at request time. No public route has a local editorial-content fallback. The JSON files under `scripts/sanity/source/` and source assets under `scripts/sanity/assets/` are deterministic migration inputs only and are never served or imported by the website runtime. `public/` contains only fixed interface and brand assets.

Run `pnpm sanity:migrate:all` to recreate development drafts or `pnpm sanity:migrate:all:publish` to rerun and publish the complete development dataset. Both commands are repeatable and reuse uploaded assets by content hash. `pnpm sanity:cutover:check` validates every document against the schema, verifies the exact migrated document and route inventory, exercises every page-shaped query, and checks generated Sanity types for staleness.

Create a rollback-ready development export with `pnpm sanity:dataset:export`. The archive is written to `.sanity/backups/development.tar.gz` and intentionally ignored by Git.

Production launch is guarded by `ALLOW_PRODUCTION_LAUNCH=true` and runs pre-migration export, draft migration and validation, development parity comparison, dependency-ordered publication, published validation, and post-migration export. See [`docs/production-launch-runbook.md`](docs/production-launch-runbook.md) for the exact command, launch record, and tested Netlify and Sanity rollback procedures.

With the background dev server running, `pnpm verify:site` renders every public route at desktop and mobile viewports, checks response status, canonical URLs, internal links, image loading, accessibility basics, Studio indexing, and horizontal overflow, and writes full-page screenshots to `.sanity/screenshots/` for Figma comparison. `pnpm verify:production` runs the same checks against `PUBLIC_SITE_ORIGIN` or its documented fallback.

## Structure

- `src/components/site/`: shared site modules such as the header, footer, buttons, and project invitation
- `src/components/content/`: Work Project and Journal Article cards
- `src/layouts/Layout.astro`: document shell and shared site chrome
- `src/styles/global.css`: Tailwind import, theme tokens, and minimal global accessibility styles
- Component and page styling uses Tailwind utility classes directly in `.astro` files
- `public/images/`: optimized WebP exports from Figma

The newsletter and project inquiry forms validate in the browser. Submission is intentionally inactive until external services or API endpoints are provided.
