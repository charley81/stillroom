# Stillroom Sanity CMS Content Model

## Purpose

This document defines the approved content model for the first Stillroom Sanity CMS implementation.

It is based on:

1. the final desktop and mobile Figma designs
2. the current website content
3. the decisions from the Sanity implementation planning session

The model uses fixed page templates. Editors can change approved content and images. Editors cannot change page layout, section order, routes, styling, or brand presentation.

Implementation steps belong in [`sanity-implementation-plan.md`](./sanity-implementation-plan.md).

## Core rules

1. Fixed pages are singleton documents.
2. Work Projects, Journal Articles, Services, Authors, Journal Categories, and Client Logos are reusable documents.
3. Sanity is the only runtime content source after cutover.
4. Editors cannot add, remove, or reorder page sections.
5. Structural labels and visible section numbers stay in Astro code.
6. Internal link destinations stay in Astro code. Editors can change visible call-to-action labels only.
7. Header and footer destinations and order stay in Astro code. Editors can change their visible labels.
8. English is the only supported language.
9. Sanity manages content, not visual design controls.
10. All references are strong references.
11. The 404 page remains in Astro code.
12. Published Work Project and Journal Article slugs become read-only.
13. Fixed item counts use hard validation when the final layout requires an exact count.
14. Missing required content blocks publishing and production deployment.

---

# Content type inventory

## Singleton documents

| Schema name    | Studio title  | Purpose                                                                                                                 |
| -------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `siteSettings` | Site Settings | Global identity, navigation labels, contact details, newsletter content, footer content, social links, and default SEO. |
| `homePage`     | Home          | Content and curated references for the Home page.                                                                       |
| `workPage`     | Work          | Work page heading, artwork, Work Project order, and final call to action.                                               |
| `servicesPage` | Services      | Services introduction, process, hospitality content, and final statement.                                               |
| `aboutPage`    | About         | Studio introduction, founder story, team, principles, client proof, and final call to action.                           |
| `journalPage`  | Journal       | Journal introduction, artwork, and featured Journal Article.                                                            |
| `contactPage`  | Contact       | Contact introduction, supporting image, and supporting statement.                                                       |

Singletons use stable document IDs. They are hidden from generic create menus and cannot be duplicated or deleted through normal Studio actions.

## Repeatable documents

| Schema name       | Studio title     | Purpose                                                                                |
| ----------------- | ---------------- | -------------------------------------------------------------------------------------- |
| `workProject`     | Work Project     | A portfolio entry that uses the fixed Work Project page template.                      |
| `journalArticle`  | Journal Article  | An editorial entry published in the Stillroom Journal.                                 |
| `service`         | Service          | Reusable Service content shown on Home, Services, Work Projects, and the Contact form. |
| `author`          | Author           | Reusable Journal Article byline and author note.                                       |
| `journalCategory` | Journal Category | Controlled Journal Article category labels.                                            |
| `clientLogo`      | Client Logo      | A reusable client identity mark shown on Home and About.                               |

## Reusable object types

| Schema name                    | Purpose                                                                             |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| `editorialImage`               | Accessible image content with crop, hotspot, caption, and optional mobile override. |
| `seoFields`                    | Optional per-document SEO overrides.                                                |
| `socialLink`                   | Platform label and external URL.                                                    |
| `processStep`                  | One fixed process step.                                                             |
| `teamProfile`                  | One embedded About-page team member.                                                |
| `narrativeSection`             | Editable heading and constrained rich text for a fixed narrative section.           |
| `journalArticleSection`        | Margin label and constrained Journal Article text.                                  |
| `journalArticlePullQuote`      | Full-width Journal Article pull quote.                                              |
| `workProjectGalleryImage`      | One full-width Work Project gallery image.                                          |
| `workProjectGalleryBrandPanel` | Editable brand-language panel beside one image.                                     |

---

# Fixed interface content

The following stay in Astro code:

- page routes
- page section order
- structural section labels, such as “The challenge,” “The outcome,” and “Our services”
- visible section and process numbers
- header and footer destination order
- call-to-action destinations
- button styles and variants
- form structure, field order, validation, and submission behavior
- responsive layout and image presentation
- colors, typography, spacing, animation, icons, and decorative graphics

Editors can change the visible labels for navigation and calls to action, but not their destinations.

---

# Document specifications

## 1. `siteSettings`

