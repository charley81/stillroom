import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import {
  PRODUCTION_PUBLISH_GROUPS,
  preparePublishedDocument,
  publishDraftGroups,
  runProductionLaunchPlan,
  writeDraftValidationFile,
  type ProductionLaunchStep,
} from './production-launch'

describe('production launch plan', () => {
  it('runs every guarded stage sequentially and stops on failure', async () => {
    const events: string[] = []
    const later = vi.fn()
    const steps: ProductionLaunchStep[] = [
      {
        name: 'pre-migration export',
        run: vi.fn(async () => events.push('pre-migration export')),
      },
      {
        name: 'draft migration',
        run: vi.fn(async () => {
          events.push('draft migration')
          throw new Error('draft validation failed')
        }),
      },
      { name: 'publication', run: later },
    ]

    await expect(runProductionLaunchPlan(steps)).rejects.toThrow(
      'draft validation failed',
    )
    expect(events).toEqual(['pre-migration export', 'draft migration'])
    expect(later).not.toHaveBeenCalled()
  })

  it('publishes referenced documents, entries, then singleton pages and Site Settings', () => {
    expect(PRODUCTION_PUBLISH_GROUPS.map(({ name }) => name)).toEqual([
      'reusable referenced documents',
      'Work Projects and Journal Articles',
      'page singletons and Site Settings',
    ])
  })

  it('writes a draft-only validation dataset with referenced assets', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'stillroom-validation-'))
    const documents = [
      { _id: 'drafts.homePage', _type: 'homePage' },
      { _id: 'image-asset', _type: 'sanity.imageAsset' },
    ]
    const client = { fetch: vi.fn(async () => documents) }

    const path = await writeDraftValidationFile({
      client,
      directory,
      now: new Date('2026-11-10T15:40:00.000Z'),
    })

    expect(path).toBe(
      join(directory, 'production-drafts-2026-11-10T15-40-00-000Z.ndjson'),
    )
    expect((await readFile(path, 'utf8')).trim().split('\n')).toEqual(
      documents.map((document) => JSON.stringify(document)),
    )
  })
})

describe('production draft publication', () => {
  it('normalizes draft identities and strengthens every nested reference', () => {
    expect(
      preparePublishedDocument({
        _id: 'drafts.homePage',
        _type: 'homePage',
        _rev: 'revision',
        _createdAt: 'yesterday',
        _updatedAt: 'today',
        featured: [
          {
            _type: 'reference',
            _ref: 'drafts.work-project-the-good-table',
            _weak: true,
            _strengthenOnPublish: { type: 'workProject' },
          },
        ],
      }),
    ).toEqual({
      _id: 'homePage',
      _type: 'homePage',
      featured: [
        {
          _type: 'reference',
          _ref: 'work-project-the-good-table',
        },
      ],
    })
  })

  it('commits and deletes each publication group before starting the next', async () => {
    const events: string[] = []
    const transactions = PRODUCTION_PUBLISH_GROUPS.map((group) => ({
      createOrReplace: vi.fn((document: { _id: string }) => {
        events.push(`publish:${group.name}:${document._id}`)
        return transactions[PRODUCTION_PUBLISH_GROUPS.indexOf(group)]
      }),
      delete: vi.fn((id: string) => {
        events.push(`delete:${group.name}:${id}`)
        return transactions[PRODUCTION_PUBLISH_GROUPS.indexOf(group)]
      }),
      commit: vi.fn(async () => {
        events.push(`commit:${group.name}`)
      }),
    }))
    let transactionIndex = 0
    const client = {
      fetch: vi.fn(
        async (_query: string, { ids }: { ids: readonly string[] }) =>
          ids.map((id) => ({ _id: id, _type: 'testDocument' })),
      ),
      transaction: vi.fn(() => transactions[transactionIndex++]),
    }

    await publishDraftGroups(client)

    expect(events.filter((event) => event.startsWith('commit:'))).toEqual(
      PRODUCTION_PUBLISH_GROUPS.map(({ name }) => `commit:${name}`),
    )
    const firstEntryPublish = events.findIndex((event) =>
      event.startsWith('publish:Work Projects and Journal Articles:'),
    )
    const firstGroupCommit = events.indexOf(
      'commit:reusable referenced documents',
    )
    const firstSingletonPublish = events.findIndex((event) =>
      event.startsWith('publish:page singletons and Site Settings:'),
    )
    const secondGroupCommit = events.indexOf(
      'commit:Work Projects and Journal Articles',
    )
    expect(firstEntryPublish).toBeGreaterThan(firstGroupCommit)
    expect(firstSingletonPublish).toBeGreaterThan(secondGroupCommit)
  })
})
