# Figma parity handoff: remaining eight pages

## Goal

Match the remaining eight Astro routes exactly to the Figma designs on the `final` mobile page and `final-desktop` desktop page.

The user's hard constraint is: use only colors assigned in Figma styles/variables. If any color outside those variables appears necessary, stop and get approval before adding it. Match spacing, padding, typography, dimensions, imagery, and copy exactly.

## Current state

The homepage has been implemented and visually verified against Figma:

- Mobile frame: `368:8607` (`homepage-final-mobile`), `390 × 10076.5`
- Desktop frame: `213:10711` (`homepage-final`), `1440 × 8024`
- Rendered browser geometry is `390 × 10076` and `1440 × 8024` with exact section heights, no horizontal overflow, and no failed image requests.

The homepage work is uncommitted. Preserve it.

Modified/untracked files at handoff:

- `src/pages/index.astro`
- `src/styles/global.css`
- `src/components/site/Header.astro`
- `src/layouts/Layout.astro`
- `package.json`
- `pnpm-lock.yaml`
- `public/figma-assets/`
- this handoff document

The development server is running through Astro background mode at `http://localhost:4321`.

## Important implementation notes

1. Load the Figma design-reader skill before using Figma tools.
2. For large frames, use `figma_get_metadata` first and then `figma_get_design_context` on individual sections. Use `figma_get_screenshot` for visual comparison.
3. Metadata text can be stale while design context contains the current copy. Prefer design context and screenshots for implementation values.
4. Download exact assets exposed by design context from `http://localhost:3845/assets/...` into `public/figma-assets/` rather than depending on the Figma local server at runtime.
5. The existing public images were exported from the corresponding Figma nodes and are generally the correct assets.
6. Do not claim visual verification without rendering both `390px` and `1440px` screenshots.
7. Avoid stacking another large unscoped override block onto `global.css`. The current homepage parity block begins with:

   ```css
   /* Figma final-page parity: shared shell and homepage */
   ```

   Prefer route-scoped classes for the remaining work. Adding a route class to `<body>` in `src/layouts/Layout.astro` is a reasonable seam, but re-verify the completed homepage if shared styles change.

## Approved Figma colors

Only use these existing Figma variables/styles:

```css
--primary: #bb3020;
--dark: #1f0805;
--dark-grey: #7a6262;
--muted: #6a6864;
--light: #fff7eb;
--light-grey: #e5e1e1;
--white: #ffffff;
```

Any other color requires user approval first.

## Remaining routes and desktop frames

| Route                                      | Figma desktop node | Frame name                      | Target size   | Current rendered height |
| ------------------------------------------ | ------------------ | ------------------------------- | ------------- | ----------------------- |
| `/services`                                | `375:1370`         | `services-final-desktop`        | `1440 × 5920` | `5773`                  |
| `/work`                                    | `381:1843`         | `work-final-desktop`            | `1440 × 4464` | `4357`                  |
| `/work/the-good-table`                     | `381:2471`         | `project-details-final-desktop` | `1440 × 6854` | `6793`                  |
| `/contact`                                 | `382:3261`         | `contact-final-desktop`         | `1440 × 2222` | `2161`                  |
| `/404.html`                                | `387:3470`         | `404-final-desktop`             | `1440 × 1537` | `1476`                  |
| `/about`                                   | `387:3513`         | `about-final-desktop`           | `1440 × 6547` | `6486`                  |
| `/journal`                                 | `387:3803`         | `journal-final-desktop`         | `1440 × 4525` | `4464`                  |
| `/journal/what-makes-a-place-stay-with-us` | `387:4011`         | `article-final-desktop`         | `1440 × 6203` | `6142`                  |

Locate the matching mobile top-level frames on Figma's `final` page before changing mobile styles. The existing mobile CSS contains many approximate target heights, but it is not sufficient evidence of parity.

## Desktop geometry already extracted

### Services — `375:1370`

- Header: `120`
- Hero: `896`
- Services and deliverables: `2187`
- How the work connects: `637`
- Hospitality sectors: `913`
- Project invitation: `576`
- Footer: `591`

Primary source: `src/pages/services.astro`.

### Work index — `381:1843`

- Header: `120`
- Editorial introduction: `833`
- Projects: `2384`
- Project invitation: `536`
- Footer: `591`

Project imagery nodes: `381:1863`, `381:1872`, `381:1882`, `381:1891`, `381:1901`, `381:1910`.

Primary sources:

- `src/pages/work/index.astro`
- `src/components/content/ProjectCard.astro`
- `src/content/work-projects/*.json`

### Project detail — `381:2471`

- Header: `120`
- Introduction: `775`
- Full-width hero: `900`
- Challenge/contribution: `703`
- Brand gallery: `2601`
- Outcome: `667`
- Next project: `497`
- Footer: `591`

Primary source: `src/pages/work/[slug].astro`.

