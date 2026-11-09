import { defineQuery } from 'groq'
import {
  EDITORIAL_IMAGE_PROJECTION,
  SEO_PROJECTION,
  WORK_PROJECT_CARD_PROJECTION,
} from './projections'

const WORK_PAGE_PROJECTION = `
  _id,
  heading,
  heroArtwork{
    ${EDITORIAL_IMAGE_PROJECTION}
  },
  workProjects[]->{
    ${WORK_PROJECT_CARD_PROJECTION}
  },
  finalCtaEyebrow,
  finalCtaHeading,
  finalCtaLabel,
  seo{
    ${SEO_PROJECTION}
  }
`

export const WORK_PAGE_QUERY = defineQuery(`
  *[_type == "workPage" && _id == "workPage"][0]{
    ${WORK_PAGE_PROJECTION}
  }
`)

export const WORK_PROJECT_QUERY = defineQuery(`
  {
    "page": *[_type == "workPage" && _id == "workPage"][0]{
      ${WORK_PAGE_PROJECTION}
    },
    "project": *[_type == "workProject" && slug.current == $slug][0]{
      ${WORK_PROJECT_CARD_PROJECTION},
      introduction,
      heroArtwork{
        ${EDITORIAL_IMAGE_PROJECTION}
      },
      heroPhotograph{
        ${EDITORIAL_IMAGE_PROJECTION}
      },
      challenge{
        heading,
        content
      },
      contribution{
        heading,
        content
      },
      galleryHeading,
      gallery[]{
        _key,
        _type,
        _type == "workProjectGalleryImage" => {
          image{
            ${EDITORIAL_IMAGE_PROJECTION}
          }
        },
        _type == "workProjectGalleryBrandPanel" => {
          title,
          statement,
          label,
          image{
            ${EDITORIAL_IMAGE_PROJECTION}
          }
        }
      },
      outcomeHeading,
      outcomeCopy,
      seo{
        ${SEO_PROJECTION}
      }
    }
  }
`)
