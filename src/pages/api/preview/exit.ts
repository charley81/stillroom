import type { APIRoute } from 'astro'
import { exitPreview } from '../../../sanity/preview'

export const GET = (({ request, cookies }) =>
  exitPreview(request, {
    set: (name, value, options) => cookies.set(name, value, options),
    delete: (name, options) => cookies.delete(name, options),
  })) satisfies APIRoute
