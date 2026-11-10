import { stegaClean } from '@sanity/client/stega'
import type {
  CONTACT_PAGE_QUERY_RESULT,
  SERVICES_PAGE_QUERY_RESULT,
} from '../../../sanity.types'
import { PUBLIC_PREVIEW_STATE, type PreviewState } from '../preview'
import {
  CONTACT_PAGE_QUERY,
  SERVICES_PAGE_QUERY,
} from '../queries/services-contact'
import { loadContentQuery } from './client'
import { MissingContentError } from './errors'
import {
  hasUniqueStrings,
  requireContentImage,
  requireString,
  type ContentImage,
} from './validation'

type GeneratedServicesPage = NonNullable<SERVICES_PAGE_QUERY_RESULT>
type GeneratedService = GeneratedServicesPage['services'][number]
type GeneratedContactResult = CONTACT_PAGE_QUERY_RESULT
type GeneratedContactPage = NonNullable<GeneratedContactResult['page']>

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
    if (!hasUniqueStrings(deliverables as string[])) {
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
    !hasUniqueStrings(sectors as string[])
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

export async function getServicesPage(
  preview: PreviewState = PUBLIC_PREVIEW_STATE,
): Promise<ServicesPage> {
  const { data } = await loadContentQuery(SERVICES_PAGE_QUERY, preview)
  return requireServicesPage(data)
}

export async function getContactPage(
  preview: PreviewState = PUBLIC_PREVIEW_STATE,
): Promise<ContactPage> {
  const { data } = await loadContentQuery(CONTACT_PAGE_QUERY, preview)
  return requireContactPage(data)
}
