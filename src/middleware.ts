import { defineMiddleware } from 'astro:middleware'

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next()

  if (context.url.pathname.startsWith('/studio')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  return response
})
