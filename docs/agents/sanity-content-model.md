# Stillroom Sanity CMS Content Model

## Purpose

This document defines the content requirements for Stillroom’s first Sanity CMS implementation.

The model is intentionally small and constrained:

- It covers only content represented by the final desktop and mobile designs.
- It uses fixed page templates rather than a page builder.
- It allows editors to change content and imagery without controlling layout or brand styling.
- It leaves Sanity installation, Studio configuration, preview implementation, and schema code for a later session.

## Core decisions

1. Fixed pages are singleton documents.
2. Projects and journal articles are repeatable documents.
3. Reusable records become documents only when they are referenced in multiple places.
4. One-off section content remains embedded in its owning page.
5. Editors cannot add, delete, or reorder page sections.
6. Internal references are strong references.
7. English is the only supported language.
8. Sanity manages content, not visual design controls.
9. Testimonials are not part of the final designs and are excluded entirely.
10. The 404 page remains in code and does not have a CMS document.

---

## Content type inventory

### Singleton documents

| Schema name    | Studio title  | Purpose                                                                          |
| -------------- | ------------- | -------------------------------------------------------------------------------- |
| `siteSettings` | Site Settings | Global navigation, contact, newsletter, footer, social, and default SEO content. |
| `homePage`     | Home          | Content and curated references for the homepage.                                 |
| `workPage`     | Work          | Work-page introduction, project order, and final CTA.                            |
| `servicesPage` | Services      | Services introduction, sectors, process, and final CTA.                          |
| `aboutPage`    | About         | Studio story, founder content, team, principles, and final CTA.                  |
| `journalPage`  | Journal       | Journal introduction and featured article.                                       |
| `contactPage`  | Contact       | Contact-page heading, introduction, and supporting image.                        |

Singletons should be created once and removed from normal “new document” actions.

### Repeatable documents

| Schema name       | Studio title     | Purpose                                                         |
| ----------------- | ---------------- | --------------------------------------------------------------- |
| `project`         | Project          | A portfolio project and its fixed case-study content.           |
| `article`         | Article          | A journal article using the approved editorial blocks.          |
| `service`         | Service          | Reusable service content shown on Home, Services, and projects. |
| `author`          | Author           | Reusable article byline and author note.                        |
| `journalCategory` | Journal Category | Controlled journal category labels.                             |

### Reusable object types

| Schema name            | Purpose                                                                     |
| ---------------------- | --------------------------------------------------------------------------- |
| `editorialImage`       | Accessible image content with optional caption and mobile override.         |
| `seoFields`            | Optional per-document SEO overrides.                                        |
| `internalCta`          | CTA label and constrained internal destination.                             |
| `socialLink`           | Platform label and external URL.                                            |
| `navigationItem`       | Navigation label and constrained internal destination.                      |
| `clientLogo`           | Client name and logo asset.                                                 |
| `sectorSummary`        | Page-specific sector heading and summary tied to a controlled sector value. |
| `processStep`          | One fixed process step.                                                     |
| `teamProfile`          | Embedded About-page team member.                                            |
| `articleSection`       | Margin label plus constrained editorial text.                               |
| `articlePullQuote`     | Full-width article pull quote.                                              |
| `articleBodyImage`     | Accessible full-width image placed within an article body.                  |
| `projectGallerySingle` | One gallery image.                                                          |
| `projectGalleryPair`   | Two gallery images displayed as a pair.                                     |

---

# Document specifications

## 1. `siteSettings`

One global document for content genuinely reused across the site.

### Identity

| Field                | Type   | Required | Notes                                                                                          |
| -------------------- | ------ | -------- | ---------------------------------------------------------------------------------------------- |
| `studioName`         | String | Yes      | Public studio name.                                                                            |
| `registeredMarkText` | String | Yes      | The visible wordmark text, such as `stillroom®`. This is content, not a logo or style control. |

### Header navigation

| Field               | Type                      | Required | Notes                                                                            |
| ------------------- | ------------------------- | -------- | -------------------------------------------------------------------------------- |
| `primaryNavigation` | Array of `navigationItem` | Yes      | Ordered header navigation. Destinations are constrained to known internal pages. |
| `primaryHeaderCta`  | `internalCta`             | Yes      | Expected to lead to Contact.                                                     |

