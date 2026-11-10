import {
  createClient,
  type ClientConfig,
  type ClientParams,
  type ClientReturn,
} from '@sanity/client'
import { stegaClean } from '@sanity/client/stega'
import type {
  ABOUT_PAGE_QUERY_RESULT,
  CONTACT_PAGE_QUERY_RESULT,
  JOURNAL_ARTICLE_QUERY_RESULT,
  JOURNAL_PAGE_QUERY_RESULT,
  SERVICES_PAGE_QUERY_RESULT,
  SITE_SETTINGS_QUERY_RESULT,
  WORK_PAGE_QUERY_RESULT,
  WORK_PROJECT_QUERY_RESULT,
} from '../../sanity.types'
import { SANITY_API_VERSION } from './constants'
import {
  resolveSanityEnvironment,
  type SanityEnvironmentConfig,
} from './environment'
import { PUBLIC_PREVIEW_STATE, type PreviewState } from './preview'
import { ABOUT_PAGE_QUERY } from './queries/about'
import {
  CONTACT_PAGE_QUERY,
  SERVICES_PAGE_QUERY,
} from './queries/services-contact'
import { JOURNAL_ARTICLE_QUERY, JOURNAL_PAGE_QUERY } from './queries/journal'
import { SITE_SETTINGS_QUERY } from './queries/site-settings'
import { WORK_PAGE_QUERY, WORK_PROJECT_QUERY } from './queries/work'

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

type GeneratedAboutPage = NonNullable<ABOUT_PAGE_QUERY_RESULT>
type GeneratedTeamProfile = GeneratedAboutPage['teamMembers'][number]

export interface ClientLogo {
  _id: string
  clientName: string
  url: string
  mimeType: string | null
}

export type AboutPage = Omit<
  GeneratedAboutPage,
  'heroImage' | 'founderImage' | 'teamMembers' | 'clientLogos'
> & {
  heroImage: ContentImage
  founderImage: ContentImage
  teamMembers: Array<
    Omit<GeneratedTeamProfile, 'portrait'> & { portrait: ContentImage }
  >
  clientLogos: ClientLogo[]
}

type GeneratedWorkPage = NonNullable<WORK_PAGE_QUERY_RESULT>
type GeneratedWorkProjectCard = GeneratedWorkPage['workProjects'][number]
type GeneratedWorkProjectResult = WORK_PROJECT_QUERY_RESULT
type GeneratedWorkProject = NonNullable<GeneratedWorkProjectResult['project']>

export type WorkProjectCard = Omit<GeneratedWorkProjectCard, 'cardImage'> & {
  cardImage: ContentImage
}

export type WorkPage = Omit<
  GeneratedWorkPage,
  'heroArtwork' | 'workProjects'
> & {
  heroArtwork: ContentImage
  workProjects: WorkProjectCard[]
}

export type WorkProject = Omit<
  GeneratedWorkProject,
  'cardImage' | 'heroArtwork' | 'heroPhotograph' | 'gallery'
> & {
  cardImage: ContentImage
  heroArtwork: ContentImage
  heroPhotograph: ContentImage
  gallery: Array<
    | {
        _key: string
        _type: 'workProjectGalleryImage'
        image: ContentImage
      }
    | {
        _key: string
        _type: 'workProjectGalleryBrandPanel'
        title: string
        statement: string
        label: string
        image: ContentImage
      }
  >
}

export interface WorkProjectPage {
  page: WorkPage
  project: WorkProject
  nextProject: WorkProjectCard
  nextProjectNumber: number
}

type GeneratedJournalPageResult = JOURNAL_PAGE_QUERY_RESULT
type GeneratedJournalPage = NonNullable<GeneratedJournalPageResult['page']>
type GeneratedJournalArticleCard =
  GeneratedJournalPage['featuredJournalArticle']
type GeneratedJournalArticleResult = JOURNAL_ARTICLE_QUERY_RESULT
type GeneratedJournalArticle = NonNullable<
  GeneratedJournalArticleResult['article']
>

export type JournalArticleCard = Omit<
  GeneratedJournalArticleCard,
  'heroImage'
> & {
  heroImage: ContentImage
}