### Identity

| Field                | Type   | Required | Notes                                        |
| -------------------- | ------ | -------- | -------------------------------------------- |
| `studioName`         | String | Yes      | Public studio name.                          |
| `registeredMarkText` | String | Yes      | Visible wordmark text, such as `stillroom®`. |

### Fixed-route navigation labels

| Field            | Type   | Required |
| ---------------- | ------ | -------- |
| `homeLabel`      | String | Yes      |
| `workLabel`      | String | Yes      |
| `servicesLabel`  | String | Yes      |
| `aboutLabel`     | String | Yes      |
| `journalLabel`   | String | Yes      |
| `contactLabel`   | String | Yes      |
| `headerCtaLabel` | String | Yes      |

Astro owns the route destinations and order. Editors cannot add navigation items.

### Contact and social information

| Field          | Type                  | Required | Notes                           |
| -------------- | --------------------- | -------- | ------------------------------- |
| `emailAddress` | Email                 | Yes      | Canonical public email address. |
| `socialLinks`  | Array of `socialLink` | No       | Ordered external profiles.      |

### Newsletter

| Field                   | Type   | Required |
| ----------------------- | ------ | -------- |
| `newsletterHeading`     | String | Yes      |
| `newsletterDescription` | Text   | Yes      |

The structural label, form label, placeholder, button label, validation, integration, and result messages remain in Astro code.

### Footer

| Field           | Type   | Required | Notes                                 |
| --------------- | ------ | -------- | ------------------------------------- |
| `footerTagline` | String | Yes      | For example, `Independent by nature.` |

Astro generates the copyright line from `studioName` and the current year.

### Default SEO

| Field                   | Type             | Required |
| ----------------------- | ---------------- | -------- |
| `defaultSeoTitle`       | String           | Yes      |
| `defaultSeoDescription` | Text             | Yes      |
| `defaultSocialImage`    | `editorialImage` | Yes      |

---

## 2. `homePage`

The Home document follows the final design order. Editors cannot reorder the sections.

### Hero

| Field                   | Type             | Required |
| ----------------------- | ---------------- | -------- |
| `heroHeading`           | Text             | Yes      |
| `heroImage`             | `editorialImage` | Yes      |
| `heroPrimaryCtaLabel`   | String           | Yes      |
| `heroSecondaryCtaLabel` | String           | Yes      |

Destinations are fixed to Contact and Work. The final design does not contain a hero introduction paragraph.

### Client Logos

| Field         | Type                                | Required | Validation                |
| ------------- | ----------------------------------- | -------- | ------------------------- |
| `clientLogos` | Array of references to `clientLogo` | Yes      | Exactly 5; no duplicates. |

### Featured Work Projects

| Field                  | Type                                 | Required | Validation                    |
| ---------------------- | ------------------------------------ | -------- | ----------------------------- |
| `featuredWorkHeading`  | Text                                 | Yes      | Warn for unusually long copy. |
| `featuredWorkProjects` | Array of references to `workProject` | Yes      | Exactly 2; no duplicates.     |
| `featuredWorkCtaLabel` | String                               | Yes      | Destination fixed to Work.    |

### Featured Services

| Field              | Type                             | Required | Validation                |
| ------------------ | -------------------------------- | -------- | ------------------------- |
| `featuredServices` | Array of references to `service` | Yes      | Exactly 4; no duplicates. |

The section label stays in Astro. Cards use each Service title and short summary.

### Sector statement

| Field          | Type             | Required | Validation                |
| -------------- | ---------------- | -------- | ------------------------- |
| `sectorLabels` | Array of strings | Yes      | Exactly 4; no duplicates. |

This is marketing copy, not a taxonomy.

### Studio introduction

| Field                | Type             | Required |
| -------------------- | ---------------- | -------- |
| `studioHeading`      | Text             | Yes      |
| `studioIntroduction` | Text             | Yes      |
| `studioImage`        | `editorialImage` | Yes      |
| `studioCtaLabel`     | String           | Yes      |

The destination is fixed to About.

### Point of view

| Field                | Type | Required |
| -------------------- | ---- | -------- |
| `pointOfViewHeading` | Text | Yes      |
| `pointOfViewCopy`    | Text | Yes      |

### Process

