export const EDITORIAL_IMAGE_PROJECTION = `
  decorative,
  alt,
  caption,
  "url": asset.asset->url,
  "mobileUrl": mobileOverride.asset->url
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
