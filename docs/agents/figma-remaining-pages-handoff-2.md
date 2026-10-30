# Figma parity handoff: partial implementation of remaining pages

## Status

Work stopped at the user's request. The remaining-page implementation is **in progress and unverified**.

Do not assume the current branch builds or matches Figma. The latest CSS and markup changes have not been formatted, type-checked, built, or rendered after editing.

The earlier homepage work remains uncommitted and must be preserved.

## Development server

Astro background dev server is still running:

- URL: `http://localhost:4321`
- PID at handoff: `4251`

Manage it with:

```bash
pnpm astro dev status
pnpm astro dev logs
pnpm astro dev stop
```

## Figma source frames

### Mobile

| Route                                      | Node       | Frame                          | Size             |
| ------------------------------------------ | ---------- | ------------------------------ | ---------------- |
| `/services`                                | `342:4360` | `services-final-mobile`        | `390 × 7193.047` |
| `/work`                                    | `381:2132` | `work-final-mobile`            | `390 × 5030.262` |
| `/work/the-good-table`                     | `381:3008` | `project-details-final-mobile` | `390 × 5653.830` |
| `/contact`                                 | `382:3354` | `contact-final-mobile`         | `390 × 3713.5`   |
| `/404.html`                                | `387:4228` | `404-final-mobile`             | `390 × 1766`     |
| `/about`                                   | `387:4269` | `about-final-mobile`           | `390 × 7450.831` |
| `/journal`                                 | `390:4633` | `journal-final-mobile`         | `390 × 5893.447` |
| `/journal/what-makes-a-place-stay-with-us` | `390:4865` | `article-final-mobile`         | `390 × 6701.202` |

### Desktop

| Route                                      | Node       | Frame                           | Size          |
| ------------------------------------------ | ---------- | ------------------------------- | ------------- |
| `/services`                                | `375:1370` | `services-final-desktop`        | `1440 × 5920` |
| `/work`                                    | `381:1843` | `work-final-desktop`            | `1440 × 4464` |
| `/work/the-good-table`                     | `381:2471` | `project-details-final-desktop` | `1440 × 6854` |
| `/contact`                                 | `382:3261` | `contact-final-desktop`         | `1440 × 2222` |
| `/404.html`                                | `387:3470` | `404-final-desktop`             | `1440 × 1537` |
| `/about`                                   | `387:3513` | `about-final-desktop`           | `1440 × 6547` |
| `/journal`                                 | `387:3803` | `journal-final-desktop`         | `1440 × 4525` |
| `/journal/what-makes-a-place-stay-with-us` | `387:4011` | `article-final-desktop`         | `1440 × 6203` |

## Extracted mobile section geometry

### Services — `342:4360`

- Header: `108`
- Hero: `477`
- Services and deliverables: `3440.238`
- How the work connects: `846`
- Hospitality sectors: `927.810`
- Project invitation: `276`
- Footer: `1118`

### Work — `381:2132`

- Header: `108`
- Introduction: `517.262`
- Projects: `2937`
- Invitation: `350`
- Footer: `1118`

### Project detail — `381:3008`

- Header: `108`
- Introduction: `705.563`
- Hero: `243.75`
- Challenge/contribution: `927`
- Gallery: `1380.190`
- Outcome: `517`
- Next project: `654.327`
- Footer: `1118`

### Contact — `382:3354`

- Header: `108`
- Inquiry: `2487.5`
- Footer: `1118`

### 404 — `387:4228`

- Header: `108`
- Recovery: `540`
- Footer: `1118`

### About — `387:4269`

- Header: `108`
- Philosophy: `260`
- Founder story: `889.598`
- Team: `2298.233`
- Principles: `1341`
- Proof: `1123`
- Invitation: `313`
- Footer: `1118`

### Journal — `390:4633`

- Header: `108`
- Introduction: `362`
- Featured article: `723.447`
- Latest articles: `3582`
- Footer: `1118`

### Article — `390:4865`

- Header: `108`
- Introduction: `619`
- Hero: `189.535`
- First body: `1533`
- Pull quote: `348`
- Second body: `1409`
- Related articles: `1376.667`
- Footer: `1118`

## Local Figma reference files

Full Figma metadata, generated design contexts, and screenshots were saved outside the repo:

- Full `final` page metadata: `/tmp/figma-final-metadata.xml`
- Individual mobile metadata: `/tmp/figma-*.xml`
- Figma screenshots: `/tmp/stillroom-figma/`
- Full design-context text: `/tmp/stillroom-context/`
- Browser screenshots from before the latest edits: `/tmp/stillroom-current/`

The design-context directory contains one mobile and one desktop text file per remaining route, for example:

- `/tmp/stillroom-context/servicesMobile.txt`
- `/tmp/stillroom-context/servicesDesktop.txt`
- `/tmp/stillroom-context/aboutMobile.txt`
- `/tmp/stillroom-context/articleDesktop.txt`

These files include exact Figma-generated dimensions, spacing, typography, copy, and asset URLs.

## Work completed in this pass

### Shared shell

- Added route-derived body classes in `src/layouts/Layout.astro`:
  - `page-home`
  - `page-services`
  - `page-work`
  - `page-project`
  - `page-contact`
  - `page-about`
  - `page-journal`
  - `page-article`
  - `page-not-found`
