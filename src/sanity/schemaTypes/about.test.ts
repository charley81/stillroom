import { describe, expect, it } from 'vitest'
import { aboutPage } from './documents/about-page'
import { clientLogo } from './documents/client-logo'
import { constrainedRichText } from './objects/constrained-rich-text'
import { editorialImage } from './objects/editorial-image'
import { seoFields } from './objects/seo-fields'
import { teamProfile } from './objects/team-profile'

function fieldNames(type: { fields?: Array<{ name: string }> }) {
  return type.fields?.map((field) => field.name) ?? []
}

describe('About and Client Logo schemas', () => {
  it('matches the approved fixed About content model', () => {
    expect(fieldNames(aboutPage)).toEqual([
      'heading',
      'heroImage',
      'founderHeading',
      'founderStory',
      'founderName',
      'founderRole',
      'founderImage',
      'teamHeading',
      'teamIntroduction',
      'teamMembers',
      'principlesHeading',
      'principles',
      'clientProofHeading',
      'clientProofCopy',
      'clientLogos',
      'clientProofCtaLabel',
      'finalCtaEyebrow',
      'finalCtaHeading',
      'finalCtaLabel',
      'seo',
    ])
    expect(fieldNames(aboutPage)).not.toContain('sectionOrder')
    expect(fieldNames(aboutPage)).not.toContain('clientProofCtaHref')
    expect(fieldNames(aboutPage)).not.toContain('finalCtaHref')
  })

  it('stores complete reusable Client Logo lockups without assembly controls', () => {
    expect(fieldNames(clientLogo)).toEqual(['clientName', 'logo'])
    expect(fieldNames(clientLogo)).not.toContain('symbol')
    expect(fieldNames(clientLogo)).not.toContain('tagline')
    expect(fieldNames(clientLogo)).not.toContain('font')
  })

  it('defines the approved team, editorial image, constrained rich text, and SEO shapes', () => {
    expect(fieldNames(teamProfile)).toEqual([
      'name',
      'role',
      'biography',
      'portrait',
    ])
    expect(fieldNames(editorialImage)).toEqual([
      'asset',
      'decorative',
      'alt',
      'caption',
      'mobileOverride',
    ])
    expect(constrainedRichText.type).toBe('array')
    expect(constrainedRichText.of?.[0].styles).toEqual([
      { title: 'Normal', value: 'normal' },
    ])
    expect(constrainedRichText.of?.[0].lists).toEqual([])
    expect(fieldNames(seoFields)).toEqual([
      'metaTitle',
      'metaDescription',
      'socialImage',
    ])
  })
})
