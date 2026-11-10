import type {
  JOURNAL_ARTICLE_QUERY_RESULT,
  JOURNAL_PAGE_QUERY_RESULT,
} from '../../../sanity.types'
import { JOURNAL_ARTICLE_QUERY, JOURNAL_PAGE_QUERY } from '../queries/journal'
import type { ContentQueryClient } from './client'
import { MissingContentError } from './errors'
import {
  cleanDocumentId,
  requireContentImage,
  requireString,
  type ContentImage,
} from './validation'

type GeneratedJournalPageResult = JOURNAL_PAGE_QUERY_RESULT
type GeneratedJournalPage = NonNullable<GeneratedJournalPageResult['page']>
type GeneratedJournalArticleCard =
  GeneratedJournalPage['featuredJournalArticle']
type GeneratedJournalArticleResult = JOURNAL_ARTICLE_QUERY_RESULT
type GeneratedJournalArticle = NonNullable<
  GeneratedJournalArticleResult['article']
>

export type JournalArticleCard = Omit<
  GeneratedJournalArticleCard,
  'heroImage'
> & {
  heroImage: ContentImage
}

export type JournalPage = Omit<
  GeneratedJournalPage,
  'introductionArtwork' | 'featuredJournalArticle'
> & {
  introductionArtwork: ContentImage
  featuredJournalArticle: JournalArticleCard
  articles: JournalArticleCard[]
}

export type JournalArticle = Omit<
  GeneratedJournalArticle,
  'heroImage' | 'relatedJournalArticles'
> & {
  heroImage: ContentImage
  relatedJournalArticles: JournalArticleCard[]
}

export interface JournalArticlePage {
  article: JournalArticle
}

export class JournalArticleNotFoundError extends MissingContentError {
  constructor(slug: string) {
    super(`Journal Article not found for slug: ${slug}`)
    this.name = 'JournalArticleNotFoundError'
  }
}

export function requireJournalArticleCard(value: unknown, scope: string) {
  if (!value || typeof value !== 'object') {
    throw new MissingContentError(`${scope} is missing.`)
  }
  const card = value as Record<string, unknown>
  ;[
    '_id',
    'title',
    'slug',
    'publicationDate',
    'standfirst',
    'readingTime',
  ].forEach((field) => requireString(card, field, scope))
  requireContentImage(card.heroImage, `${scope}.heroImage`)
  if (!card.category || typeof card.category !== 'object') {
    throw new MissingContentError(`${scope}.category is missing.`)
  }
  const category = card.category as Record<string, unknown>
  ;['_id', 'title'].forEach((field) =>
    requireString(category, field, `${scope}.category`),
  )
}

export function requireJournalPage(value: unknown): JournalPage {
  if (!value || typeof value !== 'object') {
    throw new MissingContentError(
      'Required Journal document "journalPage" was not found in Sanity content.',
    )
  }
  const result = value as Record<string, unknown>
  if (!result.page || typeof result.page !== 'object') {
    throw new MissingContentError(
      'Required Journal document "journalPage" was not found in Sanity content.',
    )
  }
  const page = result.page as Record<string, unknown>
  ;['heading', 'introduction'].forEach((field) =>
    requireString(page, field, 'Journal'),
  )
  requireContentImage(page.introductionArtwork, 'Journal.introductionArtwork')
  requireJournalArticleCard(
    page.featuredJournalArticle,
    'Journal.featuredJournalArticle',
  )

  if (!Array.isArray(result.articles)) {
    throw new MissingContentError('Journal requires an article archive.')
  }
  result.articles.forEach((article, index) =>
    requireJournalArticleCard(article, `Journal.articles[${index}]`),
  )
  const featuredId = cleanDocumentId(
    String((page.featuredJournalArticle as Record<string, unknown>)._id),
  )
  const articleIds = result.articles.map((article) =>
    cleanDocumentId(String((article as Record<string, unknown>)._id)),
  )
  if (articleIds.includes(featuredId)) {
    throw new MissingContentError(
      'Journal articles must exclude the featured Journal Article.',
    )
  }
  const dates = result.articles.map(
    (article) => (article as Record<string, unknown>).publicationDate as string,
  )
  if (dates.some((date, index) => index > 0 && dates[index - 1] < date)) {
    throw new MissingContentError(
      'Journal articles must be ordered by publication date descending.',
    )
  }

  return { ...page, articles: result.articles } as unknown as JournalPage
}

