import { describe, expect, it } from 'vitest'
import {
  canonicalizeDocument,
  compareCanonicalDocuments,
} from './compare-datasets'

const sourceAssets = new Map([['image-source', 'same-sha1']])
const targetAssets = new Map([['image-target', 'same-sha1']])

describe('Sanity dataset comparison', () => {
  it('treats draft IDs, weak references, system fields, and equivalent assets as the same content', () => {
    const source = canonicalizeDocument(
      {
        _id: 'homePage',
        _type: 'homePage',
        _rev: 'source-revision',
        hero: {
          asset: { _type: 'reference', _ref: 'image-source' },
          alt: 'Stillroom collage',
        },
        featured: [{ _type: 'reference', _ref: 'work-project-the-good-table' }],
      },
      sourceAssets,
    )
    const target = canonicalizeDocument(
      {
        _id: 'drafts.homePage',
        _type: 'homePage',
        _rev: 'target-revision',
        _createdAt: 'today',
        hero: {
          asset: { _type: 'reference', _ref: 'image-target' },
          alt: 'Stillroom collage',
        },
        featured: [
          {
            _type: 'reference',
            _ref: 'drafts.work-project-the-good-table',
            _weak: true,
            _strengthenOnPublish: { type: 'workProject' },
          },
        ],
      },
      targetAssets,
    )

    expect(target).toEqual(source)
  })

  it('reports document IDs whose content differs', () => {
    expect(() =>
      compareCanonicalDocuments(
        new Map([['homePage', { _id: 'homePage', heading: 'Approved' }]]),
        new Map([['homePage', { _id: 'homePage', heading: 'Changed' }]]),
      ),
    ).toThrow('Content differs for homePage')
  })
})
