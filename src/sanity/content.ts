import {
  createClient,
  type ClientConfig,
  type ClientParams,
  type ClientReturn,
} from '@sanity/client'
import type { SITE_SETTINGS_QUERY_RESULT } from '../../sanity.types'
import { SANITY_API_VERSION } from './constants'
import {
  resolveSanityEnvironment,
  type SanityEnvironmentConfig,
} from './environment'
import { SITE_SETTINGS_QUERY } from './queries/site-settings'

interface QueryClient {
  fetch: (
    query: string,
    params?: Record<string, unknown>,
    options?: Record<string, unknown>,
  ) => Promise<unknown>
}

type CreateClient = (config: ClientConfig) => QueryClient

type GeneratedSiteSettings = NonNullable<SITE_SETTINGS_QUERY_RESULT>

export type SiteSettings = Omit<GeneratedSiteSettings, 'defaultSocialImage'> & {
  defaultSocialImage: Omit<
    GeneratedSiteSettings['defaultSocialImage'],
    'url'
  > & { url: string }
}

export class MissingContentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MissingContentError'
  }
}

export function createPublishedContent(
  config: SanityEnvironmentConfig,
  createClientImplementation: CreateClient = createClient,
) {
  const client = createClientImplementation({
    ...config,
    apiVersion: SANITY_API_VERSION,
    useCdn: true,
  })

  return {
    async loadQuery<const Query extends string>(
      query: Query,
      params?: ClientParams<Query>,
    ): Promise<ClientReturn<Query, unknown>> {
      return client.fetch(query, params ?? {}, {
        perspective: 'published',
      }) as Promise<ClientReturn<Query, unknown>>
    },
  }
}

function requiredString(
  settings: Record<string, unknown>,
  field: keyof SiteSettings,
) {
  if (typeof settings[field] !== 'string' || settings[field].trim() === '') {
    throw new MissingContentError(
      `Site Settings is missing required content: ${String(field)}`,
    )
  }
}

export function requireSiteSettings(value: unknown): SiteSettings {
  if (!value) {
    throw new MissingContentError(
      'Required Site Settings document "siteSettings" was not found in published Sanity content.',
    )
  }

  const settings = value as unknown as Record<string, unknown>
  const requiredFields: Array<keyof SiteSettings> = [
    'studioName',
    'registeredMarkText',
    'homeLabel',
    'workLabel',
    'servicesLabel',
    'aboutLabel',
    'journalLabel',
    'contactLabel',
    'headerCtaLabel',
    'emailAddress',
    'newsletterHeading',
    'newsletterDescription',
    'footerTagline',
    'defaultSeoTitle',
    'defaultSeoDescription',
  ]

  requiredFields.forEach((field) => requiredString(settings, field))

  const socialImage = settings.defaultSocialImage as
    Record<string, unknown> | null | undefined
  if (
    !socialImage ||
    typeof socialImage.url !== 'string' ||
    typeof socialImage.decorative !== 'boolean'
  ) {
    throw new MissingContentError(
      'Site Settings is missing required content: defaultSocialImage',
    )
  }
  if (
    !socialImage.decorative &&
    (typeof socialImage.alt !== 'string' || socialImage.alt.trim() === '')
  ) {
    throw new MissingContentError(
      'Site Settings is missing required content: defaultSocialImage.alt',
    )
  }

  const socialLinks = settings.socialLinks
  if (
    socialLinks !== null &&
    (!Array.isArray(socialLinks) ||
      socialLinks.some(
        (link) =>
          !link ||
          typeof link !== 'object' ||
          typeof (link as Record<string, unknown>).platform !== 'string' ||
          typeof (link as Record<string, unknown>).url !== 'string',
      ))
  ) {
    throw new MissingContentError(
      'Site Settings contains an incomplete social link.',
    )
  }

  return value as SiteSettings
}

let publishedContent: ReturnType<typeof createPublishedContent> | undefined

function getPublishedContent() {
  if (publishedContent) return publishedContent

  publishedContent = createPublishedContent(
    resolveSanityEnvironment({
      PUBLIC_SANITY_PROJECT_ID: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
      PUBLIC_SANITY_DATASET: import.meta.env.PUBLIC_SANITY_DATASET,
      CONTEXT: import.meta.env.CONTEXT,
    }),
  )
  return publishedContent
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const settings = await getPublishedContent().loadQuery(SITE_SETTINGS_QUERY)
  return requireSiteSettings(settings)
}
