import { defineQuery } from 'groq'
import { EDITORIAL_IMAGE_PROJECTION, SEO_PROJECTION } from './projections'

export const ABOUT_PAGE_QUERY = defineQuery(`
  *[_type == "aboutPage" && _id == "aboutPage"][0]{
    _id,
    heading,
    heroImage{
      ${EDITORIAL_IMAGE_PROJECTION}
    },
    founderHeading,
    founderStory,
    founderName,
    founderRole,
    founderImage{
      ${EDITORIAL_IMAGE_PROJECTION}
    },
    teamHeading,
    teamIntroduction,
    teamMembers[]{
      _key,
      _type,
      name,
      role,
      biography,
      portrait{
        ${EDITORIAL_IMAGE_PROJECTION}
      }
    },
    principles[]{
      _key,
      _type,
      title,
      description
    },
    principlesHeading,
    clientProofHeading,
    clientProofCopy,
    clientLogos[]->{
      _id,
      clientName,
      "url": logo.asset->url,
      "mimeType": logo.asset->mimeType
    },
    clientProofCtaLabel,
    finalCtaEyebrow,
    finalCtaHeading,
    finalCtaLabel,
    seo{
      ${SEO_PROJECTION}
    }
  }
`)
