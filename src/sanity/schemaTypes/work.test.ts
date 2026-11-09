import { describe, expect, it } from 'vitest'
import { workPage } from './documents/work-page'
import { workProject } from './documents/work-project'
import { publishedDocumentExists } from './locked-slug-input'
import { narrativeSection } from './objects/narrative-section'
import { workProjectGalleryBrandPanel } from './objects/work-project-gallery-brand-panel'
import { workProjectGalleryImage } from './objects/work-project-gallery-image'
import { approvedGalleryBlocks } from './validation'

function fieldNames(type: { fields?: Array<{ name: string }> }) {
  return type.fields?.map((field) => field.name) ?? []
}

describe('Work schemas', () => {
  it('matches the approved Work-page content model without ordering shortcuts', () => {
    expect(fieldNames(workPage)).toEqual([
      'heading',
      'heroArtwork',
      'workProjects',
      'finalCtaEyebrow',
      'finalCtaHeading',
      'finalCtaLabel',
      'seo',
    ])
    expect(fieldNames(workPage)).not.toContain('featured')
    expect(fieldNames(workPage)).not.toContain('order')
  })

  it('matches the approved Work Project content model', () => {
    expect(fieldNames(workProject)).toEqual([
      'title',
      'slug',
      'sectorLabel',
      'cardSummary',
      'cardImage',
      'services',
      'positioningStatement',
      'introduction',
      'heroArtwork',
      'heroPhotograph',
      'challenge',
      'contribution',
      'galleryHeading',
      'gallery',
      'outcomeHeading',
      'outcomeCopy',
      'seo',
    ])
    expect(fieldNames(workProject)).not.toContain('featured')
    expect(fieldNames(workProject)).not.toContain('order')
    expect(fieldNames(workProject)).not.toContain('nextWorkProject')
  })

  it('defines only the two approved gallery blocks and reusable narrative fields', () => {
    expect(fieldNames(narrativeSection)).toEqual(['heading', 'content'])
    expect(fieldNames(workProjectGalleryImage)).toEqual(['image'])
    expect(fieldNames(workProjectGalleryBrandPanel)).toEqual([
      'title',
      'statement',
      'label',
      'image',
    ])
    expect(approvedGalleryBlocks(undefined)).toBe(true)
    expect(
      approvedGalleryBlocks([
        { _type: 'workProjectGalleryImage' },
        { _type: 'workProjectGalleryBrandPanel' },
      ]),
    ).toBe(true)
    expect(approvedGalleryBlocks([{ _type: 'twoImagePair' }])).toBe(
      'Work Project galleries may only contain approved gallery blocks.',
    )
  })

  it('locks the slug input when the published Work Project exists', async () => {
    const slugField = workProject.fields.find((field) => field.name === 'slug')
    expect(slugField?.components?.input).toBeTypeOf('function')

    const fetch = async (_query: string, params: Record<string, string>) => {
      expect(params).toEqual({ publishedId: 'work-project-the-good-table' })
      return true
    }
    await expect(
      publishedDocumentExists({ fetch }, 'drafts.work-project-the-good-table'),
    ).resolves.toBe(true)
  })
})
