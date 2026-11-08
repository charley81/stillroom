# Stillroom Sanity CMS Implementation Plan

## Status

Planning document only. Do not treat this file as evidence that Sanity has been implemented.

## Goal

Replace local and hardcoded website content with Sanity while preserving the approved Figma design.

The completed system will provide:

- embedded Sanity Studio at `https://stillroom-app.netlify.app/studio`
- one direct, typed GROQ content-loading path
- published content for public visitors
- secure draft preview through Sanity Presentation and Visual Editing
- deterministic migration of existing content and images
- separate `production` and `development` datasets
- server rendering on Netlify

The authoritative content rules are in [`sanity-content-model.md`](./sanity-content-model.md).

## Non-goals

This implementation does not add:

- a page builder
- custom approval workflows
- localization
- scheduled publishing
- CMS-managed redirects
- new public routes
- form-service or newsletter-service integrations
- visual redesign work
- editor-controlled layout or styling

---

# Architecture

## One content-loading path

Use direct GROQ queries for all website content.

A single Sanity query module must handle both public and preview requests:

- public request: `published` perspective, Sanity CDN enabled, no token
- preview request: `drafts` perspective, CDN disabled, server-only read token, source maps enabled, stega enabled

The preview cookie decides the perspective. Pages and modules do not choose between unrelated data implementations.

Do not use:

- `sanityLoader`
- Astro content collections for Sanity data
- a Netlify build webhook for content publication
- separate query definitions for published and draft content

Published content changes should appear without a Netlify deployment.

## Deep Sanity module

Create one Sanity module with a small interface and the implementation details behind it.

Suggested location:

```text
src/sanity/
├── client.ts
├── load-query.ts
├── queries/
├── presentation/
├── images/
├── portable-text/
├── schemaTypes/
└── generated/
```

The main interface should accept a query, query parameters, and request preview state. It should return typed data plus the metadata needed by Visual Editing.

Keep these details inside the module:

- published versus draft perspective
- CDN selection
- server-only token use
- stega and source-map options
- query logging
- missing-content errors
- image URL generation
- generated query types

Pages should request page-shaped data. Avoid many small queries from nested Astro modules.

## Server rendering

Use Astro server output with the current Netlify adapter.

Reasons:

- Visual Editing requires server-rendered pages.
- Secure draft mode requires server endpoints and cookies.
- Direct GROQ lets published content update without rebuilding the site.
- Dynamic Work Project and Journal Article routes can resolve by slug at request time.

The public path remains fast by using Sanity’s CDN for published queries.

## Embedded Studio

Use the official Astro and Sanity integrations to mount Studio at `/studio`.

Requirements:

- latest stable compatible Astro, Sanity, React, and integration packages
- exact versions for Sanity integration packages because preview and Studio integrations change quickly
- Studio route omitted from public navigation
- Studio route marked `noindex`
- Sanity project-member authentication only
- no additional Netlify password layer
- browser routing under the server-rendered deployment

## Presentation and Visual Editing

Configure the Presentation tool with:

- production preview origin: `https://stillroom-app.netlify.app`
- local preview origin: `http://localhost:4321`
- secure draft-mode enable endpoint
- draft-mode disable endpoint
- document location resolvers
- Visual Editing overlays in the shared page layout

Document locations must cover:

- each singleton page
- each Work Project route
- each Journal Article route
- Home placements
- Journal and Work index placements
- Service placements
- Client Logo placements

## Draft-mode security

Use the current Sanity preview-secret package and server endpoints.

The enable endpoint must:

1. validate the Sanity preview URL secret
2. reject invalid requests with `401`
3. set an HTTP-only, secure, same-site preview cookie
4. store the requested preview perspective safely
5. remove secret parameters before redirecting

The disable endpoint must clear preview cookies and redirect to a safe internal path.

The Sanity read token must never enter browser code or serialized page data.

## Environment mapping

| Environment            | Dataset       | Authenticated Studio and draft preview |
| ---------------------- | ------------- | -------------------------------------- |
| Local development      | `development` | Yes                                    |
| Netlify Deploy Preview | `development` | No                                     |
| Netlify production     | `production`  | Yes                                    |

Trusted authenticated Sanity origins:

- `http://localhost:4321`
- `https://stillroom-app.netlify.app`

