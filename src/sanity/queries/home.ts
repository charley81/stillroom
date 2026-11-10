import { defineQuery } from 'groq'
import {
  EDITORIAL_IMAGE_PROJECTION,
  JOURNAL_ARTICLE_CARD_PROJECTION,
  SEO_PROJECTION,
  WORK_PROJECT_CARD_PROJECTION,
} from './projections'

export const HOME_PAGE_QUERY = defineQuery(`
  *[_type == "homePage" && _id == "homePage"][0]{
    _id,
    heroHeading,
    heroImage{
      ${EDITORIAL_IMAGE_PROJECTION}
    },
    heroPrimaryCtaLabel,
    heroSecondaryCtaLabel,
    clientLogos[]->{
      _id,
      clientName,
      "url": logo.asset->url,
      "mimeType": logo.asset->mimeType
    },
    featuredWorkHeading,
    featuredWorkProjects[]->{
      ${WORK_PROJECT_CARD_PROJECTION}
    },
    featuredWorkCtaLabel,
    featuredServices[]->{
      _id,
      title,
      shortSummary
    },
    sectorLabels,
    studioHeading,
    studioIntroduction,
    studioImage{
      ${EDITORIAL_IMAGE_PROJECTION}
    },
    studioCtaLabel,
    pointOfViewHeading,
    pointOfViewCopy,
    processHeading,
    processSteps[]{
      _key,
      _type,
      title,
      description
    },
    processCtaLabel,
    journalHeading,
    featuredJournalArticles[]->{
      ${JOURNAL_ARTICLE_CARD_PROJECTION}
    },
    journalCtaLabel,
    finalCtaEyebrow,
    finalCtaHeading,
    finalCtaLabel,
    seo{
      ${SEO_PROJECTION}
    }
  }
`)