export type JournalPage = Omit<
  GeneratedJournalPage,
  'introductionArtwork' | 'featuredJournalArticle'
> & {
  introductionArtwork: ContentImage
  featuredJournalArticle: JournalArticleCard
  articles: JournalArticleCard[]
}

export type JournalArticle = Omit<
  GeneratedJournalArticle,
  'heroImage' | 'relatedJournalArticles'
> & {
  heroImage: ContentImage
  relatedJournalArticles: JournalArticleCard[]
}

export interface JournalArticlePage {
  article: JournalArticle
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

export class WorkProjectNotFoundError extends MissingContentError {
  constructor(slug: string) {
    super(`Work Project not found for slug: ${slug}`)
    this.name = 'WorkProjectNotFoundError'
  }
}

export class JournalArticleNotFoundError extends MissingContentError {
  constructor(slug: string) {
    super(`Journal Article not found for slug: ${slug}`)
    this.name = 'JournalArticleNotFoundError'
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

export function requireAboutPage(value: unknown): AboutPage {
  if (!value || typeof value !== 'object') {
    throw new MissingContentError(
      'Required About document "aboutPage" was not found in Sanity content.',
    )
  }

  const page = value as Record<string, unknown>
  ;[
    'heading',
    'founderHeading',
    'founderName',
    'founderRole',
    'teamHeading',
    'teamIntroduction',
    'principlesHeading',
    'clientProofHeading',
    'clientProofCopy',
    'clientProofCtaLabel',
    'finalCtaEyebrow',
    'finalCtaHeading',
    'finalCtaLabel',
  ].forEach((field) => requireString(page, field, 'About'))
  requireContentImage(page.heroImage, 'heroImage')
  requireContentImage(page.founderImage, 'founderImage')

  if (!Array.isArray(page.founderStory) || page.founderStory.length === 0) {
    throw new MissingContentError(
      'About is missing required content: founderStory',
    )
  }

  const teamMembers = page.teamMembers
  if (!Array.isArray(teamMembers) || teamMembers.length !== 3) {
    throw new MissingContentError('About requires exactly three team profiles.')
  }
  teamMembers.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new MissingContentError(`About is missing teamMembers[${index}].`)
    }
    const profile = item as Record<string, unknown>
    ;['name', 'role', 'biography'].forEach((field) =>
      requireString(profile, field, `About teamMembers[${index}]`),
    )
    requireContentImage(profile.portrait, `teamMembers[${index}].portrait`)
  })

  const principles = page.principles
  if (!Array.isArray(principles) || principles.length !== 3) {
    throw new MissingContentError(
      'About requires exactly three working principles.',
    )
  }
  principles.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new MissingContentError(`About is missing principles[${index}].`)
    }
    const principle = item as Record<string, unknown>
    ;['title', 'description'].forEach((field) =>
      requireString(principle, field, `About principles[${index}]`),
    )
  })

  const clientLogos = page.clientLogos
  if (!Array.isArray(clientLogos) || clientLogos.length !== 5) {
    throw new MissingContentError(
      'About requires exactly five Client Logo references.',
    )
  }
  const logoIds = clientLogos.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new MissingContentError(`About is missing clientLogos[${index}].`)
    }
    const logo = item as Record<string, unknown>
    requireString(logo, '_id', `About clientLogos[${index}]`)
    requireString(logo, 'clientName', `About clientLogos[${index}]`)
    requireString(logo, 'url', `About clientLogos[${index}]`)
    if (logo.mimeType !== null && typeof logo.mimeType !== 'string') {
      throw new MissingContentError(
        `About clientLogos[${index}] is missing required content: mimeType`,
      )
    }
    return String(logo._id).replace(/^drafts\./, '')
  })
  if (new Set(logoIds).size !== clientLogos.length) {
    throw new MissingContentError(
      'About requires five unique Client Logo references.',
    )
  }

  return value as AboutPage
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

