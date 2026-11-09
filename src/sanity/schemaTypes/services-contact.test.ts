import { describe, expect, it } from 'vitest'
import { contactPage } from './documents/contact-page'
import { service } from './documents/service'
import { servicesPage } from './documents/services-page'
import { processStep } from './objects/process-step'
import { seoFields } from './objects/seo-fields'

function fieldNames(type: { fields?: Array<{ name: string }> }) {
  return type.fields?.map((field) => field.name) ?? []
}

describe('Services and Contact schemas', () => {
  it('matches the approved Service content model', () => {
    expect(fieldNames(service)).toEqual([
      'title',
      'shortSummary',
      'description',
      'image',
      'deliverables',
    ])
  })

  it('keeps the Services page fixed to approved editorial fields', () => {
    expect(fieldNames(servicesPage)).toEqual([
      'heroHeading',
      'heroIntroduction',
      'heroImage',
      'heroCtaLabel',
      'services',
      'processHeading',
      'processSteps',
      'hospitalityHeading',
      'hospitalitySectorLabels',
      'hospitalityPointOfView',
      'hospitalityImage',
      'hospitalityCtaLabel',
      'finalStatementEyebrow',
      'finalStatementHeading',
      'seo',
    ])
    expect(fieldNames(servicesPage)).not.toContain('finalStatementCtaLabel')
  })

  it('keeps Contact editorial-only and form behavior outside Sanity', () => {
    expect(fieldNames(contactPage)).toEqual([
      'heading',
      'introduction',
      'supportingImage',
      'supportingStatement',
      'seo',
    ])
    expect(fieldNames(contactPage)).not.toContain('form')
    expect(fieldNames(contactPage)).not.toContain('services')
  })

  it('defines reusable process-step and SEO objects', () => {
    expect(fieldNames(processStep)).toEqual(['title', 'description'])
    expect(fieldNames(seoFields)).toEqual([
      'metaTitle',
      'metaDescription',
      'socialImage',
    ])
  })
})
