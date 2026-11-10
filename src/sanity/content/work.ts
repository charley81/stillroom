import type {
  WORK_PAGE_QUERY_RESULT,
  WORK_PROJECT_QUERY_RESULT,
} from '../../../sanity.types'
import { PUBLIC_PREVIEW_STATE, type PreviewState } from '../preview'
import { WORK_PAGE_QUERY, WORK_PROJECT_QUERY } from '../queries/work'
import { loadContentQuery } from './client'
import { MissingContentError } from './errors'
import {
  requireContentImage,
  requireString,
  type ContentImage,
} from './validation'

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

export class WorkProjectNotFoundError extends MissingContentError {
  constructor(slug: string) {
    super(`Work Project not found for slug: ${slug}`)
    this.name = 'WorkProjectNotFoundError'
  }
}

export function requireWorkProjectCard(value: unknown, scope: string) {
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

export async function getWorkPage(
  preview: PreviewState = PUBLIC_PREVIEW_STATE,
): Promise<WorkPage> {
  const { data } = await loadContentQuery(WORK_PAGE_QUERY, preview)
  return requireWorkPage(data)
}

export async function getWorkProjectPage(
  slug: string,
  preview: PreviewState = PUBLIC_PREVIEW_STATE,
): Promise<WorkProjectPage> {
  const { data } = await loadContentQuery(WORK_PROJECT_QUERY, preview, { slug })
  return requireWorkProjectResult(data, slug)
}
