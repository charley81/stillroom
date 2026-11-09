import { describe, expect, it, vi } from 'vitest'
import {
  PREVIEW_COOKIE_NAME,
  createPreviewSession,
  enablePreview,
  exitPreview,
  readPreviewSession,
} from './preview'

const SESSION_SECRET = 'a-secure-preview-session-secret-at-least-32-characters'
const READ_TOKEN = 'server-only-read-token'
const NOW = new Date('2030-01-02T03:04:05.000Z')

function createCookies() {
  return {
    set: vi.fn(),
    delete: vi.fn(),
  }
}

function createDependencies(validation: {
  isValid: boolean
  redirectTo?: string
  studioOrigin?: string
}) {
  return {
    projectId: 'project',
    dataset: 'development',
    readToken: READ_TOKEN,
    sessionSecret: SESSION_SECRET,
    now: () => NOW,
    createClient: vi.fn().mockReturnValue({ config: vi.fn() }),
    validatePreviewUrl: vi.fn().mockResolvedValue(validation),
  }
}

describe('preview enable endpoint', () => {
  it('rejects invalid preview URL secrets without setting a cookie', async () => {
    const cookies = createCookies()
    const response = await enablePreview(
      new Request(
        'https://stillroom-app.netlify.app/api/preview/enable?sanity-preview-secret=invalid',
      ),
      cookies,
      createDependencies({ isValid: false }),
    )

    expect(response.status).toBe(401)
    expect(cookies.set).not.toHaveBeenCalled()
  })

  it('sets a secure signed cookie and strips secret parameters before redirecting', async () => {
    const cookies = createCookies()
    const dependencies = createDependencies({
      isValid: true,
      studioOrigin: 'https://stillroom-app.netlify.app',
      redirectTo:
        '/work?sanity-preview-secret=do-not-leak&sanity-preview-pathname=%2Fcontact&keep=yes',
    })

    const response = await enablePreview(
      new Request(
        'https://stillroom-app.netlify.app/api/preview/enable?sanity-preview-secret=valid',
      ),
      cookies,
      dependencies,
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'https://stillroom-app.netlify.app/work?keep=yes',
    )
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(cookies.set).toHaveBeenCalledOnce()

    const [name, value, options] = cookies.set.mock.calls[0]
    expect(name).toBe(PREVIEW_COOKIE_NAME)
    expect(value).not.toContain(READ_TOKEN)
    expect(value).not.toContain('valid')
    expect(options).toEqual(
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      }),
    )
    await expect(
      readPreviewSession(value, SESSION_SECRET, NOW),
    ).resolves.toEqual({ enabled: true, perspective: 'drafts' })
  })

  it('rejects preview access from temporary or unknown origins', async () => {
    const cookies = createCookies()
    const response = await enablePreview(
      new Request(
        'https://deploy-preview-42--stillroom-app.netlify.app/api/preview/enable?sanity-preview-secret=valid',
      ),
      cookies,
      createDependencies({
        isValid: true,
        studioOrigin: 'https://stillroom-app.netlify.app',
        redirectTo: '/',
      }),
    )

    expect(response.status).toBe(401)
    expect(cookies.set).not.toHaveBeenCalled()
  })

  it('falls back to the homepage for an unsafe redirect', async () => {
    const cookies = createCookies()
    const response = await enablePreview(
      new Request(
        'https://stillroom-app.netlify.app/api/preview/enable?sanity-preview-secret=valid',
      ),
      cookies,
      createDependencies({
        isValid: true,
        studioOrigin: 'https://stillroom-app.netlify.app',
        redirectTo: 'https://attacker.example/steal',
      }),
    )

    expect(response.headers.get('location')).toBe(
      'https://stillroom-app.netlify.app/',
    )
  })
})

describe('preview sessions', () => {
  it('rejects a tampered cookie', async () => {
    const value = await createPreviewSession(SESSION_SECRET, NOW)
    const [payload, signature] = value.split('.')
    const tampered = `${payload}.${signature.startsWith('a') ? 'b' : 'a'}${signature.slice(1)}`

    await expect(
      readPreviewSession(tampered, SESSION_SECRET, NOW),
    ).resolves.toEqual({ enabled: false, perspective: 'published' })
  })
})

describe('preview exit endpoint', () => {
  it('clears preview state and redirects only to a safe internal path', () => {
    const cookies = createCookies()
    const response = exitPreview(
      new Request(
        'https://stillroom-app.netlify.app/api/preview/exit?redirect=%2Fcontact%3Ffrom%3Dpreview',
      ),
      cookies,
    )

    expect(cookies.delete).toHaveBeenCalledWith(
      PREVIEW_COOKIE_NAME,
      expect.objectContaining({ path: '/', secure: true }),
    )
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'https://stillroom-app.netlify.app/contact?from=preview',
    )
  })
})