| Field             | Type                   | Required | Validation                     |
| ----------------- | ---------------------- | -------- | ------------------------------ |
| `processHeading`  | Text                   | Yes      | Warn for unusually long copy.  |
| `processSteps`    | Array of `processStep` | Yes      | Exactly 4.                     |
| `processCtaLabel` | String                 | Yes      | Destination fixed to Services. |

Visible step numbers come from array order.

### Journal preview

| Field                     | Type                                    | Required | Validation                    |
| ------------------------- | --------------------------------------- | -------- | ----------------------------- |
| `journalHeading`          | Text                                    | Yes      | Warn for unusually long copy. |
| `featuredJournalArticles` | Array of references to `journalArticle` | Yes      | Exactly 3; no duplicates.     |
| `journalCtaLabel`         | String                                  | Yes      | Destination fixed to Journal. |

Cards use each Journal Article’s category, reading time, title, and hero image.

### Final call to action

| Field             | Type   | Required |
| ----------------- | ------ | -------- |
| `finalCtaEyebrow` | String | Yes      |
| `finalCtaHeading` | Text   | Yes      |
| `finalCtaLabel`   | String | Yes      |

The destination is fixed to Contact.

### SEO

| Field | Type        | Required |
| ----- | ----------- | -------- |
| `seo` | `seoFields` | No       |

---

## 3. `workPage`

| Field             | Type                                 | Required | Notes                                               |
| ----------------- | ------------------------------------ | -------- | --------------------------------------------------- |
| `heading`         | Text                                 | Yes      | Main page heading.                                  |
| `heroArtwork`     | `editorialImage`                     | Yes      | Artwork beside the heading.                         |
| `workProjects`    | Array of references to `workProject` | Yes      | Canonical ordered Work Project list; no duplicates. |
| `finalCtaEyebrow` | String                               | Yes      | Final invitation copy.                              |
| `finalCtaHeading` | Text                                 | Yes      | Final invitation heading.                           |
| `finalCtaLabel`   | String                               | Yes      | Destination fixed to Contact.                       |
| `seo`             | `seoFields`                          | No       | Optional SEO override.                              |

The final design does not contain a Work-page introduction paragraph.

The frontend derives next-Work-Project navigation from `workProjects`. A Work Project does not store its own next reference or numeric order field.

---

## 4. `servicesPage`

### Hero

| Field              | Type             | Required |
| ------------------ | ---------------- | -------- |
| `heroHeading`      | Text             | Yes      |
| `heroIntroduction` | Text             | Yes      |
| `heroImage`        | `editorialImage` | Yes      |
| `heroCtaLabel`     | String           | Yes      |

The destination is fixed to Contact.

### Services

| Field      | Type                             | Required | Validation                |
| ---------- | -------------------------------- | -------- | ------------------------- |
| `services` | Array of references to `service` | Yes      | Exactly 4; no duplicates. |

### Process

| Field            | Type                   | Required | Validation              |
| ---------------- | ---------------------- | -------- | ----------------------- |
| `processHeading` | Text                   | Yes      | Main process statement. |
| `processSteps`   | Array of `processStep` | Yes      | Exactly 4.              |

### Hospitality section

| Field                     | Type             | Required |
| ------------------------- | ---------------- | -------- |
| `hospitalityHeading`      | Text             | Yes      |
| `hospitalitySectorLabels` | Array of strings | Yes      |
| `hospitalityPointOfView`  | Text             | Yes      |
| `hospitalityImage`        | `editorialImage` | Yes      |
| `hospitalityCtaLabel`     | String           | Yes      |

The destination is fixed to Work. This is one combined content block, not separate sector summaries.

### Final statement

| Field                   | Type   | Required |
| ----------------------- | ------ | -------- |
| `finalStatementEyebrow` | String | Yes      |
| `finalStatementHeading` | Text   | Yes      |

The final Services design does not contain a button in this section.

### SEO

| Field | Type        | Required |
| ----- | ----------- | -------- |
| `seo` | `seoFields` | No       |

---

## 5. `aboutPage`

### Introduction

| Field       | Type             | Required |
| ----------- | ---------------- | -------- |
| `heading`   | Text             | Yes      |
| `heroImage` | `editorialImage` | Yes      |

### Founder story

| Field            | Type                  | Required |
| ---------------- | --------------------- | -------- |
| `founderHeading` | Text                  | Yes      |
| `founderStory`   | Constrained rich text | Yes      |
| `founderName`    | String                | Yes      |
| `founderRole`    | String                | Yes      |
| `founderImage`   | `editorialImage`      | Yes      |