Do not expose logo uploads, colors, fonts, spacing, icon, animation, or navigation-style controls.

### Contact and social information

| Field          | Type                  | Required | Notes                                     |
| -------------- | --------------------- | -------- | ----------------------------------------- |
| `emailAddress` | Email                 | Yes      | Canonical public email address.           |
| `socialLinks`  | Array of `socialLink` | No       | Ordered list of external social profiles. |

### Newsletter

| Field                   | Type   | Required | Notes                                          |
| ----------------------- | ------ | -------- | ---------------------------------------------- |
| `newsletterEyebrow`     | String | No       | Small introductory label.                      |
| `newsletterHeading`     | String | Yes      | Main newsletter heading.                       |
| `newsletterDescription` | Text   | Yes      | Short explanation of what subscribers receive. |

The email field label, placeholder, button label, submission validation, success message, error message, and integration behavior remain in code.

### Footer

| Field              | Type                      | Required | Notes                          |
| ------------------ | ------------------------- | -------- | ------------------------------ |
| `footerNavigation` | Array of `navigationItem` | Yes      | Ordered internal footer links. |
| `copyrightText`    | String                    | Yes      | Footer copyright copy.         |

### Default SEO

| Field                   | Type             | Required | Notes                                                                                                                                            |
| ----------------------- | ---------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `defaultSeoTitle`       | String           | Yes      | Site-wide fallback title.                                                                                                                        |
| `defaultSeoDescription` | Text             | Yes      | Site-wide fallback description.                                                                                                                  |
| `defaultSocialImage`    | `editorialImage` | Yes      | Global fallback sharing image. Alt text is still required for editorial use, though social metadata will use the asset rather than the alt text. |

---

## 2. `homePage`

The Home document contains named, fixed groups matching the final page sections. Editors may update the content but may not add, remove, or reorder sections.

### Hero

| Field              | Type             | Required |
| ------------------ | ---------------- | -------- |
| `heroEyebrow`      | String           | No       |
| `heroHeading`      | Text             | Yes      |
| `heroIntroduction` | Text             | Yes      |
| `heroImage`        | `editorialImage` | Yes      |
| `heroPrimaryCta`   | `internalCta`    | Yes      |
| `heroSecondaryCta` | `internalCta`    | Yes      |

### Client logos

| Field                  | Type                  | Required | Notes                                                |
| ---------------------- | --------------------- | -------- | ---------------------------------------------------- |
| `clientSectionHeading` | String                | No       | Use only if the design shows a visible heading.      |
| `clientLogos`          | Array of `clientLogo` | Yes      | Ordered embedded list. No client documents or links. |

### Featured work

| Field                 | Type                             | Required | Notes                                                                      |
| --------------------- | -------------------------------- | -------- | -------------------------------------------------------------------------- |
| `featuredWorkEyebrow` | String                           | No       | Optional visible label.                                                    |
| `featuredWorkHeading` | Text                             | Yes      | Section heading.                                                           |
| `featuredProjects`    | Array of references to `project` | Yes      | Manually curated and ordered. Do not use a `featured` boolean on projects. |
| `featuredWorkCta`     | `internalCta`                    | Yes      | Expected to lead to Work.                                                  |

Project-card title, summary, sector, and image come directly from each referenced project.

### Services overview

| Field                  | Type                             | Required |
| ---------------------- | -------------------------------- | -------- |
| `servicesHeading`      | Text                             | Yes      |
| `servicesIntroduction` | Text                             | No       |
| `featuredServices`     | Array of references to `service` | Yes      |
| `servicesCta`          | `internalCta`                    | Yes      |

### Sectors

| Field             | Type                     | Required |
| ----------------- | ------------------------ | -------- |
| `sectorsHeading`  | Text                     | Yes      |
| `sectorSummaries` | Array of `sectorSummary` | Yes      |

### Process summary

| Field                 | Type                   | Required | Notes                                    |
| --------------------- | ---------------------- | -------- | ---------------------------------------- |
| `processHeading`      | Text                   | Yes      | Home-specific heading.                   |
| `processIntroduction` | Text                   | No       | Home-specific short copy.                |
| `processSteps`        | Array of `processStep` | Yes      | Fixed design expects four ordered steps. |
| `processCta`          | `internalCta`          | Yes      | Expected to lead to Services.            |

