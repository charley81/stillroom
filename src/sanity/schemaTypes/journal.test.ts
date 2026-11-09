import { describe, expect, it } from 'vitest'
import { author } from './documents/author'
import { journalArticle } from './documents/journal-article'
import { journalCategory } from './documents/journal-category'
import { journalPage } from './documents/journal-page'
import { publishedDocumentExists } from './locked-slug-input'
import { journalArticlePullQuote } from './objects/journal-article-pull-quote'
import { journalArticleSection } from './objects/journal-article-section'
import { relatedJournalArticles } from './validation'

function fieldNames(type: { fields?: Array<{ name: string }> }) {
  return type.fields?.map((field) => field.name) ?? []
}

describe('Journal schemas', () => {
  it('matches the approved Journal page and reusable document models', () => {
    expect(fieldNames(journalPage)).toEqual([
      'heading',
      'introduction',
      'introductionArtwork',
      'featuredJournalArticle',
      'seo',
    ])
    expect(fieldNames(author)).toEqual(['name', 'biography'])
    expect(fieldNames(journalCategory)).toEqual(['title', 'slug'])
  })

  it('matches the approved Journal Article model without unsupported body controls', () => {
    expect(fieldNames(journalArticle)).toEqual([
      'title',
      'slug',
      'category',
      'author',
      'publicationDate',
      'standfirst',
      'readingTime',
      'heroImage',
      'body',
      'relatedJournalArticles',
      'seo',
    ])
    expect(fieldNames(journalArticleSection)).toEqual(['label', 'content'])
    expect(fieldNames(journalArticlePullQuote)).toEqual(['label', 'quote'])
    const sectionContent = journalArticleSection.fields.find(
      (field) => field.name === 'content',
    )
    expect(sectionContent?.of?.[0].styles).toEqual([
      { title: 'Normal', value: 'normal' },
      { title: 'Subheading', value: 'h2' },
    ])
    expect(sectionContent?.of?.[0].lists).toEqual([])

    const body = journalArticle.fields.find((field) => field.name === 'body')
    expect(body?.of?.map((member) => member.type)).toEqual([
      'journalArticleSection',
      'journalArticlePullQuote',
    ])
  })

  it('rejects duplicate and self-referencing related Journal Articles', () => {
    expect(
      relatedJournalArticles(
        [{ _ref: 'journal-article-one' }, { _ref: 'journal-article-one' }],
        'journal-article-current',
      ),
    ).toBe('Related Journal Articles must be unique.')
    expect(
      relatedJournalArticles(
        [
          { _ref: 'journal-article-current' },
          { _ref: 'journal-article-other' },
        ],
        'drafts.journal-article-current',
      ),
    ).toBe('A Journal Article cannot relate to itself.')
    expect(
      relatedJournalArticles(
        [{ _ref: 'journal-article-one' }, { _ref: 'journal-article-two' }],
        'journal-article-current',
      ),
    ).toBe(true)
  })

  it('locks the slug input when the published Journal Article exists', async () => {
    const slugField = journalArticle.fields.find(
      (field) => field.name === 'slug',
    )
    expect(slugField?.components?.input).toBeTypeOf('function')

    const fetch = async (_query: string, params: Record<string, string>) => {
      expect(params).toEqual({
        publishedId: 'journal-article-what-makes-a-place-stay-with-us',
      })
      return true
    }
    await expect(
      publishedDocumentExists(
        { fetch },
        'drafts.journal-article-what-makes-a-place-stay-with-us',
      ),
    ).resolves.toBe(true)
  })
})
