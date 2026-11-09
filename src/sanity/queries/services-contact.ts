import { defineQuery } from 'groq'

const EDITORIAL_IMAGE_PROJECTION = `
  decorative,
  alt,
  caption,
  "url": asset.asset->url,
  "mobileUrl": mobileOverride.asset->url
`

const SEO_PROJECTION = `
  metaTitle,
  metaDescription,
  "socialImageUrl": socialImage.asset->url
`

export const SERVICES_PAGE_QUERY = defineQuery(`
  *[_type == "servicesPage" && _id == "servicesPage"][0]{
    _id,
    heroHeading,
    heroIntroduction,
    heroImage{
      ${EDITORIAL_IMAGE_PROJECTION}
    },
    heroCtaLabel,
    services[]->{
      _id,
      title,
      shortSummary,
      description,
      image{
        ${EDITORIAL_IMAGE_PROJECTION}
      },
      deliverables
    },
    processHeading,
    processSteps[]{
      _key,
      title,
      description
    },
    hospitalityHeading,
    hospitalitySectorLabels,
    hospitalityPointOfView,
    hospitalityImage{
      ${EDITORIAL_IMAGE_PROJECTION}
    },
    hospitalityCtaLabel,
    finalStatementEyebrow,
    finalStatementHeading,
    seo{
      ${SEO_PROJECTION}
    }
  }
`)

export const CONTACT_PAGE_QUERY = defineQuery(`
  {
    "page": *[_type == "contactPage" && _id == "contactPage"][0]{
      _id,
      heading,
      introduction,
      supportingImage{
        ${EDITORIAL_IMAGE_PROJECTION}
      },
      supportingStatement,
      seo{
        ${SEO_PROJECTION}
      }
    },
    "services": *[_type == "servicesPage" && _id == "servicesPage"][0].services[]->{
      _id,
      title
    }
  }
`)
