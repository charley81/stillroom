import {
  createClient as createSanityClient,
  type ClientConfig,
  type ClientParams,
  type ClientReturn,
} from '@sanity/client'
import { SANITY_API_VERSION } from '../constants'
import {
  resolveSanityEnvironment,
  type SanityEnvironmentConfig,
} from '../environment'
import { PUBLIC_PREVIEW_STATE, type PreviewState } from '../preview'

interface QueryClient {
  fetch: (
    query: string,
    params?: Record<string, unknown>,
    options?: Record<string, unknown>,
  ) => Promise<unknown>
}

type CreateClient = (config: ClientConfig) => QueryClient

interface ContentRequestOptions {
  preview?: PreviewState
  readToken?: string
}

export interface ContentQueryResult<Data> {
  data: Data
  perspective: 'published' | 'drafts'
  sourceMap: unknown
}

export function createContent(
  config: SanityEnvironmentConfig,
  request: ContentRequestOptions = {},
  createClient: CreateClient = createSanityClient,
) {
  const preview = request.preview ?? PUBLIC_PREVIEW_STATE
  if (preview.enabled && !request.readToken) {
    throw new Error(
      'SANITY_API_READ_TOKEN is required during Sanity draft preview.',
    )
  }

  const client = createClient({
    ...config,
    apiVersion: SANITY_API_VERSION,
    useCdn: !preview.enabled,
    stega: { studioUrl: '/studio' },
  })

  return {
    async loadQuery<const Query extends string>(
      query: Query,
      params?: ClientParams<Query>,
    ): Promise<ContentQueryResult<ClientReturn<Query, unknown>>> {
      const response = (await client.fetch(query, params ?? {}, {
        filterResponse: false,
        perspective: preview.perspective,
        resultSourceMap: preview.enabled ? 'withKeyArraySelector' : false,
        stega: preview.enabled,
        useCdn: !preview.enabled,
        ...(preview.enabled ? { token: request.readToken } : {}),
      })) as {
        result: ClientReturn<Query, unknown>
        resultSourceMap?: unknown
      }

      return {
        data: response.result,
        perspective: preview.perspective,
        sourceMap: response.resultSourceMap ?? null,
      }
    },
  }
}

function createRequestContent(preview: PreviewState) {
  return createContent(
    resolveSanityEnvironment({
      PUBLIC_SANITY_PROJECT_ID: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
      PUBLIC_SANITY_DATASET: import.meta.env.PUBLIC_SANITY_DATASET,
      CONTEXT: import.meta.env.CONTEXT,
    }),
    {
      preview,
      readToken: preview.enabled
        ? import.meta.env.SANITY_API_READ_TOKEN
        : undefined,
    },
  )
}

export async function loadContentQuery<const Query extends string>(
  query: Query,
  preview: PreviewState = PUBLIC_PREVIEW_STATE,
  params?: ClientParams<Query>,
): Promise<ContentQueryResult<ClientReturn<Query, unknown>>> {
  return createRequestContent(preview).loadQuery(query, params)
}
