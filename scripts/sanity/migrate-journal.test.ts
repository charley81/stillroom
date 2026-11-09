import { createHash } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import {
  AUTHOR_IDS,
  JOURNAL_ARTICLE_IDS,
  JOURNAL_ARTICLE_SLUGS,
  JOURNAL_CATEGORY_IDS,
  JOURNAL_PAGE_DRAFT_ID,
  buildJournalDocuments,
  migrateJournal,
} from './migrate-journal'

function createMigrationClient() {
  const assetsByHash = new Map<string, string>()
  const upload = vi.fn(async (_type: 'image', body: Buffer) => {
    const hash = createHash('sha1').update(body).digest('hex')
    const id = `image-${hash}-1200x800-webp`
    assetsByHash.set(hash, id)
    return { _id: id }
  })
  const documents = new Map<string, { _id: string; _type: string }>()
  const createOrReplace = vi.fn(async (document) => {
    documents.set(document._id, document)
    return document
  })
  const transaction = {
    createOrReplace: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    commit: vi.fn().mockResolvedValue(undefined),
  }

  return {
    client: {
      fetch: vi.fn(
        async (_query: string, params: { sha1: string }) =>
          assetsByHash.get(params.sha1) ?? null,
      ),
      assets: { upload },
      createOrReplace,
      transaction: vi.fn(() => transaction),
    },
    upload,
    documents,
    transaction,
  }
}

const assetIds = new Proxy<Record<string, string>>(
  {},
  { get: (_target, path) => `image-${String(path).replace(/\W+/g, '-')}` },
)

describe('Journal migration', () => {
  it('builds stable drafts with preserved slugs, references, and approved body blocks', () => {
    const { authors, categories, articles, journalPage } =
      buildJournalDocuments(assetIds)

    expect(JOURNAL_ARTICLE_SLUGS).toEqual([
      'what-makes-a-place-stay-with-us',
      'the-quiet-power-of-a-good-menu',
      'the-everyday-ritual-reconsidered',
      'a-welcome-begins-before-the-door',
      'good-brands-have-good-ingredients',
      'a-little-more-personality-please',
      'made-for-good-company',
    ])
    expect(authors.map(({ _id }) => _id)).toEqual(
      AUTHOR_IDS.map((id) => `drafts.${id}`),
    )
    expect(categories.map(({ _id }) => _id)).toEqual(
      JOURNAL_CATEGORY_IDS.map((id) => `drafts.${id}`),
    )
    expect(articles.map(({ _id }) => _id)).toEqual(
      JOURNAL_ARTICLE_IDS.map((id) => `drafts.${id}`),
    )
    expect(articles.map(({ slug }) => slug.current)).toEqual(
      JOURNAL_ARTICLE_SLUGS,
    )
    expect(
      articles
        .flatMap(({ body }) => body)
        .every(({ _type }) =>
          ['journalArticleSection', 'journalArticlePullQuote'].includes(_type),
        ),
    ).toBe(true)
    expect(
      articles.every(
        ({ relatedJournalArticles }) =>
          relatedJournalArticles.length === 2 &&
          new Set(relatedJournalArticles.map(({ _ref }) => _ref)).size === 2,
      ),
    ).toBe(true)
    expect(journalPage._id).toBe(JOURNAL_PAGE_DRAFT_ID)
    expect(journalPage.featuredJournalArticle._ref).toBe(JOURNAL_ARTICLE_IDS[0])
  })

  it('reuses uploaded assets and replaces the same drafts on rerun', async () => {
    const { client, upload, documents } = createMigrationClient()
    const readAsset = async (path: string) => Buffer.from(`asset:${path}`)

    await migrateJournal({ client, readAsset })
    const firstDocuments = [...documents.values()]
    const firstUploadCount = upload.mock.calls.length
    await migrateJournal({ client, readAsset })

    expect(upload).toHaveBeenCalledTimes(firstUploadCount)
    expect([...documents.values()]).toEqual(firstDocuments)
    expect(documents.size).toBe(14)
    expect(documents.has(JOURNAL_PAGE_DRAFT_ID)).toBe(true)
  })

  it('publishes dependencies before articles and the Journal page', async () => {
    const { client, transaction } = createMigrationClient()

    await migrateJournal({
      client,
      readAsset: async (path) => Buffer.from(`asset:${path}`),
      publish: true,
    })

    const published = transaction.createOrReplace.mock.calls.map(
      ([document]) => document,
    )
    expect(published.map(({ _id }) => _id)).toEqual([
      ...AUTHOR_IDS,
      ...JOURNAL_CATEGORY_IDS,
      ...JOURNAL_ARTICLE_IDS,
      'journalPage',
    ])
    expect(
      published.flatMap(
        (document) => JSON.stringify(document).match(/_weak/g) ?? [],
      ),
    ).toHaveLength(0)
    expect(transaction.commit).toHaveBeenCalledOnce()
  })
})
