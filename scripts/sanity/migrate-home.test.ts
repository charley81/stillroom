import { createHash } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import { CLIENT_LOGO_IDS } from './migrate-about'
import { JOURNAL_ARTICLE_IDS } from './migrate-journal'
import {
  HOME_PAGE_DRAFT_ID,
  buildHomeDocument,
  migrateHome,
} from './migrate-home'
import { SERVICE_IDS } from './migrate-services-contact'
import { WORK_PROJECT_IDS } from './migrate-work'

const assetPaths = {
  hero: '/assets/home-hero.png',
  studio: '/assets/home-studio.webp',
}

function createMigrationClient() {
  const assetsByHash = new Map<string, string>()
  const upload = vi.fn(
    async (
      _type: 'image',
      body: Buffer,
      options: { filename: string; contentType: string },
    ) => {
      const hash = createHash('sha1').update(body).digest('hex')
      const extension = options.contentType === 'image/png' ? 'png' : 'webp'
      const id = `image-${hash}-1200x800-${extension}`
      assetsByHash.set(hash, id)
      return { _id: id }
    },
  )
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

describe('Home migration', () => {
  it('builds the deterministic Home draft with approved content and reference counts', () => {
    const home = buildHomeDocument({
      hero: 'image-home-hero',
      studio: 'image-home-studio',
    })

    expect(home._id).toBe(HOME_PAGE_DRAFT_ID)
    expect(home.featuredWorkProjects.map((item) => item._ref)).toEqual(
      WORK_PROJECT_IDS.slice(0, 2),
    )
    expect(home.featuredServices.map((item) => item._ref)).toEqual(SERVICE_IDS)
    expect(home.featuredJournalArticles.map((item) => item._ref)).toEqual(
      JOURNAL_ARTICLE_IDS.slice(0, 3),
    )
    expect(home.clientLogos.map((item) => item._ref)).toEqual(CLIENT_LOGO_IDS)
    expect(home.processSteps).toHaveLength(4)
    expect(home.sectorLabels).toHaveLength(4)
    expect(home).not.toHaveProperty('heroIntroduction')
    expect(home).not.toHaveProperty('sectorSummaries')
    expect(home).not.toHaveProperty('sectionOrder')
    expect(home.heroImage).toEqual(
      expect.objectContaining({
        asset: expect.objectContaining({
          asset: expect.objectContaining({ _ref: 'image-home-hero' }),
        }),
      }),
    )
    expect(home.studioImage).toEqual(
      expect.objectContaining({
        asset: expect.objectContaining({
          asset: expect.objectContaining({ _ref: 'image-home-studio' }),
        }),
      }),
    )
  })

  it('reuses uploaded assets and replaces the same deterministic draft on rerun', async () => {
    const { client, upload, documents } = createMigrationClient()
    const readAsset = async (path: string) => Buffer.from(`asset:${path}`)

    await migrateHome({ client, assetPaths, readAsset })
    const firstDocument = documents.get(HOME_PAGE_DRAFT_ID)
    await migrateHome({ client, assetPaths, readAsset })

    expect(upload).toHaveBeenCalledTimes(2)
    expect(documents.size).toBe(1)
    expect(documents.get(HOME_PAGE_DRAFT_ID)).toEqual(firstDocument)
  })

  it('publishes the Home singleton with strong references and deletes its draft', async () => {
    const { client, transaction } = createMigrationClient()

    await migrateHome({
      client,
      assetPaths,
      readAsset: async (path) => Buffer.from(`asset:${path}`),
      publish: true,
    })

    const published = transaction.createOrReplace.mock.calls[0]?.[0]
    expect(published._id).toBe('homePage')
    expect(
      [
        ...published.clientLogos,
        ...published.featuredWorkProjects,
        ...published.featuredServices,
        ...published.featuredJournalArticles,
      ].some((reference: { _weak?: boolean }) => reference._weak),
    ).toBe(false)
    expect(transaction.delete).toHaveBeenCalledWith(HOME_PAGE_DRAFT_ID)
  })
})