- Updated `src/components/site/Footer.astro` so the homepage retains its email form while non-home routes render the Figma-style `Subscribe →` link.
- Drafted route-scoped footer geometry for desktop `591px` and mobile `1118px`.
- Drafted route-specific header wordmark colors.

### Services

- Rewrote `src/pages/services.astro` around data-driven service cards.
- Updated hero and sector copy to current Figma design-context copy.
- Added actual Figma service artwork and number images.
- Drafted desktop/mobile scoped styles for all sections.

### Work

- Moved the `Our work` label inside the project section.
- Added `.project-list__grid` as a clean layout seam.
- Split project sector and `View project` colors in `ProjectCard.astro`.
- Drafted desktop/mobile listing and invitation styles.

### Project detail

- No substantial markup rewrite.
- Drafted scoped desktop/mobile styles for introduction, hero, copy, gallery, outcome, and next-project sections.

### Contact and 404

- Markup is mostly unchanged.
- Drafted scoped desktop/mobile styles from Figma design context.

### About

- Rewrote `src/pages/about.astro` to match current Figma copy and structure.
- Changed working principles from four cards to the three Figma principles.
- Added full branded client identities using the homepage logo assets.
- Switched team portraits to direct Figma image assets.
- Added the Figma-specific invitation eyebrow.
- Drafted desktop/mobile styles for all sections.

### Journal

- Updated introduction copy.
- Simplified latest-articles heading structure.
- Drafted desktop/mobile styles for the introduction, featured article, article grid, and cards.

### Article

- Added different mobile/desktop first-section labels.
- Drafted desktop/mobile styles for introduction, hero, body sections, pull quote, related cards, and footer.

## New assets

Added to `public/figma-assets/`:

- `service-brand.jpg`
- `service-identity.jpg`
- `service-digital.jpg`
- `service-campaign.jpg`
- `alex-morgan.png`
- `maya-chen.png`
- `sam-rivera.png`

The service files contain JPEG data and use `.jpg` extensions.

## Critical warning about the latest CSS

A large route-scoped block was appended to `src/styles/global.css` under:

```css
/* Figma final-page parity: remaining routes */
```

It is a first draft translated from Figma design context. It has **not** been run through Prettier, Astro check, a browser render, or visual comparison.

Likely follow-up work includes:

1. Fix any syntax or selector issues.
2. Resolve conflicts with earlier approximate global rules.
3. Confirm fixed section heights are not clipping required content.
4. Compare actual screenshots to Figma and tune typography/spacing.
5. Ensure the homepage remains exactly unchanged after the body-class and footer changes.

## Known areas that still need attention

- The latest code has not been rendered at all after editing.
- Services total mobile height should now target `7193.047`, not the old `7209` baseline.
- Work target mobile height is `5030.262`, not the old approximate `4973` render.
- About content and principles changed substantially and are especially likely to need layout tuning.
- Contact form CSS is drafted against the existing DOM, which differs from Figma's generated grouping. Verify every vertical gap and form row.
- Footer layout must be checked on both homepage and non-home routes.
- Header wordmark coloring varies by route in Figma and needs visual verification.
- Lazy-loaded work/journal images must be fully loaded before classifying them as missing.
- Verify no use of colors outside the approved Figma palette in newly rendered route styles.
- The old global CSS still contains legacy colors and rules; ensure none leak into the remaining routes. Do not alter homepage rendering casually.

## Git state

At handoff, tracked modifications include:

- `package.json`
- `pnpm-lock.yaml`
- `src/components/content/ProjectCard.astro`
- `src/components/site/Footer.astro`
- `src/components/site/Header.astro`
- `src/layouts/Layout.astro`
- `src/pages/about.astro`
- `src/pages/index.astro`
- `src/pages/journal/[slug].astro`
- `src/pages/journal/index.astro`
- `src/pages/services.astro`
- `src/pages/work/index.astro`
- `src/styles/global.css`

Untracked:

- `docs/agents/figma-remaining-pages-handoff.md`
- `docs/agents/figma-remaining-pages-handoff-2.md`
- `public/figma-assets/`

Do not discard or reset any of these changes.

## Recommended continuation sequence

1. Run `pnpm format` to normalize the current edits.
2. Run `pnpm check` and fix all syntax/type errors.
3. Render `/services` at `390px` and `1440px`; fix it fully before moving on.
4. Continue route-by-route in this order:
   - `/work`
   - `/work/the-good-table`
   - `/contact`
   - `/404.html`
   - `/about`
   - `/journal`
   - article page
5. For each route, compare the browser screenshot against the matching file in `/tmp/stillroom-figma/`.
6. Re-render and re-verify the homepage at both breakpoints after shared shell/footer changes.
7. Crawl links and force lazy images to load.
8. Run final checks:

```bash
pnpm format:check
pnpm check
pnpm build
git diff --check
```

## Verification status

After the latest edits, none of the following have been run:

- formatting
- Astro check
- build
- `git diff --check`
- screenshot rendering
- visual comparison
- link crawl
- image load verification

Do not report any route as complete until those checks and both breakpoint comparisons are done.
