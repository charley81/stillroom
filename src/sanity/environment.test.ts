import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  resolveRuntimeSanityEnvironment,
  resolveSanityEnvironment,
} from './environment'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Sanity runtime environment', () => {
  it('uses browser-safe values when process is unavailable', () => {
    vi.stubGlobal('process', undefined)

    expect(
      resolveRuntimeSanityEnvironment({
        PUBLIC_SANITY_PROJECT_ID: 'browser-project',
        PUBLIC_SANITY_DATASET: 'development',
      }),
    ).toEqual({ projectId: 'browser-project', dataset: 'development' })
  })

  it('uses Node values when process is available', () => {
    vi.stubGlobal('process', {
      env: {
        PUBLIC_SANITY_PROJECT_ID: 'node-project',
        PUBLIC_SANITY_DATASET: 'production',
      },
    })

    expect(
      resolveRuntimeSanityEnvironment({
        PUBLIC_SANITY_PROJECT_ID: 'browser-project',
        PUBLIC_SANITY_DATASET: 'development',
      }),
    ).toEqual({ projectId: 'node-project', dataset: 'production' })
  })
})

describe('Sanity environment mapping', () => {
  it('uses development locally and for Netlify previews', () => {
    expect(
      resolveSanityEnvironment({
        PUBLIC_SANITY_PROJECT_ID: 'project',
        PUBLIC_SANITY_DATASET: 'development',
      }),
    ).toEqual({ projectId: 'project', dataset: 'development' })

    expect(
      resolveSanityEnvironment({
        PUBLIC_SANITY_PROJECT_ID: 'project',
        PUBLIC_SANITY_DATASET: 'production',
        CONTEXT: 'deploy-preview',
      }),
    ).toEqual({ projectId: 'project', dataset: 'development' })
  })

  it('forces the production dataset for Netlify production', () => {
    expect(
      resolveSanityEnvironment({
        PUBLIC_SANITY_PROJECT_ID: 'project',
        PUBLIC_SANITY_DATASET: 'development',
        CONTEXT: 'production',
      }),
    ).toEqual({ projectId: 'project', dataset: 'production' })
  })
})
