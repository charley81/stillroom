import { describe, expect, it } from 'vitest'
import {
  validatePublicPage,
  validateStudioResponse,
  type PublicPageSnapshot,
} from './site-verification'

const validPage: PublicPageSnapshot = {
  route: '/work',
  viewport: 'desktop',
  status: 200,
  expectedStatus: 200,
  canonical: 'https://stillroom-app.netlify.app/work',
  expectedCanonical: 'https://stillroom-app.netlify.app/work',
  title: 'Work | Stillroom',
  description: 'Selected hospitality branding work.',
  h1Count: 1,
  missingAltCount: 0,
  unlabeledControlCount: 0,
  documentWidth: 1440,
  viewportWidth: 1440,
  links: ['https://stillroom-app.netlify.app/about'],
}

describe('production site verification', () => {
  it('accepts an accessible public page with correct metadata', () => {
    expect(validatePublicPage(validPage)).toEqual([])
  })

  it('reports metadata, accessibility, navigation, and overflow failures together', () => {
    expect(
      validatePublicPage({
        ...validPage,
        canonical: undefined,
        title: '',
        description: undefined,
        h1Count: 2,
        missingAltCount: 1,
        unlabeledControlCount: 1,
        documentWidth: 1450,
        links: ['https://stillroom-app.netlify.app/studio'],
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining('canonical'),
        expect.stringContaining('title'),
        expect.stringContaining('meta description'),
        expect.stringContaining('2 h1 elements'),
        expect.stringContaining('1 image without alt'),
        expect.stringContaining('1 unlabeled form control'),
        expect.stringContaining('horizontal overflow'),
        expect.stringContaining('public navigation exposes /studio'),
      ]),
    )
  })

  it('accepts unknown dynamic slugs only when they return 404 without a canonical', () => {
    expect(
      validatePublicPage({
        ...validPage,
        route: '/work/unknown-project',
        status: 404,
        expectedStatus: 404,
        canonical: undefined,
        expectedCanonical: undefined,
      }),
    ).toEqual([])
  })

  it('requires Studio to load with noindex and nofollow', () => {
    expect(
      validateStudioResponse({
        status: 200,
        robots: 'noindex, nofollow',
      }),
    ).toEqual([])
    expect(
      validateStudioResponse({ status: 200, robots: undefined }),
    ).toContain('Studio response is missing noindex, nofollow.')
  })
})