### Studio introduction

| Field                | Type             | Required |
| -------------------- | ---------------- | -------- |
| `studioHeading`      | Text             | Yes      |
| `studioIntroduction` | Text             | Yes      |
| `studioImage`        | `editorialImage` | Yes      |
| `studioCta`          | `internalCta`    | Yes      |

### Journal preview

| Field                 | Type                             | Required | Notes                         |
| --------------------- | -------------------------------- | -------- | ----------------------------- |
| `journalHeading`      | Text                             | Yes      | Section heading.              |
| `journalIntroduction` | Text                             | No       | Optional short introduction.  |
| `featuredArticles`    | Array of references to `article` | Yes      | Manually curated and ordered. |
| `journalCta`          | `internalCta`                    | Yes      | Expected to lead to Journal.  |

Article cards use each article’s title, standfirst, category, publication date, and hero image. There are no card-specific override fields.

### Final CTA

| Field             | Type          | Required |
| ----------------- | ------------- | -------- |
| `finalCtaHeading` | Text          | Yes      |
| `finalCtaCopy`    | Text          | No       |
| `finalCta`        | `internalCta` | Yes      |

### SEO

| Field | Type        | Required |
| ----- | ----------- | -------- |
| `seo` | `seoFields` | No       |

There is no testimonial section.

---

## 3. `workPage`

| Field             | Type                             | Required | Notes                                      |
| ----------------- | -------------------------------- | -------- | ------------------------------------------ |
| `heading`         | Text                             | Yes      | Main page heading.                         |
| `introduction`    | Text                             | Yes      | Concise editorial introduction.            |
| `projects`        | Array of references to `project` | Yes      | Canonical manually ordered portfolio list. |
| `finalCtaHeading` | Text                             | Yes      | Inquiry heading.                           |
| `finalCtaCopy`    | Text                             | No       | Optional supporting copy.                  |
| `finalCta`        | `internalCta`                    | Yes      | Expected to lead to Contact.               |
| `seo`             | `seoFields`                      | No       | Optional override.                         |

### Relationship rule

The frontend derives “next project” navigation from this ordered project array. Do not store `nextProject` references on individual projects.

Do not add filters, search, pagination settings, category introductions, or card-level content overrides.

---

## 4. `servicesPage`

| Field                 | Type                             | Required | Notes                                                   |
| --------------------- | -------------------------------- | -------- | ------------------------------------------------------- |
| `heading`             | Text                             | Yes      | Main page heading.                                      |
| `introduction`        | Text                             | Yes      | Page introduction.                                      |
| `services`            | Array of references to `service` | Yes      | Ordered canonical display list.                         |
| `sectorsHeading`      | Text                             | Yes      | Sectors section heading.                                |
| `sectorSummaries`     | Array of `sectorSummary`         | Yes      | Page-specific summaries using controlled sector values. |
| `processHeading`      | Text                             | Yes      | Process section heading.                                |
| `processIntroduction` | Text                             | No       | Optional short introduction.                            |
| `processSteps`        | Array of `processStep`           | Yes      | Exactly four ordered steps.                             |
| `finalCtaHeading`     | Text                             | Yes      | Final inquiry heading.                                  |
| `finalCtaCopy`        | Text                             | No       | Optional supporting copy.                               |
| `finalCta`            | `internalCta`                    | Yes      | Expected to lead to Contact.                            |
| `seo`                 | `seoFields`                      | No       | Optional override.                                      |

There is no testimonial or proof section on Services.

---

## 5. `aboutPage`

### Introduction and philosophy

| Field               | Type             | Required |
| ------------------- | ---------------- | -------- |
| `heading`           | Text             | Yes      |
| `introduction`      | Text             | Yes      |
| `philosophyHeading` | Text             | Yes      |
| `philosophyCopy`    | Text             | Yes      |
| `philosophyImage`   | `editorialImage` | No       |

### Founder story

