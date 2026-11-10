export const EDITORIAL_IMAGE_PROJECTION = `
  decorative,
  alt,
  caption,
  "url": asset.asset->url,
  "crop": asset.crop,
  "hotspot": asset.hotspot,
  "mobileUrl": mobileOverride.asset->url,
  "mobileCrop": mobileOverride.crop,
  "mobileHotspot": mobileOverride.hotspot
`

export const SEO_PROJECTION = `
  metaTitle,
  metaDescription,
  "socialImageUrl": socialImage.asset->url
`

export const SERVICE_REFERENCE_PROJECTION = `
  _id,
  title
`

export const JOURNAL_CATEGORY_PROJECTION = `
  _id,
  title,
  "slug": slug.current
`

export const AUTHOR_PROJECTION = `
  _id,
  name,
  biography
`

export const JOURNAL_ARTICLE_CARD_PROJECTION = `
  _id,
  title,
  "slug": slug.current,
  category->{
    ${JOURNAL_CATEGORY_PROJECTION}
  },
  publicationDate,
  standfirst,
  readingTime,
  heroImage{
    ${EDITORIAL_IMAGE_PROJECTION}
  }
`

export const WORK_PROJECT_CARD_PROJECTION = `
  _id,
  title,
  "slug": slug.current,
  sectorLabel,
  cardSummary,
  cardImage{
    ${EDITORIAL_IMAGE_PROJECTION}
  },
  services[]->{
    ${SERVICE_REFERENCE_PROJECTION}
  },
  positioningStatement
`