Do not add a wildcard CORS origin for temporary Netlify Deploy Preview URLs.

## Tokens and environment variables

Use least privilege.

### Browser-safe values

- project ID
- dataset name
- Studio base path when needed

### Server-only runtime values

- read token for draft preview
- preview session secret

### Build or deployment values

- deployment token only if schema deployment runs in CI

### Local migration values

- write token

Remove the write token from the Netlify runtime environment. The public dataset is readable without a token; public queries must not use a privileged token.

---

# Planned packages

Before implementation, read the installed Astro documentation and the current official Sanity documentation. Confirm the latest stable compatible package set at that time.

Expected package roles:

- `@sanity/astro`: Astro client, embedded Studio, and Visual Editing integration
- `sanity`: Studio configuration, schema definitions, Presentation, structure, and TypeGen tooling
- `@sanity/client`: direct GROQ queries
- `@sanity/preview-url-secret`: secure draft-mode URL validation
- `@sanity/image-url`: crop- and hotspot-aware image URLs
- `@astrojs/react`: Studio and Visual Editing islands
- `@astrojs/netlify`: server rendering on Netlify
- a current Astro-compatible Portable Text renderer
- React, React DOM, and required Studio peer dependencies

Install the latest stable versions, then pin Sanity integration packages exactly. Commit the lockfile.

---

# Schema implementation

## File organization

Keep schema definitions grouped by role:

```text
src/sanity/schemaTypes/
├── documents/
├── objects/
├── index.ts
└── shared/
```

The root `sanity.config.ts` should import the schema module and Studio structure.

## Schema names

Use the project language consistently:

- `workProject`
- `journalArticle`
- `clientLogo`

Do not introduce the older technical names `project` or `article`.

## Singleton behavior

Use stable singleton IDs:

- `siteSettings`
- `homePage`
- `workPage`
- `servicesPage`
- `aboutPage`
- `journalPage`
- `contactPage`

For singleton types:

- remove generic create actions
- remove duplicate actions
- remove normal delete actions
- provide direct Studio structure links
- exclude singleton types from generic document lists

## Published slug behavior

Work Project and Journal Article slugs must:

- generate from the title
- be unique within their type
- preserve migrated routes exactly
- become read-only after first publication

A later URL change requires a developer-managed Netlify redirect. Redirect management is not part of Studio.

## Fixed references and counts

Implement all exact-count and duplicate-reference rules from the content model.

Validation must block publishing for:

- incorrect fixed-array counts
- duplicate references
- missing required references
- Journal Article self-reference
- invalid image accessibility data
- missing Work Project gallery content

Use warnings for copy length and SEO guidance.

## Studio structure and previews

Create the approved structure:

```text
Content
├── Global
├── Pages
├── Work
├── Journal
└── Reusable Content
```

Add useful list previews:

- Work Project: title, sector label, card image
- Journal Article: title, category, publication date, hero image
- Service: title, short summary, image
- Author: name
- Journal Category: title
- Client Logo: client name and logo

## Schema deployment and TypeGen

Use Sanity schema extraction and TypeGen from the same local schema definitions used by Studio.

Plan for commands that:

1. validate the schema
2. extract or deploy the schema as required by the current Sanity release
3. generate schema and query types
4. fail when generated types are stale

Commit generated types if required for deterministic Netlify builds.

---

# Query implementation

## Query shape

Define page-level GROQ queries that return the exact shapes required by the Astro routes.

Expected query groups:

- global Site Settings
- Home page
- Work index
- Work Project by slug
- Services page
- About page
- Journal index
- Journal Article by slug
- Contact page

Each page query should include referenced content needed for one render. Avoid query waterfalls from nested Astro modules.

## Shared projections

Use shared GROQ projections for repeated shapes:

- editorial image
- SEO fields
- Service card and full Service
- Work Project card
- Journal Article card
- Author
- Client Logo

Published and preview requests must use the same queries and projections.

## Query typing

Use Sanity query definitions that TypeGen can discover. Generated result types should flow through the Sanity module into page props and Astro modules.

Avoid hand-maintained duplicate interfaces for query results.

## Missing content behavior

Required singleton or route content must produce an explicit failure.