| Field            | Type             | Required |
| ---------------- | ---------------- | -------- |
| `founderHeading` | Text             | Yes      |
| `founderName`    | String           | Yes      |
| `founderRole`    | String           | No       |
| `founderStory`   | Text             | Yes      |
| `founderImage`   | `editorialImage` | Yes      |

### Team

| Field              | Type                   | Required |
| ------------------ | ---------------------- | -------- |
| `teamHeading`      | Text                   | Yes      |
| `teamIntroduction` | Text                   | No       |
| `teamMembers`      | Array of `teamProfile` | Yes      |

Team profiles remain embedded because there are no individual team pages.

### Working principles

| Field               | Type                                                  | Required |
| ------------------- | ----------------------------------------------------- | -------- |
| `principlesHeading` | Text                                                  | Yes      |
| `principles`        | Array of objects containing `title` and `description` | Yes      |

### Final CTA and SEO

| Field             | Type          | Required |
| ----------------- | ------------- | -------- |
| `finalCtaHeading` | Text          | Yes      |
| `finalCtaCopy`    | Text          | No       |
| `finalCta`        | `internalCta` | Yes      |
| `seo`             | `seoFields`   | No       |

Do not add testimonials unless the final design changes.

---

## 6. `journalPage`

| Field             | Type                   | Required | Notes                   |
| ----------------- | ---------------------- | -------- | ----------------------- |
| `heading`         | Text                   | Yes      | Journal index heading.  |
| `introduction`    | Text                   | Yes      | Editorial introduction. |
| `featuredArticle` | Reference to `article` | Yes      | Manually selected.      |
| `seo`             | `seoFields`            | No       | Optional override.      |

### Listing behavior

- The remaining article grid is generated automatically.
- Sort by `publicationDate` descending.
- Exclude the featured article from the remaining list.
- Card content comes from the article document.
- Newsletter content comes from `siteSettings`.
- Do not add search, filtering, pagination controls, category-page copy, or card overrides.

---

## 7. `contactPage`

| Field             | Type             | Required | Notes                              |
| ----------------- | ---------------- | -------- | ---------------------------------- |
| `heading`         | Text             | Yes      | Main page heading.                 |
| `introduction`    | Text             | Yes      | Concise invitation.                |
| `supportingImage` | `editorialImage` | Yes      | Image visible in the final design. |
| `seo`             | `seoFields`      | No       | Optional override.                 |

The following stay outside Sanity:

- Form fields and their order
- Field labels and placeholders
- Form validation rules
- Service, budget, or timing option logic
- Submission endpoint
- Spam protection
- Success and error behavior
- Toast messages

The public email address is read from `siteSettings`.

---

## 8. `service`

| Field          | Type             | Required | Notes                                                                                             |
| -------------- | ---------------- | -------- | ------------------------------------------------------------------------------------------------- |
| `title`        | String           | Yes      | Service name.                                                                                     |
| `shortSummary` | Text             | Yes      | Short reusable summary.                                                                           |
| `description`  | Text             | Yes      | Full service description. Keep as plain text unless the final layout explicitly needs formatting. |
| `deliverables` | Array of strings | Yes      | Ordered list of typical deliverables.                                                             |

Rules:

- No slug
- No route
- No individual SEO
- No ordering field
- No service-specific CTA
- No image unless a final design visibly assigns an image to each service

Display order is owned by the arrays on Home and Services.

---

## 9. `project`

Each project uses one fixed case-study template.

### Core identity

| Field          | Type                             | Required | Notes                                               |
| -------------- | -------------------------------- | -------- | --------------------------------------------------- |
| `title`        | String                           | Yes      | Public project/client or concept name.              |
| `slug`         | Slug                             | Yes      | Generated from title and unique among projects.     |
| `sector`       | Controlled string                | Yes      | One value from the project-sector list.             |
| `shortSummary` | Text                             | Yes      | Used in project cards and the project introduction. |
| `services`     | Array of references to `service` | Yes      | Strong references; prevent duplicates.              |

### Hero

| Field       | Type             | Required |
| ----------- | ---------------- | -------- |
| `heroImage` | `editorialImage` | Yes      |

The hero image is also the default project-card and social-sharing image unless an SEO image overrides it.

### Narrative

