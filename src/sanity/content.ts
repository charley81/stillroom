import {
  createClient,
  type ClientConfig,
  type ClientParams,
  type ClientReturn,
} from '@sanity/client'
import { stegaClean } from '@sanity/client/stega'
import type {
  CONTACT_PAGE_QUERY_RESULT,
  SERVICES_PAGE_QUERY_RESULT,
  SITE_SETTINGS_QUERY_RESULT,
} from '../../sanity.types'
import { SANITY_API_VERSION } from './constants'
import {
  resolveSanityEnvironment,
  type SanityEnvironmentConfig,
} from './environment'
import { PUBLIC_PREVIEW_STATE, type PreviewState } from './preview'
import {
  CONTACT_PAGE_QUERY,
  SERVICES_PAGE_QUERY,
} from './queries/services-contact'
import { SITE_SETTINGS_QUERY } from './queries/site-settings'

interface QueryClient {
  fetch: (
    query: string,
    params?: Record<string, unknown>,
    options?: Record<string, unknown>,
  ) => Promise<unknown>
}

type CreateClient = (config: ClientConfig) => QueryClient

interface ContentRequestOptions {
  preview?: PreviewState
  readToken?: string
}

export interface ContentQueryResult<Data> {
  data: Data
  perspective: 'published' | 'drafts'
  sourceMap: unknown
}

type GeneratedSiteSettings = NonNullable<SITE_SETTINGS_QUERY_RESULT>

export type SiteSettings = Omit<GeneratedSiteSettings, 'defaultSocialImage'> & {
  defaultSocialImage: Omit<
    GeneratedSiteSettings['defaultSocialImage'],
    'url'
  > & { url: string }
}

type GeneratedServicesPage = NonNullable<SERVICES_PAGE_QUERY_RESULT>
type GeneratedService = GeneratedServicesPage['services'][number]
type GeneratedContactResult = CONTACT_PAGE_QUERY_RESULT
type GeneratedContactPage = NonNullable<GeneratedContactResult['page']>

export interface ContentImage {
  decorative: boolean
  alt: string | null
  caption: string | null
  url: string
  mobileUrl: string | null
}

export type ServicesPage = Omit<
  GeneratedServicesPage,
  'heroImage' | 'services' | 'hospitalityImage'
> & {
  heroImage: ContentImage
  services: Array<Omit<GeneratedService, 'image'> & { image: ContentImage }>
  hospitalityImage: ContentImage
}

export interface ContactServiceOption {
  label: string
  value: string
}

export type ContactPage = Omit<GeneratedContactPage, 'supportingImage'> & {
  supportingImage: ContentImage
  serviceOptions: ContactServiceOption[]
}

export class MissingContentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MissingContentError'
  }
}

export function createContent(
  config: SanityEnvironmentConfig,
  request: ContentRequestOptions = {},
  createClientImplementation: CreateClient = createClient,
) {
  const preview = request.preview ?? PUBLIC_PREVIEW_STATE
  if (preview.enabled && !request.readToken) {
    throw new Error(
      'SANITY_API_READ_TOKEN is required during Sanity draft preview.',
    )
  }

  const client = createClientImplementation({
    ...config,
    apiVersion: SANITY_API_VERSION,
    useCdn: !preview.enabled,
    stega: { studioUrl: '/studio' },
  })

  return {
    async loadQuery<const Query extends string>(
      query: Query,
      params?: ClientParams<Query>,
    ): Promise<ContentQueryResult<ClientReturn<Query, unknown>>> {
      const response = (await client.fetch(query, params ?? {}, {
        filterResponse: false,
        perspective: preview.perspective,
        resultSourceMap: preview.enabled ? 'withKeyArraySelector' : false,
        stega: preview.enabled,
        useCdn: !preview.enabled,
        ...(preview.enabled ? { token: request.readToken } : {}),
      })) as {
        result: ClientReturn<Query, unknown>
        resultSourceMap?: unknown
      }

      return {
        data: response.result,
        perspective: preview.perspective,
        sourceMap: response.resultSourceMap ?? null,
      }
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

function requireString(
  value: Record<string, unknown>,
  field: string,
  scope: string,
) {
  if (typeof value[field] !== 'string' || value[field].trim() === '') {
    throw new MissingContentError(
      `${scope} is missing required content: ${field}`,
    )
  }
}

function requireContentImage(value: unknown, field: string): ContentImage {
  if (!value || typeof value !== 'object') {
    throw new MissingContentError(`Missing required editorial image: ${field}`)
  }
  const image = value as Record<string, unknown>
  if (typeof image.url !== 'string' || image.url.trim() === '') {
    throw new MissingContentError(
      `Missing required editorial image: ${field}.url`,
    )
  }
  if (typeof image.decorative !== 'boolean') {
    throw new MissingContentError(
      `Missing required editorial image: ${field}.decorative`,
    )
  }
  if (
    !image.decorative &&
    (typeof image.alt !== 'string' || image.alt.trim() === '')
  ) {
    throw new MissingContentError(
      `Missing required editorial image: ${field}.alt`,
    )
  }
  if (image.decorative && typeof image.alt === 'string' && image.alt.trim()) {
    throw new MissingContentError(
      `Decorative editorial image must have empty alt text: ${field}.alt`,
    )
  }
  return value as ContentImage
}

function uniqueStrings(values: string[]) {
  const normalized = values.map((value) => value.trim().toLowerCase())
  return normalized.every(Boolean) && new Set(normalized).size === values.length
}

export function requireServicesPage(value: unknown): ServicesPage {
  if (!value) {
    throw new MissingContentError(
      'Required Services document "servicesPage" was not found in Sanity content.',
    )
  }

  const page = value as Record<string, unknown>
  ;[
    'heroHeading',
    'heroIntroduction',
    'heroCtaLabel',
    'processHeading',
    'hospitalityHeading',
    'hospitalityPointOfView',
    'hospitalityCtaLabel',
    'finalStatementEyebrow',
    'finalStatementHeading',
  ].forEach((field) => requireString(page, field, 'Services'))
  requireContentImage(page.heroImage, 'heroImage')
  requireContentImage(page.hospitalityImage, 'hospitalityImage')

  const services = page.services
  if (!Array.isArray(services) || services.length !== 4) {
    throw new MissingContentError(
      'Services must contain exactly four Services references.',
    )
  }
  const serviceIds = services.map((item) =>
    item && typeof item === 'object'
      ? (item as Record<string, unknown>)._id
      : undefined,
  )
  if (
    serviceIds.some((id) => typeof id !== 'string') ||
    new Set(serviceIds).size !== serviceIds.length
  ) {
    throw new MissingContentError(
      'Services must contain four unique Services references.',
    )
  }
  services.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new MissingContentError(`Services is missing services[${index}].`)
    }
    const service = item as Record<string, unknown>
    ;['title', 'shortSummary', 'description'].forEach((field) =>
      requireString(service, field, `Services services[${index}]`),
    )
    requireContentImage(service.image, `services[${index}].image`)
    const deliverables = service.deliverables
    if (
      !Array.isArray(deliverables) ||
      deliverables.length === 0 ||
      deliverables.some((deliverable) => typeof deliverable !== 'string')
    ) {
      throw new MissingContentError(
        `Services services[${index}] requires deliverables.`,
      )
    }
    if (!uniqueStrings(deliverables as string[])) {
      throw new MissingContentError(
        `Services services[${index}] requires unique deliverables.`,
      )
    }
  })

  const processSteps = page.processSteps
  if (!Array.isArray(processSteps) || processSteps.length !== 4) {
    throw new MissingContentError(
      'Services must contain exactly four process steps.',
    )
  }
  processSteps.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new MissingContentError(
        `Services is missing processSteps[${index}].`,
      )
    }
    const step = item as Record<string, unknown>
    ;['title', 'description'].forEach((field) =>
      requireString(step, field, `Services processSteps[${index}]`),
    )
  })

  const sectors = page.hospitalitySectorLabels
  if (
    !Array.isArray(sectors) ||
    sectors.length === 0 ||
    sectors.some((sector) => typeof sector !== 'string') ||
    !uniqueStrings(sectors as string[])
  ) {
    throw new MissingContentError(
      'Services requires unique hospitality sector labels.',
    )
  }

  return value as ServicesPage
}