### Team

| Field              | Type                   | Required | Validation                    |
| ------------------ | ---------------------- | -------- | ----------------------------- |
| `teamHeading`      | Text                   | Yes      | Warn for unusually long copy. |
| `teamIntroduction` | Text                   | Yes      | Short introduction.           |
| `teamMembers`      | Array of `teamProfile` | Yes      | Exactly 3.                    |

### Working principles

| Field               | Type                                            | Required | Validation                 |
| ------------------- | ----------------------------------------------- | -------- | -------------------------- |
| `principlesHeading` | Text                                            | Yes      | Main principles statement. |
| `principles`        | Array of objects with `title` and `description` | Yes      | Exactly 3.                 |

Visible principle numbers come from array order.

### Client proof

| Field                 | Type                                | Required | Validation                 |
| --------------------- | ----------------------------------- | -------- | -------------------------- |
| `clientProofHeading`  | Text                                | Yes      | Main proof heading.        |
| `clientProofCopy`     | Text                                | Yes      | Supporting copy.           |
| `clientLogos`         | Array of references to `clientLogo` | Yes      | Exactly 5; no duplicates.  |
| `clientProofCtaLabel` | String                              | Yes      | Destination fixed to Work. |

### Final call to action

| Field             | Type   | Required |
| ----------------- | ------ | -------- |
| `finalCtaEyebrow` | String | Yes      |
| `finalCtaHeading` | Text   | Yes      |
| `finalCtaLabel`   | String | Yes      |

The destination is fixed to Contact.

### SEO

| Field | Type        | Required |
| ----- | ----------- | -------- |
| `seo` | `seoFields` | No       |

---

## 6. `journalPage`

| Field                    | Type                          | Required | Notes                                 |
| ------------------------ | ----------------------------- | -------- | ------------------------------------- |
| `heading`                | Text                          | Yes      | Main Journal heading.                 |
| `introduction`           | Text                          | Yes      | Editorial introduction.               |
| `introductionArtwork`    | `editorialImage`              | Yes      | Notebook artwork in the introduction. |
| `featuredJournalArticle` | Reference to `journalArticle` | Yes      | Manually selected.                    |
| `seo`                    | `seoFields`                   | No       | Optional SEO override.                |

The remaining Journal Articles are automatic:

- order by `publicationDate` descending
- exclude the featured Journal Article
- use the fixed latest-articles heading from Astro
- use Journal Article content directly
- do not add filtering, search, or pagination at launch

---

## 7. `contactPage`

| Field                 | Type             | Required |
| --------------------- | ---------------- | -------- |
| `heading`             | Text             | Yes      |
| `introduction`        | Text             | Yes      |
| `supportingImage`     | `editorialImage` | Yes      |
| `supportingStatement` | String           | Yes      |
| `seo`                 | `seoFields`      | No       |

The contact form keeps its structure, field order, labels, placeholders, validation, submission endpoint, spam protection, and result behavior in Astro.

The four Service choice labels and values come from `servicesPage.services` so they cannot drift from the Services page.

---

## 8. `service`

| Field          | Type             | Required | Notes                                                      |
| -------------- | ---------------- | -------- | ---------------------------------------------------------- |
| `title`        | String           | Yes      | Public Service name.                                       |
| `shortSummary` | Text             | Yes      | Used in compact Home presentation.                         |
| `description`  | Text             | Yes      | Full Services-page description.                            |
| `image`        | `editorialImage` | Yes      | Required by the final Services design.                     |
| `deliverables` | Array of strings | Yes      | Ordered deliverables; prevent empty values and duplicates. |

A Service has no slug, route, SEO fields, numeric order field, style settings, or Service-specific call to action. Page reference arrays own display order.

---

## 9. `workProject`

Each Work Project uses one fixed page template.

### Identity and card content

| Field         | Type                             | Required | Notes                                                                |
| ------------- | -------------------------------- | -------- | -------------------------------------------------------------------- |
| `title`       | String                           | Yes      | Public Work Project title.                                           |
| `slug`        | Slug                             | Yes      | Generated from title, unique, and read-only after first publication. |
| `sectorLabel` | String                           | Yes      | Short editable display label; not a taxonomy.                        |
| `cardSummary` | Text                             | Yes      | Summary on Work and Home cards.                                      |
| `cardImage`   | `editorialImage`                 | Yes      | Used on Work, Home, and next-Work-Project presentation.              |
| `services`    | Array of references to `service` | Yes      | Strong references; no duplicates.                                    |

