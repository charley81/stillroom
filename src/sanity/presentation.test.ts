import { describe, expect, it } from 'vitest'
import {
  PRESENTATION_OPTIONS,
  TRUSTED_PRESENTATION_ORIGINS,
  siteSettingsLocations,
} from './presentation'

describe('Sanity Presentation configuration', () => {
  it('allows only local Astro and the production Netlify origin', () => {
    expect(TRUSTED_PRESENTATION_ORIGINS).toEqual([
      'http://localhost:4321',
      'https://stillroom-app.netlify.app',
    ])
    expect(PRESENTATION_OPTIONS.allowOrigins).toEqual(
      TRUSTED_PRESENTATION_ORIGINS,
    )
  })

  it('enables preview mode only for trusted target origins', async () => {
    const previewUrl = PRESENTATION_OPTIONS.previewUrl
    expect(typeof previewUrl).toBe('object')
    if (typeof previewUrl !== 'object')
      throw new Error('Expected preview options')

    const resolvePreviewMode = previewUrl.previewMode
    expect(typeof resolvePreviewMode).toBe('function')
    if (typeof resolvePreviewMode !== 'function') {
      throw new Error('Expected a preview mode resolver')
    }

    await expect(
      resolvePreviewMode({
        client: {} as never,
        origin: 'https://stillroom-app.netlify.app',
        targetOrigin: 'https://stillroom-app.netlify.app',
      }),
    ).resolves.toEqual({
      enable: '/api/preview/enable',
      shareAccess: false,
    })

    await expect(
      resolvePreviewMode({
        client: {} as never,
        origin: 'https://deploy-preview-42--stillroom-app.netlify.app',
        targetOrigin: 'https://deploy-preview-42--stillroom-app.netlify.app',
      }),
    ).resolves.toBe(false)
  })

  it('locates Site Settings on every page where its global content appears', () => {
    expect(siteSettingsLocations.locations).toEqual([
      { title: 'Home', href: '/' },
      { title: 'Work', href: '/work' },
      { title: 'Services', href: '/services' },
      { title: 'About', href: '/about' },
      { title: 'Journal', href: '/journal' },
      { title: 'Contact', href: '/contact' },
    ])
    expect(PRESENTATION_OPTIONS.resolve?.locations).toEqual({
      siteSettings: siteSettingsLocations,
    })
  })
})
