import { defineQuery } from 'groq'
import {
  AUTHOR_PROJECTION,
  EDITORIAL_IMAGE_PROJECTION,
  JOURNAL_ARTICLE_CARD_PROJECTION,
  SEO_PROJECTION,
} from './projections'

export const JOURNAL_PAGE_QUERY = defineQuery(`
  {
    "page": *[_type == "journalPage" && _id == "journalPage"][0]{
      _id,
      heading,
      introduction,
      introductionArtwork{
        ${EDITORIAL_IMAGE_PROJECTION}
      },
      featuredJournalArticle->{
        ${JOURNAL_ARTICLE_CARD_PROJECTION}
      },
      seo{
        ${SEO_PROJECTION}
      }
    },
    "articles": *[
      _type == "journalArticle" &&
      !(_id in [
        *[_type == "journalPage" && _id == "journalPage"][0].featuredJournalArticle._ref,
        "drafts." + *[_type == "journalPage" && _id == "journalPage"][0].featuredJournalArticle._ref
      ])
    ] | order(publicationDate desc){
      ${JOURNAL_ARTICLE_CARD_PROJECTION}
    }
  }
`)

export const JOURNAL_ARTICLE_QUERY = defineQuery(`
  {
    "article": *[_type == "journalArticle" && slug.current == $slug][0]{
      ${JOURNAL_ARTICLE_CARD_PROJECTION},
      author->{
        ${AUTHOR_PROJECTION}
      },
      body[]{
        _key,
        _type,
        _type == "journalArticleSection" => {
          label,
          content
        },
        _type == "journalArticlePullQuote" => {
          label,
          quote
        }
      },
      relatedJournalArticles[]->{
        ${JOURNAL_ARTICLE_CARD_PROJECTION}
      },
      seo{
        ${SEO_PROJECTION}
      }
    }
  }
`)
