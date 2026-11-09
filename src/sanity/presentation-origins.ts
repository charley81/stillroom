export const TRUSTED_PRESENTATION_ORIGINS = [
  'http://localhost:4321',
  'https://stillroom-app.netlify.app',
] as const

export function isTrustedPresentationOrigin(
  origin: string | undefined,
): boolean {
  return TRUSTED_PRESENTATION_ORIGINS.some((trusted) => trusted === origin)
}