### Contact — `382:3261`

- Header: `120`
- Inquiry section: `1511`
- Footer: `591`

Primary source: `src/pages/contact.astro`.

### 404 — `387:3470`

- Header: `120`
- Recovery section: `826`
- Footer: `591`

Primary source: `src/pages/404.astro`.

### About — `387:3513`

- Header: `120`
- Studio philosophy: `1320`
- Founder story: `716`
- Team: `1175`
- Principles: `1104`
- Proof: `995`
- Project invitation: `526`
- Footer: `591`

Primary source: `src/pages/about.astro`.

### Journal index — `387:3803`

- Header: `120`
- Editorial introduction: `658`
- Featured article: `640`
- Latest articles: `2516`
- Footer: `591`

Primary sources:

- `src/pages/journal/index.astro`
- `src/components/content/ArticleCard.astro`
- `src/content/journal-articles/*.json`

### Article — `387:4011`

- Header: `120`
- Article introduction: `694`
- Hero: `800`
- First body: `1150`
- Pull quote: `620`
- Second body: `1188`
- Related articles: `1040`
- Footer: `591`

Primary source: `src/pages/journal/[slug].astro`.

## Shared footer issue to fix first

The homepage desktop footer is `530px`, while every remaining desktop design uses `591px`.

The homepage parity block currently applies `min-height: 530px` globally to `.site-footer`, which explains the exact `61px` deficit on six of the remaining pages. Make the footer height route-specific:

- Homepage desktop: `530px`
- Remaining desktop routes: `591px`
- Homepage and remaining mobile designs currently use `1118px` unless the mobile frame proves otherwise

Do not change the homepage total height while fixing this.

## Existing assets

Relevant exported images already in `public/images/`:

- Services: `375-1387.webp`, `375-1392.webp`, `375-1393.webp`, `375-1395.webp`, `375-1396.webp`, `375-1425.webp`
- Work: `381-1857.webp`, `381-1863.webp`, `381-1872.webp`, `381-1882.webp`, `381-1891.webp`, `381-1901.webp`, `381-1910.webp`
- Project detail: `381-2490.webp`, `381-2491.webp`, `381-2505.webp`, `381-2511.webp`, `381-2601.webp`, `381-2696.webp`
- Contact: `382-3276.webp`
- 404: `387-3481.webp`
- About: `387-3526.webp`, `387-3529.webp`, `387-3542.webp`, `387-3543.webp`, `387-3544.webp`
- Journal/article: `387-3818.webp`, `387-3829.webp`, `387-3930.webp`, `387-3939.webp`, `387-3949.webp`, `387-3958.webp`, `387-3968.webp`, `387-3977.webp`, `387-4032.webp`

The Figma-provided shared assets downloaded for the homepage are in `public/figma-assets/`.

## Current mobile render heights for baseline comparison

These are current browser results, not Figma targets:

| Route                                      | Current `390px` height |
| ------------------------------------------ | ---------------------: |
| `/services`                                |                 `7209` |
| `/work`                                    |                 `4973` |
| `/work/the-good-table`                     |                 `5654` |
| `/contact`                                 |                 `3714` |
| `/404.html`                                |                 `1766` |
| `/about`                                   |                 `7467` |
| `/journal`                                 |                 `5893` |
| `/journal/what-makes-a-place-stay-with-us` |                 `6701` |

## Recommended sequence

1. Add route-scoped page/body classes and correct shared footer geometry without changing homepage dimensions.
2. Implement and verify `/services`.
3. Implement `/work` and its reusable project card.
4. Implement `/work/the-good-table`.
5. Implement `/contact` and `/404.html`.
6. Implement `/about`.
7. Implement `/journal` and its reusable article card.
8. Implement the article page.
9. Re-render all nine routes at `390px` and `1440px`; verify exact total and section geometry, visual spacing, copy, typography, images, links, and no horizontal overflow.
10. Run all final checks.

For each route, completion means both desktop and mobile screenshots have been compared to Figma and every section has a checkable geometry match.

## Verification commands

Use the project scripts:

```bash
pnpm format:check
pnpm check
pnpm build
git diff --check
```

For screenshots and computed geometry, Playwright Core is available through its pnpm path and system Chrome:

```js
import { chromium } from './node_modules/.pnpm/playwright-core@1.64.1/node_modules/playwright-core/index.mjs'

const browser = await chromium.launch({
  headless: true,
  executablePath:
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
```

Also crawl internal links and verify all rendered images load. Some below-fold images can report `naturalWidth === 0` before lazy loading in headless mode even though direct requests return `200`; scroll through the full page or explicitly wait for each image before classifying it as broken.

## Checks completed before handoff

The current homepage work passed:

- `pnpm format:check`
- `pnpm check`
- `pnpm build`
- `git diff --check`
- internal homepage link crawl
- exact desktop/mobile geometry checks
- full-page responsive screenshot review
