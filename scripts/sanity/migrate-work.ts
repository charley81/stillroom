import { createClient } from '@sanity/client'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { basename, extname } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  SANITY_API_VERSION,
  WORK_PAGE_DRAFT_ID,
  WORK_PAGE_ID,
} from '../../src/sanity/constants'
import { migrationAssetPath } from './migration-assets'
import { SERVICE_IDS } from './migrate-services-contact'

interface SourceImage {
  src: string
  alt: string
  caption?: string
}

interface SourceProject {
  title: string
  sector: string
  summary: string
  services: string[]
  cardImage: string
  cardAlt: string
  order: number
  tagline: string
  introduction: string
  heroArtwork: SourceImage
  heroImage: SourceImage
  challenge: { heading: string; copy: string }
  contribution: { heading: string; copy: string }
  galleryLabel: string
  gallery: Array<
    | { type: 'image'; image: SourceImage }
    | {
        type: 'pair'
        brandPanel: { title: string; statement: string; label: string }
        image: SourceImage
      }
  >
  outcome: { heading: string; copy: string }
}

interface MigrationDocument {
  _id: string
  _type: string
  [key: string]: unknown
}

interface MigrationClient {
  fetch: (query: string, params: { sha1: string }) => Promise<string | null>
  assets: {
    upload: (
      type: 'image',
      body: Buffer,
      options: { filename: string; contentType: string },
    ) => Promise<{ _id: string }>
  }
  createOrReplace: <Document extends MigrationDocument>(
    document: Document,
  ) => Promise<Document>
  transaction: () => {
    createOrReplace: (document: MigrationDocument) => unknown
    delete: (documentId: string) => unknown
    commit: () => Promise<unknown>
  }
}

const SOURCE_SLUGS = [
  'the-good-table',
  'orlo-house',
  'juniper',
  'fieldwork',
  'the-long-table',
  'morrow',
] as const

export const WORK_PROJECT_SLUGS = [...SOURCE_SLUGS]
export const WORK_PROJECT_IDS = WORK_PROJECT_SLUGS.map(
  (slug) => `work-project-${slug}`,
)
export { WORK_PAGE_DRAFT_ID, WORK_PAGE_ID }

const WORK_PAGE_HERO_PATH = '/images/381-1857.webp'

function loadSourceProject(slug: string): SourceProject {
  return JSON.parse(
    readFileSync(
      new URL(`./source/work-projects/${slug}.json`, import.meta.url),
      'utf8',
    ),
  ) as SourceProject
}

const sourceProjects = SOURCE_SLUGS.map(loadSourceProject)

const serviceAliases = new Map<string, string>([
  ['brand strategy', SERVICE_IDS[0]],
  ['strategy', SERVICE_IDS[0]],
  ['positioning', SERVICE_IDS[0]],
  ['identity', SERVICE_IDS[1]],
  ['visual identity', SERVICE_IDS[1]],
  ['naming', SERVICE_IDS[0]],
  ['digital', SERVICE_IDS[2]],
  ['website', SERVICE_IDS[2]],
  ['art direction', SERVICE_IDS[3]],
  ['packaging', SERVICE_IDS[3]],
  ['menus', SERVICE_IDS[3]],
])

function reference(id: string, key = id) {
  return {
    _key: key,
    _type: 'reference' as const,
    _ref: id,
    _weak: true,
    _strengthenOnPublish: {
      type: id.startsWith('service-') ? 'service' : 'workProject',
    },
  }
}

function editorialImage(assetId: string, source: SourceImage) {
  return {
    _type: 'editorialImage' as const,
    asset: {
      _type: 'image' as const,
      asset: { _type: 'reference' as const, _ref: assetId },
    },
    decorative: false,
    alt: source.alt,
    ...(source.caption ? { caption: source.caption } : {}),
  }
}

function portableText(text: string, key: string) {
  return [
    {
      _key: key,
      _type: 'block' as const,
      style: 'normal',
      markDefs: [],
      children: [
        {
          _key: `${key}-span`,
          _type: 'span' as const,
          marks: [],
          text,
        },
      ],
    },
  ]
}