| Field          | Type                          | Required | Notes                                                          |
| -------------- | ----------------------------- | -------- | -------------------------------------------------------------- |
| `challenge`    | Constrained project rich text | Yes      | Paragraphs, emphasis, and links only.                          |
| `contribution` | Constrained project rich text | Yes      | Paragraphs, emphasis, and links only.                          |
| `outcome`      | Constrained project rich text | No       | Optional result or impact copy. It is not a testimonial field. |

Section headings such as “Challenge” and “Stillroom’s contribution” remain fixed in code.

### Gallery

| Field     | Type                                                    | Required | Notes                         |
| --------- | ------------------------------------------------------- | -------- | ----------------------------- |
| `gallery` | Array of `projectGallerySingle` or `projectGalleryPair` | Yes      | Ordered art-directed gallery. |

Only two gallery block types are permitted:

1. One image
2. An image pair

Editors do not control widths, spacing, alignment, responsive behavior, or arbitrary layout variants.

### SEO

| Field | Type        | Required |
| ----- | ----------- | -------- |
| `seo` | `seoFields` | No       |

### Project exclusions

Do not add:

- Testimonial fields
- Featured booleans
- Numeric ordering fields
- Next-project references
- Custom section builders
- Card-specific title, summary, or image fields
- Individual design/style settings

---

## 10. `article`

The linked final article design establishes this fixed editorial model:

- Category and manually entered reading time
- Title
- Author and publication date
- Standfirst
- Hero image with optional caption
- Numbered/labeled article sections
- Full-width pull quote
- Author note
- Exactly two related articles

### Core identity

| Field             | Type                           | Required | Notes                                                                                                                |
| ----------------- | ------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `title`           | String                         | Yes      | Public article title.                                                                                                |
| `slug`            | Slug                           | Yes      | Generated from title and unique among articles.                                                                      |
| `category`        | Reference to `journalCategory` | Yes      | Strong reference.                                                                                                    |
| `author`          | Reference to `author`          | Yes      | Strong reference.                                                                                                    |
| `publicationDate` | Date or datetime               | Yes      | Editorial display date. Do not use `_createdAt` as the public date.                                                  |
| `standfirst`      | Text                           | Yes      | Used in the article introduction and article cards.                                                                  |
| `readingTime`     | String                         | Yes      | Manually entered display value, such as `5 min read`. Keep this editable until automated calculation is implemented. |

### Hero

| Field       | Type             | Required | Notes                                                            |
| ----------- | ---------------- | -------- | ---------------------------------------------------------------- |
| `heroImage` | `editorialImage` | Yes      | Caption is optional. This is also the default card/social image. |

### Body

| Field  | Type                                                                  | Required | Notes                                                |
| ------ | --------------------------------------------------------------------- | -------- | ---------------------------------------------------- |
| `body` | Array of `articleSection`, `articlePullQuote`, and `articleBodyImage` | Yes      | Ordered and constrained to approved design patterns. |

#### `articleSection`

| Field     | Type                      | Required | Notes                                                          |
| --------- | ------------------------- | -------- | -------------------------------------------------------------- |
| `label`   | String                    | Yes      | Editorial margin label, such as `01 / THE FEELING OF A PLACE`. |
| `content` | Constrained Portable Text | Yes      | Paragraphs, subheadings, strong/emphasis, and links only.      |

Tables, embeds, code blocks, arbitrary layout blocks, and additional heading levels are excluded.

#### `articlePullQuote`

| Field   | Type   | Required |
| ------- | ------ | -------- |
| `label` | String | No       |
| `quote` | Text   | Yes      |

No attribution field is needed unless a future final design includes one.

#### `articleBodyImage`

| Field   | Type             | Required | Notes                                                                                                                                      |
| ------- | ---------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `image` | `editorialImage` | Yes      | Full-width image displayed between article sections. Alt text is required unless explicitly decorative; the inherited caption is optional. |

Article body images use the fixed full-width composition from the article template. Editors do not control width, alignment, aspect ratio, spacing, or responsive behavior.

### Related content

| Field             | Type                             | Required | Notes                                       |
| ----------------- | -------------------------------- | -------- | ------------------------------------------- |
| `relatedArticles` | Array of references to `article` | Yes      | Exactly two; manually selected and ordered. |

