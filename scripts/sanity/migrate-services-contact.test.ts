import { createHash } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import {
  CONTACT_PAGE_DRAFT_ID,
  SERVICE_IDS,
  SERVICES_PAGE_DRAFT_ID,
  buildServicesContactDocuments,
  migrateServicesContact,
} from './migrate-services-contact'

const assetPaths = {
  hero: '/assets/hero.webp',
  hospitality: '/assets/hospitality.webp',
  contact: '/assets/contact.webp',
  services: [
    '/assets/brand.jpg',
    '/assets/identity.jpg',
    '/assets/digital.jpg',
    '/assets/campaign.jpg',
  ] as [string, string, string, string],
}

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
  const commit = vi.fn().mockResolvedValue(undefined)
  const transaction = {
    createOrReplace: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    commit,
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

describe('Services and Contact migration', () => {
  it('builds stable drafts with four ordered Service references and no unsupported fields', () => {
    const documents = buildServicesContactDocuments({
      hero: 'image-hero',
      hospitality: 'image-hospitality',
      contact: 'image-contact',
      services: [
        'image-brand',
        'image-identity',
        'image-digital',
        'image-campaign',
      ],
    })

    expect(SERVICE_IDS.every((id) => !id.includes('.'))).toBe(true)
    expect(documents.services.map((document) => document._id)).toEqual(
      SERVICE_IDS.map((id) => `drafts.${id}`),
    )
    expect(documents.servicesPage._id).toBe(SERVICES_PAGE_DRAFT_ID)
    expect(documents.servicesPage.services.map((item) => item._ref)).toEqual(
      SERVICE_IDS,
    )
    expect(documents.servicesPage.services.every((item) => item._weak)).toBe(
      true,
    )
    expect(documents.servicesPage.processSteps).toHaveLength(4)
    expect(documents.servicesPage).not.toHaveProperty('finalStatementCtaLabel')
    expect(documents.contactPage._id).toBe(CONTACT_PAGE_DRAFT_ID)
    expect(documents.contactPage).not.toHaveProperty('form')
  })

  it('reuses uploaded assets and replaces the same drafts on rerun', async () => {
    const { client, upload, documents } = createMigrationClient()
    const readAsset = async (path: string) => Buffer.from(`asset:${path}`)

    await migrateServicesContact({ client, assetPaths, readAsset })
    const firstDocuments = [...documents.values()]
    await migrateServicesContact({ client, assetPaths, readAsset })
    const secondDocuments = [...documents.values()]

    expect(upload).toHaveBeenCalledTimes(7)
    expect(firstDocuments).toEqual(secondDocuments)
    expect(documents.size).toBe(6)
    expect(documents.has(SERVICES_PAGE_DRAFT_ID)).toBe(true)
    expect(documents.has(CONTACT_PAGE_DRAFT_ID)).toBe(true)
  })

  it('publishes dependencies before singleton pages using stable identities', async () => {
    const { client, transaction } = createMigrationClient()

    await migrateServicesContact({
      client,
      assetPaths,
      readAsset: async (path) => Buffer.from(`asset:${path}`),
      publish: true,
    })

    const publishedIds = transaction.createOrReplace.mock.calls.map(
      ([document]) => document._id,
    )
    expect(publishedIds).toEqual([
      ...SERVICE_IDS,
      'servicesPage',
      'contactPage',
    ])
    const publishedServicesPage = transaction.createOrReplace.mock.calls.find(
      ([document]) => document._id === 'servicesPage',
    )?.[0]
    expect(
      publishedServicesPage.services.map((item: { _ref: string }) => item._ref),
    ).toEqual(SERVICE_IDS)
    expect(
      publishedServicesPage.services.some(
        (item: { _weak?: boolean }) => item._weak,
      ),
    ).toBe(false)
    expect(transaction.delete.mock.calls.map(([id]) => id)).toEqual([
      ...SERVICE_IDS.map((id) => `drafts.${id}`),
      SERVICES_PAGE_DRAFT_ID,
      CONTACT_PAGE_DRAFT_ID,
    ])
    expect(transaction.commit).toHaveBeenCalledOnce()
  })
})