function requireWorkProjectCard(value: unknown, scope: string) {
  if (!value || typeof value !== 'object') {
    throw new MissingContentError(`${scope} is missing.`)
  }
  const card = value as Record<string, unknown>
  ;[
    '_id',
    'title',
    'slug',
    'sectorLabel',
    'cardSummary',
    'positioningStatement',
  ].forEach((field) => requireString(card, field, scope))
  requireContentImage(card.cardImage, `${scope}.cardImage`)

  if (!Array.isArray(card.services) || card.services.length === 0) {
    throw new MissingContentError(`${scope} requires referenced Services.`)
  }
  card.services.forEach((service, index) => {
    if (!service || typeof service !== 'object') {
      throw new MissingContentError(`${scope}.services[${index}] is missing.`)
    }
    requireString(
      service as Record<string, unknown>,
      'title',
      `${scope}.services[${index}]`,
    )
  })
}

function requirePortableText(value: unknown, field: string) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new MissingContentError(`${field} requires narrative content.`)
  }
}

export function requireWorkPage(value: unknown): WorkPage {
  if (!value || typeof value !== 'object') {
    throw new MissingContentError(
      'Required Work document "workPage" was not found in Sanity content.',
    )
  }
  const page = value as Record<string, unknown>
  ;['heading', 'finalCtaEyebrow', 'finalCtaHeading', 'finalCtaLabel'].forEach(
    (field) => requireString(page, field, 'Work'),
  )
  requireContentImage(page.heroArtwork, 'Work.heroArtwork')

  if (!Array.isArray(page.workProjects) || page.workProjects.length === 0) {
    throw new MissingContentError(
      'Work requires at least one ordered Work Project reference.',
    )
  }
  page.workProjects.forEach((project, index) =>
    requireWorkProjectCard(project, `Work.workProjects[${index}]`),
  )
  const ids = page.workProjects.map(
    (project) => (project as Record<string, unknown>)._id,
  )
  if (new Set(ids).size !== ids.length) {
    throw new MissingContentError(
      'Work requires unique Work Project references.',
    )
  }

  return value as WorkPage
}

export function requireWorkProjectResult(
  value: unknown,
  requestedSlug = 'unknown',
): WorkProjectPage {
  if (!value || typeof value !== 'object') {
    throw new WorkProjectNotFoundError(requestedSlug)
  }
  const result = value as Record<string, unknown>
  const page = requireWorkPage(result.page)
  if (!result.project || typeof result.project !== 'object') {
    throw new WorkProjectNotFoundError(requestedSlug)
  }

  const project = result.project as Record<string, unknown>
  requireWorkProjectCard(project, 'Work Project')
  ;['introduction', 'galleryHeading', 'outcomeHeading'].forEach((field) =>
    requireString(project, field, 'Work Project'),
  )
  requireContentImage(project.heroArtwork, 'Work Project.heroArtwork')
  requireContentImage(project.heroPhotograph, 'Work Project.heroPhotograph')

  for (const sectionName of ['challenge', 'contribution']) {
    const section = project[sectionName]
    if (!section || typeof section !== 'object') {
      throw new MissingContentError(`Work Project.${sectionName} is missing.`)
    }
    const narrative = section as Record<string, unknown>
    requireString(narrative, 'heading', `Work Project.${sectionName}`)
    requirePortableText(
      narrative.content,
      `Work Project.${sectionName}.content`,
    )
  }
  requirePortableText(project.outcomeCopy, 'Work Project.outcomeCopy')

  if (!Array.isArray(project.gallery) || project.gallery.length === 0) {
    throw new MissingContentError(
      'Work Project requires at least one gallery block.',
    )
  }
  project.gallery.forEach((block, index) => {
    if (!block || typeof block !== 'object') {
      throw new MissingContentError(
        `Work Project gallery block ${index + 1} is missing.`,
      )
    }
    const galleryBlock = block as Record<string, unknown>
    if (
      galleryBlock._type !== 'workProjectGalleryImage' &&
      galleryBlock._type !== 'workProjectGalleryBrandPanel'
    ) {
      throw new MissingContentError(
        `Work Project contains unsupported gallery block: ${String(galleryBlock._type)}`,
      )
    }
    requireContentImage(
      galleryBlock.image,
      `Work Project.gallery[${index}].image`,
    )
    if (galleryBlock._type === 'workProjectGalleryBrandPanel') {
      ;['title', 'statement', 'label'].forEach((field) =>
        requireString(galleryBlock, field, `Work Project.gallery[${index}]`),
      )
    }
  })

  const slug = project.slug as string
  const projectIndex = page.workProjects.findIndex((item) => item.slug === slug)
  if (projectIndex === -1) {
    throw new MissingContentError(
      `Work Project "${slug}" is not included in the canonical Work-page order.`,
    )
  }
  const nextProjectNumber = (projectIndex + 1) % page.workProjects.length

  return {
    page,
    project: project as unknown as WorkProject,
    nextProject: page.workProjects[nextProjectNumber],
    nextProjectNumber: nextProjectNumber + 1,
  }
}

