import {
  LOCAL_DEVELOPMENT_ORIGIN,
  resolveRuntimeSiteOrigin,
} from '../site-origin'

export function createTrustedPresentationOrigins(siteOrigin: string) {
  return [LOCAL_DEVELOPMENT_ORIGIN, siteOrigin] as const
}

export const TRUSTED_PRESENTATION_ORIGINS = createTrustedPresentationOrigins(
  resolveRuntimeSiteOrigin(import.meta.env),
)

export function isTrustedPresentationOrigin(
  origin: string | undefined,
): boolean {
  return TRUSTED_PRESENTATION_ORIGINS.some((trusted) => trusted === origin)
}
