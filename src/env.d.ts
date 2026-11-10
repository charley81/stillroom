/// <reference path="../.astro/types.d.ts" />

import type { ContentRequest } from './sanity/content'
import type { PreviewState } from './sanity/preview'

declare global {
  interface ImportMetaEnv {
    readonly PUBLIC_SITE_ORIGIN?: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }

  namespace App {
    interface Locals {
      preview: PreviewState
      content: ContentRequest
    }
  }
}
