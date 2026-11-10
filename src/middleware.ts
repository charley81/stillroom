import { defineMiddleware } from 'astro:middleware'
import { createContentRequest } from './sanity/content'
import { isTrustedPresentationOrigin } from './sanity/presentation-origins'
import {
  PREVIEW_COOKIE_NAME,
  PUBLIC_PREVIEW_STATE,
  readPreviewSession,
} from './sanity/preview'

export const onRequest = defineMiddleware(async (context, next) => {
  const isStudioRoute = context.url.pathname.startsWith('/studio')
  const trustedOrigin = isTrustedPresentationOrigin(context.url.origin)

  if (isStudioRoute && !trustedOrigin) {
    return new Response('Not found', {
      status: 404,
      headers: { 'X-Robots-Tag': 'noindex, nofollow' },
    })
  }

  context.locals.preview = trustedOrigin
    ? await readPreviewSession(
        context.cookies.get(PREVIEW_COOKIE_NAME)?.value,
        import.meta.env.SANITY_PREVIEW_SESSION_SECRET,
      )
    : PUBLIC_PREVIEW_STATE
  context.locals.content = createContentRequest(context.locals.preview)

  const response = await next()

  if (isStudioRoute) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  if (context.locals.preview.enabled) {
    response.headers.set('Cache-Control', 'private, no-store')
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  return response
})