function requiredAsset(assetIds: Record<string, string>, path: string) {
  const assetId = assetIds[path]
  if (!assetId) throw new Error(`Missing uploaded Work asset: ${path}`)
  return assetId
}

export function buildWorkDocuments(assetIds: Record<string, string>) {
  const projects = sourceProjects.map((source, index) => {
    const slug = WORK_PROJECT_SLUGS[index]
    const id = WORK_PROJECT_IDS[index]
    const services = source.services.map((label) => {
      const serviceId = serviceAliases.get(label.trim().toLowerCase())
      if (!serviceId) {
        throw new Error(`No Service mapping for Work Project label: ${label}`)
      }
      return reference(serviceId, serviceId.replace('service-', ''))
    })

    return {
      _id: `drafts.${id}`,
      _type: 'workProject' as const,
      title: source.title,
      slug: { _type: 'slug' as const, current: slug },
      sectorLabel: source.sector,
      cardSummary: source.summary,
      cardImage: editorialImage(requiredAsset(assetIds, source.cardImage), {
        src: source.cardImage,
        alt: source.cardAlt,
      }),
      services,
      positioningStatement: source.tagline,
      introduction: source.introduction,
      heroArtwork: editorialImage(
        requiredAsset(assetIds, source.heroArtwork.src),
        source.heroArtwork,
      ),
      heroPhotograph: editorialImage(
        requiredAsset(assetIds, source.heroImage.src),
        source.heroImage,
      ),
      challenge: {
        _type: 'narrativeSection' as const,
        heading: source.challenge.heading,
        content: portableText(source.challenge.copy, 'challenge-copy'),
      },
      contribution: {
        _type: 'narrativeSection' as const,
        heading: source.contribution.heading,
        content: portableText(source.contribution.copy, 'contribution-copy'),
      },
      galleryHeading: source.galleryLabel,
      gallery: source.gallery.map((block, galleryIndex) => {
        const key = `gallery-${galleryIndex + 1}`
        if (block.type === 'image') {
          return {
            _key: key,
            _type: 'workProjectGalleryImage' as const,
            image: editorialImage(
              requiredAsset(assetIds, block.image.src),
              block.image,
            ),
          }
        }
        return {
          _key: key,
          _type: 'workProjectGalleryBrandPanel' as const,
          title: block.brandPanel.title,
          statement: block.brandPanel.statement,
          label: block.brandPanel.label,
          image: editorialImage(
            requiredAsset(assetIds, block.image.src),
            block.image,
          ),
        }
      }),
      outcomeHeading: source.outcome.heading,
      outcomeCopy: portableText(source.outcome.copy, 'outcome-copy'),
      seo: {
        _type: 'seoFields' as const,
        metaTitle: `${source.title} — Stillroom`,
        metaDescription: source.summary,
        socialImage: {
          _type: 'image' as const,
          asset: {
            _type: 'reference' as const,
            _ref: requiredAsset(assetIds, source.cardImage),
          },
        },
      },
    }
  })

  const workPage = {
    _id: WORK_PAGE_DRAFT_ID,
    _type: 'workPage' as const,
    heading: 'Places with personality.',
    heroArtwork: editorialImage(requiredAsset(assetIds, WORK_PAGE_HERO_PATH), {
      src: WORK_PAGE_HERO_PATH,
      alt: 'Abstract red Stillroom artwork',
    }),
    workProjects: WORK_PROJECT_IDS.map((id) =>
      reference(id, id.replace('work-project-', '')),
    ),
    finalCtaEyebrow: 'Something good starts with a conversation',
    finalCtaHeading: 'Pull up a chair.',
    finalCtaLabel: 'Start a Project',
    seo: {
      _type: 'seoFields' as const,
      metaTitle: 'Work — Stillroom',
      metaDescription:
        'Selected hospitality branding and digital work by Stillroom.',
      socialImage: {
        _type: 'image' as const,
        asset: {
          _type: 'reference' as const,
          _ref: requiredAsset(assetIds, sourceProjects[0].cardImage),
        },
      },
    },
  }

  return { projects, workPage }
}

