import {
  createClient as createSanityClient,
  type ClientConfig,
} from '@sanity/client'
import {
  validatePreviewUrl as validateSanityPreviewUrl,
  type PreviewUrlValidateUrlResult,
} from '@sanity/preview-url-secret'
import { withoutSecretSearchParams } from '@sanity/preview-url-secret/without-secret-search-params'
import { SANITY_API_VERSION } from './constants'
import { isTrustedPresentationOrigin } from './presentation-origins'

export const PREVIEW_COOKIE_NAME = '__Host-stillroom-preview'
export const PREVIEW_SESSION_MAX_AGE_SECONDS = 60 * 60

export type PreviewState =
  | { enabled: false; perspective: 'published' }
  | { enabled: true; perspective: 'drafts' }

export const PUBLIC_PREVIEW_STATE: PreviewState = {
  enabled: false,
  perspective: 'published',
}

export const DRAFT_PREVIEW_STATE: PreviewState = {
  enabled: true,
  perspective: 'drafts',
}

interface PreviewSessionPayload {
  expiresAt: number
  perspective: 'drafts'
  version: 1
}

export interface PreviewCookieOptions {
  httpOnly?: boolean
  maxAge?: number
  path?: string
  sameSite?: boolean | 'lax' | 'strict' | 'none'
  secure?: boolean
}

export interface PreviewCookies {
  set: (name: string, value: string, options?: PreviewCookieOptions) => void
  delete: (name: string, options?: PreviewCookieOptions) => void
}

interface EnablePreviewDependencies {
  projectId: string
  dataset: string
  readToken?: string
  sessionSecret?: string
  now?: () => Date
  createClient?: (config: ClientConfig) => unknown
  validatePreviewUrl?: (
    client: unknown,
    previewUrl: string,
  ) => Promise<PreviewUrlValidateUrlResult>
}

const encoder = new TextEncoder()
const previewCookieOptions = {
  httpOnly: true,
  maxAge: PREVIEW_SESSION_MAX_AGE_SECONDS,
  path: '/',
  sameSite: 'lax',
  secure: true,
} as const satisfies PreviewCookieOptions

function requireSessionSecret(secret: string): void {
  if (secret.length < 32) {
    throw new Error(
      'SANITY_PREVIEW_SESSION_SECRET must contain at least 32 characters.',
    )
  }
}

async function createSigningKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { hash: 'SHA-256', name: 'HMAC' },
    false,
    ['sign', 'verify'],
  )
}

export async function createPreviewSession(
  secret: string,
  now = new Date(),
): Promise<string> {
  requireSessionSecret(secret)

  const payload: PreviewSessionPayload = {
    expiresAt:
      Math.floor(now.getTime() / 1000) + PREVIEW_SESSION_MAX_AGE_SECONDS,
    perspective: 'drafts',
    version: 1,
  }
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    'base64url',
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    await createSigningKey(secret),
    encoder.encode(encodedPayload),
  )

  return `${encodedPayload}.${Buffer.from(signature).toString('base64url')}`
}

export async function readPreviewSession(
  value: string | undefined,
  secret: string | undefined,
  now = new Date(),
): Promise<PreviewState> {
  if (!value || !secret || secret.length < 32) return PUBLIC_PREVIEW_STATE

  const [encodedPayload, encodedSignature, extra] = value.split('.')
  if (!encodedPayload || !encodedSignature || extra) return PUBLIC_PREVIEW_STATE

  try {
    const isValid = await crypto.subtle.verify(
      'HMAC',
      await createSigningKey(secret),
      Buffer.from(encodedSignature, 'base64url'),
      encoder.encode(encodedPayload),
    )
    if (!isValid) return PUBLIC_PREVIEW_STATE

    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8'),
    ) as Partial<PreviewSessionPayload>
    if (
      payload.version !== 1 ||
      payload.perspective !== 'drafts' ||
      typeof payload.expiresAt !== 'number' ||
      payload.expiresAt <= Math.floor(now.getTime() / 1000)
    ) {
      return PUBLIC_PREVIEW_STATE
    }

    return DRAFT_PREVIEW_STATE
  } catch {
    return PUBLIC_PREVIEW_STATE
  }
}

export function safeInternalRedirect(
  unsafePath: string | undefined,
  requestUrl: string,
): string {
  const requestOrigin = new URL(requestUrl).origin

  try {
    const redirectUrl = new URL(unsafePath || '/', requestOrigin)
    if (redirectUrl.origin !== requestOrigin) return '/'

    const cleanUrl = withoutSecretSearchParams(redirectUrl)
    return `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`
  } catch {
    return '/'
  }
}

function redirectResponse(path: string, requestUrl: string): Response {
  return new Response(null, {
    status: 307,
    headers: {
      'Cache-Control': 'no-store',
      Location: new URL(path, requestUrl).toString(),
      'Referrer-Policy': 'no-referrer',
    },
  })
}

export async function enablePreview(
  request: Request,
  cookies: PreviewCookies,
  dependencies: EnablePreviewDependencies,
): Promise<Response> {
  const {
    projectId,
    dataset,
    readToken,
    sessionSecret,
    now = () => new Date(),
    createClient = createSanityClient,
    validatePreviewUrl = (client, previewUrl) =>
      validateSanityPreviewUrl(
        client as Parameters<typeof validateSanityPreviewUrl>[0],
        previewUrl,
      ),
  } = dependencies

  if (!readToken || !sessionSecret || sessionSecret.length < 32) {
    return new Response('Preview is not configured.', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  const requestOrigin = new URL(request.url).origin
  if (!isTrustedPresentationOrigin(requestOrigin)) {
    return new Response('Invalid preview request.', {
      status: 401,
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion: SANITY_API_VERSION,
    useCdn: false,
    token: readToken,
  })

  let validation: PreviewUrlValidateUrlResult
  try {
    validation = await validatePreviewUrl(client, request.url)
  } catch {
    return new Response('Invalid preview request.', {
      status: 401,
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  if (
    !validation.isValid ||
    !isTrustedPresentationOrigin(validation.studioOrigin) ||
    validation.studioOrigin !== requestOrigin
  ) {
    return new Response('Invalid preview request.', {
      status: 401,
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  const session = await createPreviewSession(sessionSecret, now())
  cookies.set(PREVIEW_COOKIE_NAME, session, previewCookieOptions)

  return redirectResponse(
    safeInternalRedirect(validation.redirectTo, request.url),
    request.url,
  )
}

export function exitPreview(
  request: Request,
  cookies: PreviewCookies,
): Response {
  cookies.delete(PREVIEW_COOKIE_NAME, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: true,
  })

  const url = new URL(request.url)
  return redirectResponse(
    safeInternalRedirect(url.searchParams.get('redirect') ?? '/', request.url),
    request.url,
  )
}
