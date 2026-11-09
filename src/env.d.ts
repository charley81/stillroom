/// <reference path="../.astro/types.d.ts" />

import type { PreviewState } from './sanity/preview'

declare global {
  namespace App {
    interface Locals {
      preview: PreviewState
    }
  }
}