- public production request: return the correct error or 404 response; never render an incomplete page
- preview request: show a clear editor-facing error with the missing field or document
- verification and build checks: fail before cutover when required documents are absent

## Dynamic routes

Replace local content-collection route generation.

- `/work/[slug]`: query one Work Project by slug and return 404 when absent
- `/journal/[slug]`: query one Journal Article by slug and return 404 when absent
- next Work Project: derive from `workPage.workProjects`
- related Journal Articles: use the two ordered references on the Journal Article

---

# Image and Portable Text implementation

## Sanity images

Create one image module that:

- accepts the project’s editorial image shape
- applies crop and hotspot data
- creates responsive URLs
- uses modern output formats
- handles SVG Client Logo lockups without unsupported raster transformations
- selects a mobile override only when present
- produces accessible `alt` behavior

Replace local `astro:assets` usage only where content moves to Sanity. Keep fixed interface graphics local.

## Work Project images

Treat these as separate fields:

- card image
- hero artwork
- hero photograph
- gallery images

Do not infer one from another.

## Portable Text

Create a constrained renderer for:

- Work Project narrative sections
- About founder story
- Journal Article sections
- Work Project outcome copy

Support only the marks and block styles allowed by the content model. Unknown block types must fail clearly in development and preview.

---

# Content migration

## Principles

The migration must be:

- deterministic
- repeatable
- safe to run again
- able to target `development` or `production`
- able to create drafts without publishing
- explicit about uploaded assets and references

Use stable IDs for repeatable content, for example:

- `workProject.the-good-table`
- `journalArticle.what-makes-a-place-stay-with-us`
- `service.brand-strategy`
- `author.stillroom`
- `journalCategory.culture`
- `clientLogo.orlo-house`

The exact ID convention can change before implementation, but it must remain deterministic.

## Source priority

When sources disagree:

1. final Figma designs define the required content slots
2. current website content supplies initial values
3. the corrected content model defines editor controls

## Migration stages

### 1. Inventory

Create a machine-readable inventory of:

- all local page copy
- all Work Project JSON content
- all Journal Article JSON content
- all Service content
- all team and founder content
- all Client Logos
- all referenced images and SVG files
- current routes and slugs

Confirm every source asset exists before writing to Sanity.

### 2. Normalize

Transform current content into the corrected model:

- split Work Project card summary, positioning statement, and introduction
- preserve separate card, hero artwork, and hero photograph assets
- convert Work Project gallery pairs into brand-panel blocks
- remove unsupported Journal Article body images
- create Author and Journal Category references
- create complete Client Logo lockups
- create singleton documents in final section order
- derive fixed-reference arrays and exact item counts

### 3. Upload assets

Upload content images to Sanity and reuse returned asset references.

The migration must:

- avoid duplicate asset uploads when rerun
- preserve source filenames as migration metadata only
- set alt text and decorative state explicitly
- handle SVG Client Logo assets correctly

### 4. Create referenced documents

Create drafts in dependency order:

1. Services
2. Authors
3. Journal Categories
4. Client Logos
5. Work Projects
6. Journal Articles
7. singleton page documents
8. Site Settings

Journal Article related references can be completed after all Journal Article drafts exist.

### 5. Validate

Run:

- schema validation
- document validation
- reference validation
- exact-count validation
- route and slug comparison
- missing-asset checks
- accessibility-field checks

### 6. Preview

Use the `development` dataset and local Presentation to verify every page with draft content.

Do not publish production content until desktop and mobile review passes.

### 7. Production migration

Run the same deterministic migration against `production` as drafts.

Before publishing:

- export the production dataset
- compare document IDs and counts with development
- validate all documents
- confirm every current public slug exists

Publish in dependency order:

1. Services, Authors, Journal Categories, and Client Logos
2. Work Projects and Journal Articles
3. page singletons and Site Settings

Publishing production content is safe before the code cutover because the current website does not read Sanity.

## Migration rollback

Keep:

- a pre-migration production dataset export
- a post-migration production dataset export
- the migration script
- the previous successful Netlify deployment
- Git history containing the former local content

---

# Frontend conversion

Convert one vertical slice before changing all routes.

Recommended first slice:

1. Site Settings
2. Work page
3. one Work Project route
4. shared Work Project card
5. Presentation preview for that route

This slice exercises:

- singleton queries
- ordered references
- dynamic slugs
- responsive Sanity images
- Portable Text
- next Work Project derivation
- published and draft perspectives
- document locations

After the slice passes, convert routes in this order:

1. Home
2. Services
3. About
4. Journal
5. Journal Article
6. Contact
7. shared header and footer

For each route:

- replace hardcoded content with typed query results
- keep fixed labels, routes, and layout in Astro
- preserve the final responsive design
- add missing-content behavior
- verify published and draft modes

## Final source removal

After all routes use Sanity and verification passes:

- remove `src/content/work-projects/`
- remove `src/content/journal-articles/`
- remove Sanity-replaced collections from `src/content.config.ts`
- remove hardcoded content arrays replaced by Sanity
- remove unused local content assets only after confirming they have no fixed interface role
- remove obsolete content types and imports

Do not keep a runtime fallback to local content.

---

# Netlify and deployment

## Astro deployment

Configure the current Netlify adapter for server output.

Verify:

- Node version compatibility
- environment variables by Netlify context
- secure cookie behavior on HTTPS
- dynamic Work Project and Journal Article routes
- `/studio` and nested Studio routes
- draft-mode endpoints
- 404 behavior

## Content publication

Do not configure a Sanity-to-Netlify build hook. Direct GROQ queries make published content available without a new deployment.

## Production cutover

1. complete development migration and local Presentation review
2. complete automated and visual checks
3. migrate and publish production content
4. deploy the Sanity-enabled website
5. verify public pages
6. verify production Studio at `/studio`
7. verify secure production Presentation
8. verify a publish appears without a Netlify deployment
9. keep the previous Netlify deployment ready for rollback

If a blocking problem appears, restore the previous Netlify deployment. The old deployment ignores Sanity content.

---

# Testing and verification

## Automated tests

Add focused tests for:

- query result mapping
- published versus preview query options
- preview-secret validation and cookie behavior
- migration normalization
- stable migration IDs
- duplicate prevention
- fixed item counts
- slug preservation and published-slug locking
- Work Project next-item derivation
- Journal Article related-reference rules
- missing singleton behavior
- 404 behavior for unknown slugs
- image accessibility validation

Use the `development` dataset or controlled fixtures. Tests must not mutate production.

## Schema and content checks

Run the current Sanity equivalents of:

- schema validation
- document validation
- TypeGen generation and stale-output check

## Project checks

Run the available project checks before delivery:

```bash
pnpm format:check
pnpm check
pnpm test
pnpm build

git diff --check
```

Add `pnpm test` during implementation if the project does not yet have it.

## Visual verification

Compare migrated content with every final desktop and mobile Figma frame.

Routes:

- `/`
- `/services`
- `/work`
- every Work Project route, with The Good Table as the full reference case
- `/about`
- `/journal`
- every Journal Article route, with “What Makes a Place Stay With Us?” as the full reference case
- `/contact`
- `/404.html`

Check:

- text and image parity
- section order
- fixed item counts
- responsive layout
- no horizontal overflow
- image loading
- internal links
- metadata and canonical URLs
- draft overlays and document locations
- published content without overlays or stega leakage

## Editorial journey checks

Test these journeys:

1. edit a Home heading, preview it, publish it, and see it publicly without deployment
2. create a Work Project draft and preview its unpublished route
3. edit a shared Service and confirm every placement
4. edit a Client Logo and confirm Home and About placements
5. attempt invalid fixed-array counts and confirm publishing is blocked
6. attempt duplicate and self-referencing Journal Articles and confirm publishing is blocked
7. attempt to change a published slug and confirm the field is read-only
8. leave preview mode and confirm public content returns
9. sign out of Sanity and confirm draft content cannot be accessed

---

# Completion criteria

Implementation is complete only when:

- Studio is available at `/studio` in production
- all approved schemas and validations exist
- Sanity is the only runtime content source
- all current content and assets are migrated
- all public routes use the single typed GROQ flow
- published and draft requests use the same query definitions
- secure Presentation works locally and in production
- published changes appear without Netlify deployment
- local JSON and replaced hardcoded content are removed
- all automated checks pass
- all desktop and mobile Figma comparisons pass
- all critical editorial journeys pass
- a production dataset export and rollback path exist