### Introduction and hero

| Field                  | Type             | Required |
| ---------------------- | ---------------- | -------- |
| `positioningStatement` | Text             | Yes      |
| `introduction`         | Text             | Yes      |
| `heroArtwork`          | `editorialImage` | Yes      |
| `heroPhotograph`       | `editorialImage` | Yes      |

The card image, hero artwork, and hero photograph are separate required images because the final design uses different compositions.

### Narrative

| Field          | Type               | Required |
| -------------- | ------------------ | -------- |
| `challenge`    | `narrativeSection` | Yes      |
| `contribution` | `narrativeSection` | Yes      |

Each narrative section contains an editable heading and constrained rich text. Structural labels stay in Astro.

### Gallery

| Field            | Type                                          | Required | Notes                    |
| ---------------- | --------------------------------------------- | -------- | ------------------------ |
| `galleryHeading` | String                                        | Yes      | Visible gallery heading. |
| `gallery`        | Array of approved Work Project gallery blocks | Yes      | Ordered and open-ended.  |

Allowed gallery blocks:

1. `workProjectGalleryImage`: one full-width image
2. `workProjectGalleryBrandPanel`: editable title, statement, label, and one image

Do not add a generic two-image pair. The final design uses a brand-language panel beside one image.

### Outcome

| Field            | Type                  | Required |
| ---------------- | --------------------- | -------- |
| `outcomeHeading` | Text                  | Yes      |
| `outcomeCopy`    | Constrained rich text | Yes      |

The structural “The outcome” label stays in Astro.

### SEO

| Field | Type        | Required |
| ----- | ----------- | -------- |
| `seo` | `seoFields` | No       |

### Exclusions

Do not add:

- featured booleans
- numeric order fields
- next-Work-Project references
- arbitrary page-builder blocks
- editor-controlled gallery width or alignment
- design or style settings
- testimonial fields

---

## 10. `journalArticle`

### Identity

| Field             | Type                           | Required | Notes                                                                |
| ----------------- | ------------------------------ | -------- | -------------------------------------------------------------------- |
| `title`           | String                         | Yes      | Public Journal Article title.                                        |
| `slug`            | Slug                           | Yes      | Generated from title, unique, and read-only after first publication. |
| `category`        | Reference to `journalCategory` | Yes      | Strong reference.                                                    |
| `author`          | Reference to `author`          | Yes      | Strong reference.                                                    |
| `publicationDate` | Date                           | Yes      | Public editorial date.                                               |
| `standfirst`      | Text                           | Yes      | Used in introductions and cards.                                     |
| `readingTime`     | String                         | Yes      | Manually entered display value, such as `5 min read`.                |

### Hero

| Field       | Type             | Required |
| ----------- | ---------------- | -------- |
| `heroImage` | `editorialImage` | Yes      |

The same source image is used for cards and the Journal Article hero with frontend-controlled responsive crops. A separate card override is not part of the initial model.

### Body

| Field  | Type                                                           | Required | Validation            |
| ------ | -------------------------------------------------------------- | -------- | --------------------- |
| `body` | Array of `journalArticleSection` and `journalArticlePullQuote` | Yes      | At least one section. |

#### `journalArticleSection`

| Field     | Type                      | Required |
| --------- | ------------------------- | -------- |
| `label`   | String                    | Yes      |
| `content` | Constrained Portable Text | Yes      |

Allowed content:

- paragraphs
- approved subheadings
- strong and emphasis marks
- approved links

#### `journalArticlePullQuote`

| Field   | Type   | Required |
| ------- | ------ | -------- |
| `label` | String | No       |
| `quote` | Text   | Yes      |

The initial model does not support images inside the Journal Article body.

### Related Journal Articles

| Field                    | Type                                    | Required | Validation                                  |
| ------------------------ | --------------------------------------- | -------- | ------------------------------------------- |
| `relatedJournalArticles` | Array of references to `journalArticle` | Yes      | Exactly 2; no self-reference or duplicates. |

### SEO

| Field | Type        | Required |
| ----- | ----------- | -------- |
| `seo` | `seoFields` | No       |