function requireJournalPortableText(value: unknown, field: string) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new MissingContentError(`${field} requires Portable Text content.`)
  }
  value.forEach((block, index) => {
    if (!block || typeof block !== 'object') {
      throw new MissingContentError(`${field}[${index}] is invalid.`)
    }
    const portableBlock = block as Record<string, unknown>
    if (
      portableBlock._type !== 'block' ||
      (portableBlock.style !== undefined &&
        portableBlock.style !== 'normal' &&
        portableBlock.style !== 'h2')
    ) {
      throw new MissingContentError(
        `${field} contains an unsupported Portable Text block.`,
      )
    }
  })
}

export function requireJournalArticleResult(
  value: unknown,
  requestedSlug = 'unknown',
): JournalArticlePage {
  if (!value || typeof value !== 'object') {
    throw new JournalArticleNotFoundError(requestedSlug)
  }
  const result = value as Record<string, unknown>
  if (!result.article || typeof result.article !== 'object') {
    throw new JournalArticleNotFoundError(requestedSlug)
  }
  const article = result.article as Record<string, unknown>
  requireJournalArticleCard(article, 'Journal Article')
  if (!article.author || typeof article.author !== 'object') {
    throw new MissingContentError('Journal Article.author is missing.')
  }
  const author = article.author as Record<string, unknown>
  ;['_id', 'name', 'biography'].forEach((field) =>
    requireString(author, field, 'Journal Article.author'),
  )

  if (!Array.isArray(article.body) || article.body.length === 0) {
    throw new MissingContentError('Journal Article requires body content.')
  }
  let sectionCount = 0
  article.body.forEach((block, index) => {
    if (!block || typeof block !== 'object') {
      throw new MissingContentError(
        `Journal Article body block ${index + 1} is missing.`,
      )
    }
    const bodyBlock = block as Record<string, unknown>
    if (bodyBlock._type === 'journalArticleSection') {
      sectionCount += 1
      requireString(bodyBlock, 'label', `Journal Article.body[${index}]`)
      requireJournalPortableText(
        bodyBlock.content,
        `Journal Article.body[${index}].content`,
      )
      return
    }
    if (bodyBlock._type === 'journalArticlePullQuote') {
      requireString(bodyBlock, 'quote', `Journal Article.body[${index}]`)
      return
    }
    throw new MissingContentError(
      `Journal Article contains unsupported body block: ${String(bodyBlock._type)}`,
    )
  })
  if (sectionCount === 0) {
    throw new MissingContentError(
      'Journal Article requires at least one article section.',
    )
  }

  if (
    !Array.isArray(article.relatedJournalArticles) ||
    article.relatedJournalArticles.length !== 2
  ) {
    throw new MissingContentError(
      'Journal Article requires exactly two related Journal Articles.',
    )
  }
  article.relatedJournalArticles.forEach((related, index) =>
    requireJournalArticleCard(
      related,
      `Journal Article.relatedJournalArticles[${index}]`,
    ),
  )
  const relatedIds = article.relatedJournalArticles.map((related) =>
    cleanDocumentId(String((related as Record<string, unknown>)._id)),
  )
  if (new Set(relatedIds).size !== relatedIds.length) {
    throw new MissingContentError(
      'Journal Article requires two unique related Journal Articles.',
    )
  }
  if (relatedIds.includes(cleanDocumentId(String(article._id)))) {
    throw new MissingContentError('A Journal Article cannot relate to itself.')
  }

  return { article: article as unknown as JournalArticle }
}

export async function loadJournalPage(
  content: ContentQueryClient,
): Promise<JournalPage> {
  const { data } = await content.loadQuery(JOURNAL_PAGE_QUERY)
  return requireJournalPage(data)
}

export async function loadJournalArticlePage(
  content: ContentQueryClient,
  slug: string,
): Promise<JournalArticlePage> {
  const { data } = await content.loadQuery(JOURNAL_ARTICLE_QUERY, { slug })
  return requireJournalArticleResult(data, slug)
}
