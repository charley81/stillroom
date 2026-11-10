import { createHash } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import {
  ABOUT_PAGE_DRAFT_ID,
  CLIENT_LOGO_IDS,
  buildAboutDocuments,
  migrateAbout,
} from './migrate-about'

const assetPaths = {
  hero: '/assets/about-hero.webp',
  founder: '/assets/founder.webp',
  team: ['/assets/alex.png', '/assets/maya.png', '/assets/sam.png'] as [
    string,
    string,
    string,
  ],
  clientLogos: [
    '/assets/orlo.svg',
    '/assets/juniper.svg',
    '/assets/fieldwork.svg',
    '/assets/the-long-table.svg',
    '/assets/morrow.svg',
  ] as [string, string, string, string, string],
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
      const extension = options.contentType === 'image/svg+xml' ? 'svg' : 'webp'
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

describe('About and Client Logo migration', () => {
  it('builds stable drafts with complete reusable Client Logos and exact ordered content', () => {
    const documents = buildAboutDocuments({
      hero: 'image-hero',
      founder: 'image-founder',
      team: ['image-alex', 'image-maya', 'image-sam'],
      clientLogos: [
        'image-orlo',
        'image-juniper',
        'image-fieldwork',
        'image-table',
        'image-morrow',
      ],
    })

    expect(CLIENT_LOGO_IDS.every((id) => !id.includes('.'))).toBe(true)
    expect(documents.clientLogos.map((document) => document._id)).toEqual(
      CLIENT_LOGO_IDS.map((id) => `drafts.${id}`),
    )
    expect(documents.clientLogos[0]).toEqual(
      expect.objectContaining({
        clientName: 'Orlo House',
        logo: expect.objectContaining({
          asset: expect.objectContaining({ _ref: 'image-orlo' }),
        }),
      }),
    )
    expect(documents.clientLogos[0]).not.toHaveProperty('symbol')
    expect(documents.clientLogos[0]).not.toHaveProperty('tagline')
    expect(documents.aboutPage._id).toBe(ABOUT_PAGE_DRAFT_ID)
    expect(documents.aboutPage.teamMembers).toHaveLength(3)
    expect(documents.aboutPage.principles).toHaveLength(3)
    expect(documents.aboutPage.clientLogos.map((item) => item._ref)).toEqual(
      CLIENT_LOGO_IDS,
    )
    expect(documents.aboutPage.clientLogos.every((item) => item._weak)).toBe(
      true,
    )
  })

  it('reuses uploaded image and SVG assets and replaces the same drafts on rerun', async () => {
    const { client, upload, documents } = createMigrationClient()
    const readAsset = async (path: string) => Buffer.from(`asset:${path}`)

    await migrateAbout({ client, assetPaths, readAsset })
    const firstDocuments = [...documents.values()]
    await migrateAbout({ client, assetPaths, readAsset })
    const secondDocuments = [...documents.values()]

    expect(upload).toHaveBeenCalledTimes(10)
    expect(firstDocuments).toEqual(secondDocuments)
    expect(documents.size).toBe(6)
    expect(documents.has(ABOUT_PAGE_DRAFT_ID)).toBe(true)
    expect(
      upload.mock.calls
        .filter(([, , options]) => options.contentType === 'image/svg+xml')
        .map(([, , options]) => options.filename),
    ).toEqual([
      'orlo.svg',
      'juniper.svg',
      'fieldwork.svg',
      'the-long-table.svg',
      'morrow.svg',
    ])
  })

  it('publishes Client Logo dependencies before About with strong references', async () => {
    const { client, transaction } = createMigrationClient()

    await migrateAbout({
      client,
      assetPaths,
      readAsset: async (path) => Buffer.from(`asset:${path}`),
      publish: true,
    })

    expect(
      transaction.createOrReplace.mock.calls.map(([document]) => document._id),
    ).toEqual([...CLIENT_LOGO_IDS, 'aboutPage'])
    const publishedAbout = transaction.createOrReplace.mock.calls.find(
      ([document]) => document._id === 'aboutPage',
    )?.[0]
    expect(
      publishedAbout.clientLogos.some(
        (item: { _weak?: boolean }) => item._weak,
      ),
    ).toBe(false)
    expect(transaction.delete.mock.calls.map(([id]) => id)).toEqual([
      ...CLIENT_LOGO_IDS.map((id) => `drafts.${id}`),
      ABOUT_PAGE_DRAFT_ID,
    ])
  })
})
