# Stillroom website

Responsive Astro implementation of the approved Figma `final` designs.

## Commands

```sh
pnpm install
pnpm dev
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
- `404.astro` for unknown routes

## Content

Work Projects and Journal Articles use Astro content collections:

- `src/content/work-projects/`
- `src/content/journal-articles/`
- Schemas: `src/content.config.ts`

Each entry supplies its listing card. Entries with `detailAvailable: true` also receive a generated detail route. This keeps listing and detail content in one source while allowing card-only entries until full detail content is available.

## Structure

- `src/components/site/`: shared site modules such as the header, footer, buttons, and project invitation
- `src/components/content/`: Work Project and Journal Article cards
- `src/layouts/Layout.astro`: document shell and shared site chrome
- `src/styles/global.css`: design tokens, shared layout rules, and responsive styling
- `public/images/`: optimized WebP exports from Figma

The newsletter and project inquiry forms validate in the browser. Submission is intentionally inactive until external services or API endpoints are provided.
