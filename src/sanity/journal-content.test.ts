import { describe, expect, it } from 'vitest'
import { MissingContentError } from './content/errors'
import {
  JournalArticleNotFoundError,
  requireJournalArticleResult,
  requireJournalPage,
} from './content/journal'

const image = {
  decorative: false,
  alt: 'A warm restaurant dining room set for service',
  caption: null,
  url: 'https://cdn.sanity.io/journal.jpg',
  mobileUrl: null,
}

const text = (copy: string, style: 'normal' | 'h2' = 'normal') => [
  {
    _key: copy,
    _type: 'block',
    style,
    markDefs: [],
    children: [{ _key: `${copy}-span`, _type: 'span', marks: [], text: copy }],
  },
]

const cards = [
  {
    _id: 'journal-article-featured',
    title: 'Featured Journal Article',
    slug: 'featured',
    category: { _id: 'journal-category-culture', title: 'Culture' },
    publicationDate: '2026-10-21',
    standfirst: 'Featured standfirst.',
    readingTime: '5 min read',
    heroImage: image,
  },
  {
    _id: 'journal-article-newer',
    title: 'Newer Journal Article',
    slug: 'newer',
    category: { _id: 'journal-category-design', title: 'Design' },
    publicationDate: '2026-10-14',
    standfirst: 'Newer standfirst.',
    readingTime: '4 min read',
    heroImage: image,
  },
  {
    _id: 'journal-article-older',
    title: 'Older Journal Article',
    slug: 'older',
    category: { _id: 'journal-category-process', title: 'Process' },
    publicationDate: '2026-10-07',
    standfirst: 'Older standfirst.',
    readingTime: '6 min read',
    heroImage: image,
  },
]

const page = {
  _id: 'journalPage',
  heading: 'Food for thought.',
  introduction: 'Ideas and observations from Stillroom.',
  introductionArtwork: { ...image, decorative: true, alt: '' },
  featuredJournalArticle: cards[0],
  seo: null,
}

const journalResult = { page, articles: [cards[1], cards[2]] }

const article = {
  ...cards[0],
  author: {
    _id: 'author-stillroom',
    name: 'Stillroom',
    biography: 'An independent creative studio for hospitality and food.',
  },
  body: [
    {
      _key: 'section-one',
      _type: 'journalArticleSection',
      label: '01 / The feeling of a place',
      content: [
        ...text('Some places stay with you.'),
        ...text('More than what is on the plate.', 'h2'),
      ],
    },
    {
      _key: 'quote',
      _type: 'journalArticlePullQuote',
      label: 'A note to come back to',
      quote: 'The places we love make us feel we belong.',
    },
  ],
  relatedJournalArticles: [cards[1], cards[2]],
  seo: null,
}

describe('Journal content requirements', () => {
  it('preserves publication-date archive order and excludes the featured article', () => {
    const result = requireJournalPage(journalResult)

    expect(result.articles.map(({ slug }) => slug)).toEqual(['newer', 'older'])
    expect(result.articles.map(({ slug }) => slug)).not.toContain('featured')
    expect(() =>
      requireJournalPage({ page, articles: [cards[2], cards[1]] }),
    ).toThrow('publication date descending')
    expect(() =>
      requireJournalPage({ page, articles: [cards[0], cards[1]] }),
    ).toThrow('exclude the featured Journal Article')
  })

  it('accepts approved article sections and exactly two unique related articles', () => {
    const result = requireJournalArticleResult({ article }, 'featured')

    expect(result.article.author.name).toBe('Stillroom')
    expect(
      result.article.relatedJournalArticles.map(({ slug }) => slug),
    ).toEqual(['newer', 'older'])
  })

  it('rejects unsupported body blocks, duplicate relations, and self relations', () => {
    expect(() =>
      requireJournalArticleResult({
        article: { ...article, body: [{ _key: 'image', _type: 'image' }] },
      }),
    ).toThrow('unsupported body block')
    expect(() =>
      requireJournalArticleResult({
        article: {
          ...article,
          relatedJournalArticles: [cards[1], cards[1]],
        },
      }),
    ).toThrow('unique related Journal Articles')
    expect(() =>
      requireJournalArticleResult({
        article: {
          ...article,
          relatedJournalArticles: [cards[0], cards[1]],
        },
      }),
    ).toThrow('cannot relate to itself')
  })

  it('fails clearly for a missing Journal singleton or Journal Article', () => {
    expect(() => requireJournalPage(null)).toThrow(MissingContentError)
    expect(() =>
      requireJournalArticleResult({ article: null }, 'missing'),
    ).toThrow(JournalArticleNotFoundError)
  })
})