function requireJournalArticleCard(value: unknown, scope: string) {
  if (!value || typeof value !== 'object') {
    throw new MissingContentError(`${scope} is missing.`)
  }
  const card = value as Record<string, unknown>
  ;[
    '_id',
    'title',
    'slug',
    'publicationDate',
    'standfirst',
    'readingTime',
  ].forEach((field) => requireString(card, field, scope))
  requireContentImage(card.heroImage, `${scope}.heroImage`)
  if (!card.category || typeof card.category !== 'object') {
    throw new MissingContentError(`${scope}.category is missing.`)
  }
  const category = card.category as Record<string, unknown>
  ;['_id', 'title'].forEach((field) =>
    requireString(category, field, `${scope}.category`),
  )
}

export function requireJournalPage(value: unknown): JournalPage {
  if (!value || typeof value !== 'object') {
    throw new MissingContentError(
      'Required Journal document "journalPage" was not found in Sanity content.',
    )
  }
  const result = value as Record<string, unknown>
  if (!result.page || typeof result.page !== 'object') {
    throw new MissingContentError(
      'Required Journal document "journalPage" was not found in Sanity content.',
    )
  }
  const page = result.page as Record<string, unknown>
  ;['heading', 'introduction'].forEach((field) =>
    requireString(page, field, 'Journal'),
  )
  requireContentImage(page.introductionArtwork, 'Journal.introductionArtwork')
  requireJournalArticleCard(
    page.featuredJournalArticle,
    'Journal.featuredJournalArticle',
  )

  if (!Array.isArray(result.articles)) {
    throw new MissingContentError('Journal requires an article archive.')
  }
  result.articles.forEach((article, index) =>
    requireJournalArticleCard(article, `Journal.articles[${index}]`),
  )
  const featuredId = String(
    (page.featuredJournalArticle as Record<string, unknown>)._id,
  ).replace(/^drafts\./, '')
  const articleIds = result.articles.map((article) =>
    String((article as Record<string, unknown>)._id).replace(/^drafts\./, ''),
  )
  if (articleIds.includes(featuredId)) {
    throw new MissingContentError(
      'Journal articles must exclude the featured Journal Article.',
    )
  }
  const dates = result.articles.map(
    (article) => (article as Record<string, unknown>).publicationDate as string,
  )
  if (dates.some((date, index) => index > 0 && dates[index - 1] < date)) {
    throw new MissingContentError(
      'Journal articles must be ordered by publication date descending.',
    )
  }

  return { ...page, articles: result.articles } as unknown as JournalPage
}

function requireJournalPortableText(value: unknown, field: string) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new MissingContentError(`${field} requires Portable Text content.`)
  }
  value.forEach((block, index) => {
    if (!block || typeof block !== 'object') {
      throw new MissingContentError(`${field}[${index}] is invalid.`)
    }
    const portableBlock = block as Record<string, unknown>
    if (
      portableBlock._type !== 'block' ||
      (portableBlock.style !== undefined &&
        portableBlock.style !== 'normal' &&
        portableBlock.style !== 'h2')
    ) {
      throw new MissingContentError(
        `${field} contains an unsupported Portable Text block.`,
      )
    }
  })
}