### Exclusions

Do not add:

- automated reading time
- updated or scheduled date fields
- tags
- body images
- embeds, video, or social posts
- arbitrary page-builder blocks
- card-specific content overrides

---

## 11. `author`

| Field       | Type   | Required |
| ----------- | ------ | -------- |
| `name`      | String | Yes      |
| `biography` | Text   | Yes      |

The final design does not show an author role, portrait, route, slug, social links, contact details, or SEO fields.

---

## 12. `journalCategory`

| Field   | Type   | Required |
| ------- | ------ | -------- |
| `title` | String | Yes      |
| `slug`  | Slug   | Yes      |

The slug is a stable internal identifier. A Journal Category has no hierarchy, description, image, public page, or SEO fields.

---

## 13. `clientLogo`

| Field        | Type        | Required | Notes                                          |
| ------------ | ----------- | -------- | ---------------------------------------------- |
| `clientName` | String      | Yes      | Accessible name and Studio title.              |
| `logo`       | Image asset | Yes      | Complete approved logo lockup. SVG is allowed. |

Editors upload one complete logo lockup. They do not assemble a logo from symbol, font, name, tagline, spacing, or style controls.

A Client Logo has no route, description, category, link, or SEO fields.

---

# Reusable object specifications

## `editorialImage`

| Field            | Type         | Required    | Notes                                                           |
| ---------------- | ------------ | ----------- | --------------------------------------------------------------- |
| `asset`          | Sanity image | Yes         | Enable hotspot and crop.                                        |
| `decorative`     | Boolean      | Yes         | Default `false`.                                                |
| `alt`            | String       | Conditional | Required when not decorative; empty when decorative.            |
| `caption`        | Text         | No          | Only rendered where the fixed design supports it.               |
| `mobileOverride` | Sanity image | No          | Use only for genuinely different mobile artwork or composition. |

Rules:

- use one source image with responsive crops by default
- do not require separate mobile assets everywhere
- reject filenames used as alt text
- captions do not replace alt text
- Work Project, Journal Article, portrait, Service, and Client Logo imagery is normally non-decorative

## `seoFields`

| Field             | Type         | Required |
| ----------------- | ------------ | -------- |
| `metaTitle`       | String       | No       |
| `metaDescription` | Text         | No       |
| `socialImage`     | Sanity image | No       |

SEO values are optional overrides. Length guidance uses warnings, not hard limits.

Fallback order:

1. document SEO override
2. visible document title, description, and primary image
3. Site Settings defaults

Astro generates canonical URLs, Open Graph URLs, site name, title templates, robots directives, and structured data.

## `socialLink`

| Field      | Type   | Required |
| ---------- | ------ | -------- |
| `platform` | String | Yes      |
| `url`      | URL    | Yes      |

Require `https://`. Astro maps known platform names to icons.

## `processStep`

| Field         | Type   | Required |
| ------------- | ------ | -------- |
| `title`       | String | Yes      |
| `description` | Text   | Yes      |

The visible number comes from array order.

## `teamProfile`

| Field       | Type             | Required |
| ----------- | ---------------- | -------- |
| `name`      | String           | Yes      |
| `role`      | String           | Yes      |
| `biography` | Text             | Yes      |
| `portrait`  | `editorialImage` | Yes      |

Team profiles remain embedded because the website has no team-member routes.

## `narrativeSection`

| Field     | Type                      | Required |
| --------- | ------------------------- | -------- |
| `heading` | Text                      | Yes      |
| `content` | Constrained Portable Text | Yes      |

Allow paragraphs, emphasis, and approved links. Keep the structural section label in Astro.

## Work Project gallery blocks

### `workProjectGalleryImage`

| Field   | Type             | Required |
| ------- | ---------------- | -------- |
| `image` | `editorialImage` | Yes      |

### `workProjectGalleryBrandPanel`

| Field       | Type             | Required |
| ----------- | ---------------- | -------- |
| `title`     | Text             | Yes      |
| `statement` | Text             | Yes      |
| `label`     | String           | Yes      |
| `image`     | `editorialImage` | Yes      |

Astro owns the panel styling, desktop composition, and mobile stacking order.

---

# Relationships and ordering

