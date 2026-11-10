import type { ABOUT_PAGE_QUERY_RESULT } from '../../../sanity.types'
import { ABOUT_PAGE_QUERY } from '../queries/about'
import type { ContentQueryClient } from './client'
import { MissingContentError } from './errors'
import {
  requireClientLogos,
  requireContentImage,
  requireString,
  type ClientLogo,
  type ContentImage,
} from './validation'

type GeneratedAboutPage = NonNullable<ABOUT_PAGE_QUERY_RESULT>
type GeneratedTeamProfile = GeneratedAboutPage['teamMembers'][number]

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

  requireClientLogos(page.clientLogos, {
    scope: 'About',
    count: 5,
    countLabel: 'five',
  })

  return value as AboutPage
}

export async function loadAboutPage(
  content: ContentQueryClient,
): Promise<AboutPage> {
  const { data } = await content.loadQuery(ABOUT_PAGE_QUERY)
  return requireAboutPage(data)
}
