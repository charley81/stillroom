import type { APIRoute } from 'astro'
import { resolveSanityEnvironment } from '../../../sanity/environment'
import { enablePreview } from '../../../sanity/preview'

export const GET = (async ({ request, cookies }) => {
  const { projectId, dataset } = resolveSanityEnvironment({
    PUBLIC_SANITY_PROJECT_ID: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
    PUBLIC_SANITY_DATASET: import.meta.env.PUBLIC_SANITY_DATASET,
    CONTEXT: import.meta.env.CONTEXT,
  })

  return enablePreview(
    request,
    {
      set: (name, value, options) => cookies.set(name, value, options),
      delete: (name, options) => cookies.delete(name, options),
    },
    {
      projectId,
      dataset,
      readToken: import.meta.env.SANITY_API_READ_TOKEN,
      sessionSecret: import.meta.env.SANITY_PREVIEW_SESSION_SECRET,
    },
  )
}) satisfies APIRoute
