import { describe, expect, it } from 'vitest'
import { resolveSanityEnvironment } from './environment'

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
