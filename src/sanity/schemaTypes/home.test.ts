import { describe, expect, it } from 'vitest'
import { homePage } from './documents/home-page'
import {
  exactCount,
  uniqueReferences,
  uniqueTrimmedStrings,
} from './validation'

function fieldNames(type: { fields?: Array<{ name: string }> }) {
  return type.fields?.map((field) => field.name) ?? []
}

describe('Home schema', () => {
  it('matches the approved fixed Home content model and exposes no layout controls', () => {
    expect(fieldNames(homePage)).toEqual([
      'heroHeading',
      'heroImage',
      'heroPrimaryCtaLabel',
      'heroSecondaryCtaLabel',
      'clientLogos',
      'featuredWorkHeading',
      'featuredWorkProjects',
      'featuredWorkCtaLabel',
      'featuredServices',
      'sectorLabels',
      'studioHeading',
      'studioIntroduction',
      'studioImage',
      'studioCtaLabel',
      'pointOfViewHeading',
      'pointOfViewCopy',
      'processHeading',
      'processSteps',
      'processCtaLabel',
      'journalHeading',
      'featuredJournalArticles',
      'journalCtaLabel',
      'finalCtaEyebrow',
      'finalCtaHeading',
      'finalCtaLabel',
      'seo',
    ])
    expect(fieldNames(homePage)).not.toContain('sectionOrder')
    expect(fieldNames(homePage)).not.toContain('layout')
    expect(fieldNames(homePage)).not.toContain('heroIntroduction')
    expect(fieldNames(homePage)).not.toContain('sectorSummaries')
    expect(fieldNames(homePage)).not.toContain('heroPrimaryCtaHref')
  })

  it('enforces every fixed Home count and duplicate rule', () => {
    const references = (count: number) =>
      Array.from({ length: count }, (_, index) => ({
        _ref: `document-${index}`,
      }))

    expect(exactCount(references(2), 2, 'Featured Work Projects')).toBe(true)
    expect(exactCount(references(3), 2, 'Featured Work Projects')).toBe(
      'Featured Work Projects requires exactly 2 items.',
    )
    expect(exactCount(references(4), 4, 'Featured Services')).toBe(true)
    expect(exactCount(references(3), 3, 'Featured Journal Articles')).toBe(true)
    expect(exactCount(references(5), 5, 'Client Logos')).toBe(true)
    expect(exactCount(references(4), 4, 'Process steps')).toBe(true)
    expect(
      exactCount(
        ['Restaurants', 'Hotels', 'Cafés', 'Food'],
        4,
        'Sector labels',
      ),
    ).toBe(true)
    expect(uniqueReferences([{ _ref: 'one' }, { _ref: 'one' }])).toBe(
      'References must be unique.',
    )
    expect(uniqueTrimmedStrings(['Restaurants', ' restaurants '])).toBe(
      'Items must be non-empty and unique.',
    )
  })
})
