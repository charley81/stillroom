import { createHash } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import {
  WORK_PAGE_DRAFT_ID,
  WORK_PROJECT_IDS,
  WORK_PROJECT_SLUGS,
  buildWorkDocuments,
  migrateWork,
} from './migrate-work'

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

describe('Work migration', () => {
  it('builds six stable Work Project drafts with preserved slugs and approved fields', () => {
    const { projects, workPage } = buildWorkDocuments(assetIds)

    expect(WORK_PROJECT_SLUGS).toEqual([
      'the-good-table',
      'orlo-house',
      'juniper',
      'fieldwork',
      'the-long-table',
      'morrow',
    ])
    expect(projects.map((project) => project._id)).toEqual(
      WORK_PROJECT_IDS.map((id) => `drafts.${id}`),
    )
    expect(projects.map((project) => project.slug.current)).toEqual(
      WORK_PROJECT_SLUGS,
    )
    expect(
      projects.every(
        (project) =>
          project.cardImage.asset.asset._ref &&
          project.heroArtwork.asset.asset._ref &&
          project.heroPhotograph.asset.asset._ref,
      ),
    ).toBe(true)
    expect(
      projects
        .flatMap((project) => project.gallery)
        .every((block) =>
          ['workProjectGalleryImage', 'workProjectGalleryBrandPanel'].includes(
            block._type,
          ),
        ),
    ).toBe(true)
    expect(projects.every((project) => project.services.length > 0)).toBe(true)
    expect(
      projects.every(
        (project) =>
          new Set(project.services.map((service) => service._ref)).size ===
          project.services.length,
      ),
    ).toBe(true)
    expect(projects.every((project) => !('order' in project))).toBe(true)
    expect(projects.every((project) => !('nextWorkProject' in project))).toBe(
      true,
    )
    expect(workPage._id).toBe(WORK_PAGE_DRAFT_ID)
    expect(workPage.workProjects.map((reference) => reference._ref)).toEqual(
      WORK_PROJECT_IDS,
    )
  })

  it('reuses uploaded assets and replaces the same seven drafts on rerun', async () => {
    const { client, upload, documents } = createMigrationClient()
    const readAsset = async (path: string) => Buffer.from(`asset:${path}`)

    await migrateWork({ client, readAsset })
    const firstDocuments = [...documents.values()]
    const firstUploadCount = upload.mock.calls.length
    await migrateWork({ client, readAsset })

    expect(upload).toHaveBeenCalledTimes(firstUploadCount)
    expect([...documents.values()]).toEqual(firstDocuments)
    expect(documents.size).toBe(7)
    expect(documents.has(WORK_PAGE_DRAFT_ID)).toBe(true)
  })

  it('publishes Work Projects before the Work page and removes draft references', async () => {
    const { client, transaction } = createMigrationClient()

    await migrateWork({
      client,
      readAsset: async (path) => Buffer.from(`asset:${path}`),
      publish: true,
    })

    const published = transaction.createOrReplace.mock.calls.map(
      ([document]) => document,
    )
    expect(published.map((document) => document._id)).toEqual([
      ...WORK_PROJECT_IDS,
      'workPage',
    ])
    expect(
      published.flatMap(
        (document) => JSON.stringify(document).match(/_weak/g) ?? [],
      ),
    ).toHaveLength(0)
    expect(transaction.commit).toHaveBeenCalledOnce()
  })
})