function allAssetPaths() {
  const paths = new Set<string>([WORK_PAGE_HERO_PATH])
  for (const project of sourceProjects) {
    paths.add(project.cardImage)
    paths.add(project.heroArtwork.src)
    paths.add(project.heroImage.src)
    project.gallery.forEach((block) => paths.add(block.image.src))
  }
  return [...paths]
}

function contentType(path: string) {
  switch (extname(path).toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.webp':
      return 'image/webp'
    case '.svg':
      return 'image/svg+xml'
    default:
      throw new Error(`Unsupported image type: ${path}`)
  }
}

async function uploadImageOnce({
  client,
  path,
  readAsset,
}: {
  client: MigrationClient
  path: string
  readAsset: (path: string) => Promise<Buffer>
}) {
  const body = await readAsset(path)
  const sha1 = createHash('sha1').update(body).digest('hex')
  const existing = await client.fetch(
    '*[_type == "sanity.imageAsset" && sha1hash == $sha1][0]._id',
    { sha1 },
  )
  if (existing) return existing

  const asset = await client.assets.upload('image', body, {
    filename: basename(path),
    contentType: contentType(path),
  })
  return asset._id
}

function publishedDocument(document: MigrationDocument): MigrationDocument {
  const strengthen = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(strengthen)
    if (!value || typeof value !== 'object') return value

    const source = value as Record<string, unknown>
    return Object.fromEntries(
      Object.entries(source)
        .filter(([key]) => key !== '_weak' && key !== '_strengthenOnPublish')
        .map(([key, child]) => [key, strengthen(child)]),
    )
  }

  return strengthen({
    ...document,
    _id: document._id.replace(/^drafts\./, ''),
  }) as MigrationDocument
}

export async function migrateWork({
  client,
  readAsset = async (path) => readFile(path),
  publish = false,
}: {
  client: MigrationClient
  readAsset?: (path: string) => Promise<Buffer>
  publish?: boolean
}) {
  const assetIds: Record<string, string> = {}
  for (const publicPath of allAssetPaths()) {
    const diskPath = migrationAssetPath(publicPath)
    assetIds[publicPath] = await uploadImageOnce({
      client,
      path: diskPath,
      readAsset,
    })
  }

  const documents = buildWorkDocuments(assetIds)
  const drafts: MigrationDocument[] = [
    ...documents.projects,
    documents.workPage,
  ]

  for (const document of drafts) {
    await client.createOrReplace(document)
  }

  if (publish) {
    const transaction = client.transaction()
    for (const document of drafts) {
      transaction.createOrReplace(publishedDocument(document))
    }
    for (const document of drafts) transaction.delete(document._id)
    await transaction.commit()
  }

  return documents
}

function loadLocalEnvironment() {
  try {
    process.loadEnvFile('.env')
  } catch {
    // CI and production commands provide environment variables directly.
  }
}

async function run() {
  loadLocalEnvironment()

  const projectId = process.env.PUBLIC_SANITY_PROJECT_ID
  const token =
    process.env.SANITY_API_WRITE_TOKEN ?? process.env.SANITY_AUTH_TOKEN
  const dataset = process.env.SANITY_MIGRATION_DATASET ?? 'development'

  if (!projectId || !token) {
    throw new Error(
      'PUBLIC_SANITY_PROJECT_ID and SANITY_API_WRITE_TOKEN are required.',
    )
  }
  if (
    dataset === 'production' &&
    process.env.ALLOW_PRODUCTION_MIGRATION !== 'true'
  ) {
    throw new Error(
      'Production migration is blocked. Set ALLOW_PRODUCTION_MIGRATION=true explicitly.',
    )
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion: SANITY_API_VERSION,
    token,
    useCdn: false,
  })
  const publish = process.argv.includes('--publish')
  await migrateWork({ client: client as unknown as MigrationClient, publish })

  console.log(
    `${publish ? 'Published' : 'Migrated'} Work content in ${dataset}.`,
  )
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await run()
}