Validation must prevent:

- Selecting the current article
- Selecting the same related article twice
- Publishing with fewer or more than two related articles

### SEO

| Field | Type        | Required |
| ----- | ----------- | -------- |
| `seo` | `seoFields` | No       |

### Article exclusions

Do not add:

- Automated or calculated reading time
- Updated date
- Scheduled date field
- Tags
- Arbitrary image layout controls
- Embedded video or social posts
- Arbitrary page-builder blocks
- Card-specific content overrides

---

## 11. `author`

| Field       | Type             | Required | Notes                                       |
| ----------- | ---------------- | -------- | ------------------------------------------- |
| `name`      | String           | Yes      | Public byline name.                         |
| `role`      | String           | No       | Optional author role.                       |
| `biography` | Text             | Yes      | Short author note shown at the article end. |
| `portrait`  | `editorialImage` | No       | Only if the article design renders it.      |

Do not add an author slug, author page, social links, contact details, or author SEO.

---

## 12. `journalCategory`

| Field   | Type   | Required | Notes                                            |
| ------- | ------ | -------- | ------------------------------------------------ |
| `title` | String | Yes      | Visible category label.                          |
| `slug`  | Slug   | Yes      | Stable internal identifier generated from title. |

Do not add hierarchy, description, image, category page, or category SEO.

---

# Reusable object specifications

## `editorialImage`

| Field            | Type         | Required    | Notes                                                                                      |
| ---------------- | ------------ | ----------- | ------------------------------------------------------------------------------------------ |
| `asset`          | Sanity image | Yes         | Enable hotspot and crop.                                                                   |
| `decorative`     | Boolean      | Yes         | Defaults to false.                                                                         |
| `alt`            | String       | Conditional | Required when `decorative` is false; must be empty when decorative.                        |
| `caption`        | Text         | No          | Used only where the design supports a caption.                                             |
| `mobileOverride` | Sanity image | No          | Only when mobile uses genuinely different artwork or composition. Enable hotspot and crop. |

Rules:

- Use one source image with responsive crops by default.
- Do not require separate mobile assets everywhere.
- Avoid filenames as alt text.
- Captions describe editorial context; they do not replace alt text.
- Project, article, portrait, and logo imagery should normally be non-decorative.

## `seoFields`

| Field             | Type                                       | Required | Notes                                                             |
| ----------------- | ------------------------------------------ | -------- | ----------------------------------------------------------------- |
| `metaTitle`       | String                                     | No       | Optional override. Show recommended-length guidance as a warning. |
| `metaDescription` | Text                                       | No       | Optional override. Show recommended-length guidance as a warning. |
| `socialImage`     | Sanity image or simplified editorial image | No       | Optional sharing-image override.                                  |

Do not add keyword fields, canonical URL inputs, robots/noindex controls, schema.org editors, or social-network-specific copies.

### SEO fallback chain

1. Document-specific SEO value
2. Document title/description and hero or card image
3. Global defaults from `siteSettings`

Canonical URLs and structured metadata are generated in code.

## `internalCta`

| Field         | Type                            | Required |
| ------------- | ------------------------------- | -------- |
| `label`       | String                          | Yes      |
| `destination` | Controlled internal destination | Yes      |

Allowed destinations should map to known routes rather than asking editors to type paths. Do not expose style, color, size, alignment, icon, or animation fields.

## `navigationItem`

| Field         | Type                            | Required |
| ------------- | ------------------------------- | -------- |
| `label`       | String                          | Yes      |
| `destination` | Controlled internal destination | Yes      |

Prevent duplicate destinations within the same navigation array.

## `socialLink`

| Field      | Type   | Required |
| ---------- | ------ | -------- |
| `platform` | String | Yes      |
| `url`      | URL    | Yes      |

Require `https://` URLs. Icons are mapped in code for known platforms.

## `clientLogo`

| Field        | Type        | Required |
| ------------ | ----------- | -------- |
| `clientName` | String      | Yes      |
| `logo`       | Image asset | Yes      |

The client name supplies accessible text. Do not add links, descriptions, categories, or client documents.

## `sectorSummary`