export function requireJournalArticleResult(
  value: unknown,
  requestedSlug = 'unknown',
): JournalArticlePage {
  if (!value || typeof value !== 'object') {
    throw new JournalArticleNotFoundError(requestedSlug)
  }
  const result = value as Record<string, unknown>
  if (!result.article || typeof result.article !== 'object') {
    throw new JournalArticleNotFoundError(requestedSlug)
  }
  const article = result.article as Record<string, unknown>
  requireJournalArticleCard(article, 'Journal Article')
  if (!article.author || typeof article.author !== 'object') {
    throw new MissingContentError('Journal Article.author is missing.')
  }
  const author = article.author as Record<string, unknown>
  ;['_id', 'name', 'biography'].forEach((field) =>
    requireString(author, field, 'Journal Article.author'),
  )

  if (!Array.isArray(article.body) || article.body.length === 0) {
    throw new MissingContentError('Journal Article requires body content.')
  }
  let sectionCount = 0
  article.body.forEach((block, index) => {
    if (!block || typeof block !== 'object') {
      throw new MissingContentError(
        `Journal Article body block ${index + 1} is missing.`,
      )
    }
    const bodyBlock = block as Record<string, unknown>
    if (bodyBlock._type === 'journalArticleSection') {
      sectionCount += 1
      requireString(bodyBlock, 'label', `Journal Article.body[${index}]`)
      requireJournalPortableText(
        bodyBlock.content,
        `Journal Article.body[${index}].content`,
      )
      return
    }
    if (bodyBlock._type === 'journalArticlePullQuote') {
      requireString(bodyBlock, 'quote', `Journal Article.body[${index}]`)
      return
    }
    throw new MissingContentError(
      `Journal Article contains unsupported body block: ${String(bodyBlock._type)}`,
    )
  })
  if (sectionCount === 0) {
    throw new MissingContentError(
      'Journal Article requires at least one article section.',
    )
  }

  if (
    !Array.isArray(article.relatedJournalArticles) ||
    article.relatedJournalArticles.length !== 2
  ) {
    throw new MissingContentError(
      'Journal Article requires exactly two related Journal Articles.',
    )
  }
  article.relatedJournalArticles.forEach((related, index) =>
    requireJournalArticleCard(
      related,
      `Journal Article.relatedJournalArticles[${index}]`,
    ),
  )
  const relatedIds = article.relatedJournalArticles.map((related) =>
    String((related as Record<string, unknown>)._id).replace(/^drafts\./, ''),
  )
  if (new Set(relatedIds).size !== relatedIds.length) {
    throw new MissingContentError(
      'Journal Article requires two unique related Journal Articles.',
    )
  }
  if (relatedIds.includes(String(article._id).replace(/^drafts\./, ''))) {
    throw new MissingContentError('A Journal Article cannot relate to itself.')
  }

  return { article: article as unknown as JournalArticle }
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

export async function getAboutPage(
  preview: PreviewState = PUBLIC_PREVIEW_STATE,
): Promise<AboutPage> {
  const { data } = await getContent(preview).loadQuery(ABOUT_PAGE_QUERY)
  return requireAboutPage(data)
}

export async function getContactPage(
  preview: PreviewState = PUBLIC_PREVIEW_STATE,
): Promise<ContactPage> {
  const { data } = await getContent(preview).loadQuery(CONTACT_PAGE_QUERY)
  return requireContactPage(data)
}

export async function getWorkPage(
  preview: PreviewState = PUBLIC_PREVIEW_STATE,
): Promise<WorkPage> {
  const { data } = await getContent(preview).loadQuery(WORK_PAGE_QUERY)
  return requireWorkPage(data)
}

export async function getWorkProjectPage(
  slug: string,
  preview: PreviewState = PUBLIC_PREVIEW_STATE,
): Promise<WorkProjectPage> {
  const { data } = await getContent(preview).loadQuery(WORK_PROJECT_QUERY, {
    slug,
  })
  return requireWorkProjectResult(data, slug)
}

export async function getJournalPage(
  preview: PreviewState = PUBLIC_PREVIEW_STATE,
): Promise<JournalPage> {
  const { data } = await getContent(preview).loadQuery(JOURNAL_PAGE_QUERY)
  return requireJournalPage(data)
}

export async function getJournalArticlePage(
  slug: string,
  preview: PreviewState = PUBLIC_PREVIEW_STATE,
): Promise<JournalArticlePage> {
  const { data } = await getContent(preview).loadQuery(JOURNAL_ARTICLE_QUERY, {
    slug,
  })
  return requireJournalArticleResult(data, slug)
}
