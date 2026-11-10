export const DEFAULT_SITE_ORIGIN = 'https://stillroom-app.netlify.app'
export const LOCAL_DEVELOPMENT_ORIGIN = 'http://localhost:4321'

export interface SiteOriginEnvironment {
  readonly [key: string]: unknown
  PUBLIC_SITE_ORIGIN?: unknown
}

function normalizeSiteOrigin(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('PUBLIC_SITE_ORIGIN must be an HTTP(S) origin.')
  }

  try {
    const url = new URL(value)
    const isHttp = url.protocol === 'http:' || url.protocol === 'https:'
    const isOriginOnly =
      url.pathname === '/' &&
      !url.search &&
      !url.hash &&
      !url.username &&
      !url.password

    if (!isHttp || !isOriginOnly) throw new Error()

    return url.origin
  } catch {
    throw new Error('PUBLIC_SITE_ORIGIN must be an HTTP(S) origin.')
  }
}

export function resolveSiteOrigin(environment: SiteOriginEnvironment): string {
  const configuredOrigin = environment.PUBLIC_SITE_ORIGIN
  return configuredOrigin === undefined || configuredOrigin === ''
    ? DEFAULT_SITE_ORIGIN
    : normalizeSiteOrigin(configuredOrigin)
}

export function requireConfiguredSiteOrigin(
  environment: SiteOriginEnvironment,
): string {
  const configuredOrigin = environment.PUBLIC_SITE_ORIGIN
  if (configuredOrigin === undefined || configuredOrigin === '') {
    throw new Error(
      'PUBLIC_SITE_ORIGIN is required for production-mutating tooling.',
    )
  }

  return normalizeSiteOrigin(configuredOrigin)
}

export function resolveRuntimeSiteOrigin(
  browserEnvironment?: SiteOriginEnvironment,
): string {
  const environment =
    browserEnvironment ?? (typeof process === 'undefined' ? {} : process.env)

  return resolveSiteOrigin(environment)
}
