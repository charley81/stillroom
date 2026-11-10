import type { HOME_PAGE_QUERY_RESULT } from '../../../sanity.types'
import { HOME_PAGE_QUERY } from '../queries/home'
import type { ContentQueryClient } from './client'
import { MissingContentError } from './errors'
import { requireJournalArticleCard, type JournalArticleCard } from './journal'
import {
  cleanDocumentId,
  hasUniqueStrings,
  requireClientLogos,
  requireContentImage,
  requireString,
  type ClientLogo,
  type ContentImage,
} from './validation'
import { requireWorkProjectCard, type WorkProjectCard } from './work'

type GeneratedHomePage = NonNullable<HOME_PAGE_QUERY_RESULT>

export type HomePage = Omit<
  GeneratedHomePage,
  | 'heroImage'
  | 'studioImage'
  | 'clientLogos'
  | 'featuredWorkProjects'
  | 'featuredJournalArticles'
> & {
  heroImage: ContentImage
  studioImage: ContentImage
  clientLogos: ClientLogo[]
  featuredWorkProjects: WorkProjectCard[]
  featuredJournalArticles: JournalArticleCard[]
}

export function requireHomePage(value: unknown): HomePage {
  if (!value || typeof value !== 'object') {
    throw new MissingContentError(
      'Required Home document "homePage" was not found in Sanity content.',
    )
  }

  const page = value as Record<string, unknown>
  ;[
    'heroHeading',
    'heroPrimaryCtaLabel',
    'heroSecondaryCtaLabel',
    'featuredWorkHeading',
    'featuredWorkCtaLabel',
    'studioHeading',
    'studioIntroduction',
    'studioCtaLabel',
    'pointOfViewHeading',
    'pointOfViewCopy',
    'processHeading',
    'processCtaLabel',
    'journalHeading',
    'journalCtaLabel',
    'finalCtaEyebrow',
    'finalCtaHeading',
    'finalCtaLabel',
  ].forEach((field) => requireString(page, field, 'Home'))
  requireContentImage(page.heroImage, 'heroImage')
  requireContentImage(page.studioImage, 'studioImage')

  requireClientLogos(page.clientLogos, {
    scope: 'Home',
    count: 5,
    countLabel: 'five',
  })

  const workProjects = page.featuredWorkProjects
  if (!Array.isArray(workProjects) || workProjects.length !== 2) {
    throw new MissingContentError(
      'Home requires exactly two featured Work Project references.',
    )
  }
  workProjects.forEach((project, index) =>
    requireWorkProjectCard(project, `Home.featuredWorkProjects[${index}]`),
  )
  const workProjectIds = workProjects.map((project) =>
    cleanDocumentId(String((project as Record<string, unknown>)._id)),
  )
  if (new Set(workProjectIds).size !== workProjects.length) {
    throw new MissingContentError(
      'Home requires two unique featured Work Project references.',
    )
  }

  const services = page.featuredServices
  if (!Array.isArray(services) || services.length !== 4) {
    throw new MissingContentError(
      'Home requires exactly four featured Service references.',
    )
  }
  const serviceIds = services.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new MissingContentError(
        `Home is missing featuredServices[${index}].`,
      )
    }
    const service = item as Record<string, unknown>
    ;['_id', 'title', 'shortSummary'].forEach((field) =>
      requireString(service, field, `Home featuredServices[${index}]`),
    )
    return cleanDocumentId(String(service._id))
  })
  if (new Set(serviceIds).size !== services.length) {
    throw new MissingContentError(
      'Home requires four unique featured Service references.',
    )
  }

  const sectors = page.sectorLabels
  if (
    !Array.isArray(sectors) ||
    sectors.length !== 4 ||
    sectors.some((sector) => typeof sector !== 'string') ||
    !hasUniqueStrings(sectors as string[])
  ) {
    throw new MissingContentError(
      'Home requires exactly four unique sector labels.',
    )
  }

  const processSteps = page.processSteps
  if (!Array.isArray(processSteps) || processSteps.length !== 4) {
    throw new MissingContentError('Home requires exactly four process steps.')
  }
  processSteps.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new MissingContentError(`Home is missing processSteps[${index}].`)
    }
    const step = item as Record<string, unknown>
    ;['title', 'description'].forEach((field) =>
      requireString(step, field, `Home processSteps[${index}]`),
    )
  })

  const journalArticles = page.featuredJournalArticles
  if (!Array.isArray(journalArticles) || journalArticles.length !== 3) {
    throw new MissingContentError(
      'Home requires exactly three featured Journal Article references.',
    )
  }
  journalArticles.forEach((article, index) =>
    requireJournalArticleCard(
      article,
      `Home.featuredJournalArticles[${index}]`,
    ),
  )
  const journalArticleIds = journalArticles.map((article) =>
    cleanDocumentId(String((article as Record<string, unknown>)._id)),
  )
  if (new Set(journalArticleIds).size !== journalArticles.length) {
    throw new MissingContentError(
      'Home requires three unique featured Journal Article references.',
    )
  }

  return value as HomePage
}

export async function loadHomePage(
  content: ContentQueryClient,
): Promise<HomePage> {
  const { data } = await content.loadQuery(HOME_PAGE_QUERY)
  return requireHomePage(data)
}