export function requireContactPage(value: unknown): ContactPage {
  if (!value || typeof value !== 'object') {
    throw new MissingContentError('Required Contact content was not found.')
  }
  const result = value as Record<string, unknown>
  if (!result.page || typeof result.page !== 'object') {
    throw new MissingContentError(
      'Required Contact document "contactPage" was not found in Sanity content.',
    )
  }
  const page = result.page as Record<string, unknown>
  ;['heading', 'introduction', 'supportingStatement'].forEach((field) =>
    requireString(page, field, 'Contact'),
  )
  requireContentImage(page.supportingImage, 'supportingImage')

  const services = result.services
  if (!Array.isArray(services) || services.length !== 4) {
    throw new MissingContentError(
      'Contact requires exactly four Services-page options.',
    )
  }
  const ids = services.map((service) =>
    service && typeof service === 'object'
      ? (service as Record<string, unknown>)._id
      : undefined,
  )
  if (
    ids.some((id) => typeof id !== 'string') ||
    new Set(ids).size !== ids.length
  ) {
    throw new MissingContentError(
      'Contact requires four unique Services-page options.',
    )
  }

  const serviceOptions = services.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new MissingContentError(`Contact is missing services[${index}].`)
    }
    const service = item as Record<string, unknown>
    requireString(service, 'title', `Contact services[${index}]`)
    const label = service.title as string
    return { label, value: stegaClean(label) }
  })

  return { ...page, serviceOptions } as ContactPage
}

function getContent(preview: PreviewState) {
  return createContent(
    resolveSanityEnvironment({
      PUBLIC_SANITY_PROJECT_ID: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
      PUBLIC_SANITY_DATASET: import.meta.env.PUBLIC_SANITY_DATASET,
      CONTEXT: import.meta.env.CONTEXT,
    }),
    {
      preview,
      readToken: preview.enabled
        ? import.meta.env.SANITY_API_READ_TOKEN
        : undefined,
    },
  )
}

export async function getSiteSettings(
  preview: PreviewState = PUBLIC_PREVIEW_STATE,
): Promise<SiteSettings> {
  const { data } = await getContent(preview).loadQuery(SITE_SETTINGS_QUERY)
  return requireSiteSettings(data)
}

export async function getServicesPage(
  preview: PreviewState = PUBLIC_PREVIEW_STATE,
): Promise<ServicesPage> {
  const { data } = await getContent(preview).loadQuery(SERVICES_PAGE_QUERY)
  return requireServicesPage(data)
}

export async function getContactPage(
  preview: PreviewState = PUBLIC_PREVIEW_STATE,
): Promise<ContactPage> {
  const { data } = await getContent(preview).loadQuery(CONTACT_PAGE_QUERY)
  return requireContactPage(data)
}