| Field     | Type                    | Required |
| --------- | ----------------------- | -------- |
| `sector`  | Controlled sector value | Yes      |
| `heading` | String                  | Yes      |
| `summary` | Text                    | Yes      |

Prevent duplicate sector values within one page’s array.

## `processStep`

| Field         | Type   | Required |
| ------------- | ------ | -------- |
| `title`       | String | Yes      |
| `description` | Text   | Yes      |

The visible step number is derived from array order rather than entered manually.

## `teamProfile`

| Field       | Type             | Required |
| ----------- | ---------------- | -------- |
| `name`      | String           | Yes      |
| `role`      | String           | Yes      |
| `biography` | Text             | Yes      |
| `portrait`  | `editorialImage` | Yes      |

Do not add slugs, profile pages, social links, or contact details.

## Project gallery blocks

### `projectGallerySingle`

| Field   | Type             | Required |
| ------- | ---------------- | -------- |
| `image` | `editorialImage` | Yes      |

### `projectGalleryPair`

| Field        | Type             | Required |
| ------------ | ---------------- | -------- |
| `leftImage`  | `editorialImage` | Yes      |
| `rightImage` | `editorialImage` | Yes      |

The frontend owns stacking order on small screens.

---

# Relationships

```text
siteSettings
  ├── global navigation and footer destinations
  └── default SEO and newsletter content

homePage
  ├── project[]
  ├── service[]
  └── article[]

workPage
  └── project[] (canonical portfolio order)

servicesPage
  └── service[]

journalPage
  └── article (featured)

project
  └── service[]

article
  ├── author
  ├── journalCategory
  └── article[] (exactly two related articles)
```

All references are strong references.

## Ordering ownership

- Work project order: `workPage.projects`
- Home featured work order: `homePage.featuredProjects`
- Services page order: `servicesPage.services`
- Home services order: `homePage.featuredServices`
- Home article order: `homePage.featuredArticles`
- Journal archive order: `publicationDate` descending
- Related article order: `article.relatedArticles`
- Project gallery order: `project.gallery`

Do not add numeric order fields or order-ranking plugins initially.

---

# Taxonomy

## Project sectors

Use a controlled string list rather than sector documents:

- Restaurants
- Boutique hotels
- Cafés and bars
- Food and beverage brands

Store stable internal values separately from display labels so copy casing can change safely.

Sector labels are used for project classification. Home and Services use page-specific `sectorSummary` objects tied to the same controlled values.

## Journal categories

Use `journalCategory` documents because editors need to create and reuse category labels across articles.

Do not implement:

- Tags
- Nested categories
- Sector pages
- Category pages
- Taxonomy descriptions
- Frontend filtering at launch

---

# Validation strategy

## Errors: block publishing

Use hard validation only where missing or invalid content would break a page, relationship, accessibility, or URL.

Examples:

- Required public titles and headings
- Required slugs on projects and articles
- Unique project/article slugs within their type
- Required hero and section images
- Required alt text for non-decorative images
- Required references
- Exactly two related articles
- No self-reference or duplicates in related articles
- Exactly four process steps where the fixed layout requires four
- Valid email address
- Valid `https://` external URLs
- Required project gallery content
- No duplicate references inside arrays where duplication is not meaningful

## Warnings: allow publishing

Use warnings for editorial guidance and layout-sensitive copy rather than rigid character limits.

Examples:

- SEO title is unusually short or long
- Meta description is unusually short or long
- Heading or standfirst may exceed the expected design length
- Project summary is unusually long
- Image caption is unusually long
- A fixed card area contains fewer items than the preferred design count but can still render safely

## Array limits

Apply minimum/maximum limits only where the final composition depends on them.

Confirmed strict examples:

- `servicesPage.processSteps`: exactly 4
- `homePage.processSteps`: exactly 4
- `article.relatedArticles`: exactly 2
- `projectGalleryPair`: exactly 2 images by object structure

Naturally flowing arrays, especially project galleries, may remain open-ended.

## Slug behavior

- Generate project and article slugs from titles.
- Require uniqueness within the relevant content type.
- Warn editors before changing the slug of an already published document.
- Fixed pages do not have editable slugs.
- Redirect management is outside this initial schema.