```text
siteSettings
  └── global labels, contact details, newsletter, footer, and SEO defaults

homePage
  ├── clientLogo[5]
  ├── workProject[2]
  ├── service[4]
  └── journalArticle[3]

workPage
  └── workProject[] (canonical Work Project order)

servicesPage
  └── service[4]

aboutPage
  └── clientLogo[5]

journalPage
  └── journalArticle (featured)

workProject
  └── service[]

journalArticle
  ├── author
  ├── journalCategory
  └── journalArticle[2] (related)
```

Ordering ownership:

- Work page order: `workPage.workProjects`
- Home featured Work Projects: `homePage.featuredWorkProjects`
- Services page order: `servicesPage.services`
- Home Services order: `homePage.featuredServices`
- Home Journal Article order: `homePage.featuredJournalArticles`
- Journal archive order: `publicationDate` descending
- related Journal Article order: `journalArticle.relatedJournalArticles`
- Work Project gallery order: `workProject.gallery`
- Home and About Client Logo order: each page’s reference array

Do not add numeric order fields.

---

# Validation strategy

## Errors that block publishing

Use hard validation when invalid content would break a page, URL, relationship, accessibility requirement, or fixed layout.

Required hard validation includes:

- all required public headings and titles
- unique Work Project and Journal Article slugs
- read-only slugs after first publication
- all required images and references
- alt text for non-decorative images
- empty alt text for decorative images
- valid email address
- valid `https://` social URLs
- no duplicate references where duplication has no meaning
- exact fixed-item counts
- exactly two related Journal Articles
- no related-Journal-Article self-reference
- no empty Work Project galleries
- valid approved body and gallery block types

## Warnings

Use warnings for editorial guidance and layout-sensitive copy:

- SEO title or description is unusually short or long
- heading, standfirst, summary, or statement may exceed the design
- caption is unusually long
- Work Project or Journal Article copy is unusually sparse

Warnings do not block publishing.

## Exact item counts

| Field                                   | Required count |
| --------------------------------------- | -------------: |
| `homePage.featuredWorkProjects`         |              2 |
| `homePage.featuredServices`             |              4 |
| `homePage.featuredJournalArticles`      |              3 |
| `homePage.clientLogos`                  |              5 |
| `servicesPage.services`                 |              4 |
| `homePage.processSteps`                 |              4 |
| `servicesPage.processSteps`             |              4 |
| `aboutPage.teamMembers`                 |              3 |
| `aboutPage.principles`                  |              3 |
| `aboutPage.clientLogos`                 |              5 |
| `journalArticle.relatedJournalArticles` |              2 |

Work Project lists, Journal Article lists, and Work Project galleries can grow.

---

# Assets

Sanity manages content assets:

- Work Project card images, hero artwork, hero photographs, and galleries
- Journal Article hero images
- page imagery and artwork
- Service images
- team and founder portraits
- Client Logo lockups
- social-sharing images

Astro manages fixed interface and brand assets:

- Stillroom wordmark presentation
- menu icons
- decorative step-number artwork
- fixed background patterns
- other non-editorial interface graphics

The frontend controls rendered dimensions, aspect ratios, responsive source sets, image formats, compression, layout, and mobile stacking.

---

# Editorial workflow

Use Sanity’s built-in workflow:

1. Draft
2. Preview in Presentation
3. Publish

Do not add custom approval states, scheduled publishing, assignments, localization, or editorial calendars at launch.

Presentation must provide document locations for:

- singleton pages
- Work Project routes and placements
- Journal Article routes and placements
- Service placements
- Client Logo placements

List previews should show a useful title, subtitle, and image where available.

---

# Studio organization

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
│   └── Work Projects
├── Journal
│   ├── Journal Articles
│   ├── Authors
│   └── Journal Categories
└── Reusable Content
    ├── Services
    └── Client Logos
```

Hide singleton types from generic document lists and create menus.

---

# Explicit exclusions

The initial model does not include:

- a generic page builder
- editor-controlled section order
- testimonials
- individual Service, Author, Client Logo, sector, or Journal Category pages
- search and filtering configuration
- CMS-controlled form structure
- video, audio, embeds, or downloadable files
- Journal Article body images
- localization
- scheduled publishing
- custom approval workflows
- redirect management in Sanity
- editable published slugs
- CMS-managed 404 content
- CMS-managed colors, typography, spacing, animation, icons, or variants
- featured booleans
- numeric ordering fields
- automated reading time
- SEO keywords, canonical URL inputs, or `noindex` controls
