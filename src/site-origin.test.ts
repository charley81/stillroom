import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_SITE_ORIGIN,
  requireConfiguredSiteOrigin,
  resolveRuntimeSiteOrigin,
  resolveSiteOrigin,
} from './site-origin'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('site origin configuration', () => {
  it('uses the documented production fallback when no origin is configured', () => {
    expect(resolveSiteOrigin({})).toBe(DEFAULT_SITE_ORIGIN)
  })

  it('prefers the supplied Astro environment over ambient Node values', () => {
    vi.stubEnv('PUBLIC_SITE_ORIGIN', 'https://ambient.example')

    expect(
      resolveRuntimeSiteOrigin({
        PUBLIC_SITE_ORIGIN: 'https://configured.example',
      }),
    ).toBe('https://configured.example')
  })

  it('normalizes one configured origin for runtime and tooling consumers', () => {
    expect(
      resolveSiteOrigin({
        PUBLIC_SITE_ORIGIN: 'https://www.stillroom.example/',
      }),
    ).toBe('https://www.stillroom.example')
  })

  it.each([
    'stillroom.example',
    'ftp://stillroom.example',
    'https://stillroom.example/path',
    'https://stillroom.example/?preview=true',
    'https://user:password@stillroom.example',
  ])('rejects invalid configured origins: %s', (origin) => {
    expect(() => resolveSiteOrigin({ PUBLIC_SITE_ORIGIN: origin })).toThrow(
      'PUBLIC_SITE_ORIGIN must be an HTTP(S) origin',
    )
  })

  it('requires an explicit origin for production-mutating tooling', () => {
    expect(() => requireConfiguredSiteOrigin({})).toThrow(
      'PUBLIC_SITE_ORIGIN is required',
    )
    expect(
      requireConfiguredSiteOrigin({
        PUBLIC_SITE_ORIGIN: 'https://stillroom.example',
      }),
    ).toBe('https://stillroom.example')
  })
})