---

# Assets

## Supported assets

The initial CMS supports images only:

- Project imagery
- Journal hero and body imagery
- Page imagery
- Team/founder portraits
- Client logos
- Social-sharing images

Do not add video, audio, PDF, document-download, or arbitrary file fields.

Use standard raster formats for photography. SVG may be accepted for logos or graphic assets, with the understanding that Sanity’s normal raster image transformations do not apply to SVG files.

## Image responsibilities

Editors control:

- Source asset
- Hotspot and crop
- Required alt text or explicit decorative status
- Optional caption where supported
- Optional mobile override where genuinely needed

The frontend controls:

- Rendered sizes
- Aspect ratios
- Responsive source sets
- Compression and format selection
- Layout position
- Gallery widths and spacing
- Mobile stacking

---

# SEO requirements

Every public singleton page, project, and article receives optional `seoFields`.

Services, authors, and journal categories do not receive SEO fields because they do not have standalone public pages.

## Generated in code

- Canonical URL
- Open Graph URL and site name
- Twitter/X card type
- Structured data
- Robots directives
- Title templates
- Fallback metadata

## Editor guidance

SEO fields are overrides, not duplicate required content. The frontend should use visible page content when overrides are empty.

No initial keyword, `noindex`, canonical URL, or structured-data controls are needed.

---

# Editorial workflow

## Workflow states

Use Sanity’s built-in workflow only:

1. Draft
2. Preview
3. Publish

Do not add:

- Custom approval states
- Scheduled publishing
- Role-based review stages
- Editorial assignments
- Content calendars
- Localization workflow

## Preview

Every singleton page, project, and article should eventually expose a preview action that renders the current draft in the website.

Sanity list previews should show:

- A useful title
- A useful subtitle, such as sector, category, role, or publication date
- A thumbnail when an appropriate image exists

Preview URL wiring belongs to the later CMS setup session.

## Suggested publishing sequence

Because references are strong:

1. Create services, authors, and journal categories.
2. Create projects and article drafts.
3. Complete related-article relationships once at least three articles exist.
4. Populate singleton pages with ordered references.
5. Preview the site.
6. Publish referenced documents before publishing pages that depend on them.

---

# Suggested Sanity Studio organization

This is an information architecture recommendation, not implementation code.

```text
Content
├── Global
│   └── Site Settings
├── Pages
│   ├── Home
│   ├── Work
│   ├── Services
│   ├── About
│   ├── Journal
│   └── Contact
├── Work
│   └── Projects
├── Journal
│   ├── Articles
│   ├── Authors
│   └── Categories
└── Reusable Content
    └── Services
```

Hide singleton document types from generic document lists and generic create menus.

---

# Explicit exclusions

The following are intentionally outside the initial content model:

- Generic page builder
- Editor-controlled section order
- Testimonial content
- Individual service pages
- Individual author pages
- Sector or category archive pages
- Search and filtering configuration
- CMS-controlled form structure
- Video, audio, embeds, and downloadable documents
- Inline article images
- Localization
- Scheduled publishing
- Approval workflows
- Redirect management
- CMS-managed 404 page
- CMS-managed colors, typography, spacing, animation, icons, or component variants
- Card-specific duplicate content
- Featured booleans
- Numeric ordering fields
- Automated article reading time
- SEO keyword fields
- Editor-controlled canonical URLs or `noindex`

---

# Implementation checklist for the later CMS session

1. Create the eleven document schemas listed in this specification.
2. Create the reusable object schemas.
3. Add singleton desk structure and duplicate-prevention rules.
4. Add constrained internal-destination options.
5. Add controlled project-sector options.
6. Configure strong references and duplicate-reference validation.
7. Configure conditional image alt-text validation.
8. Configure article self-reference and related-article validation.
9. Add slug generation and published-slug warnings.
10. Add Studio previews and document list previews.
11. Implement frontend draft preview.
12. Render the manually entered article reading time consistently on cards and article pages.
13. Implement SEO fallback rules.
14. Confirm fixed-layout array limits against the final rendered components before applying nonessential hard limits.
15. Test draft, preview, publish, reference deletion, missing-image, missing-alt, duplicate-reference, and slug-change behavior.
