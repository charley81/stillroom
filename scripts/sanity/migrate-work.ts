import { readFileSync } from 'node:fs'
import {
  SERVICE_IDS,
  WORK_PAGE_DRAFT_ID,
  WORK_PROJECT_IDS,
  WORK_PROJECT_SLUGS,
  draftId,
} from '../../src/sanity/manifests/content'
import { migrationAssetPath } from './migration-assets'
import {
  createMigrationAssets,
  draftReference,
  runMigrationCommand,
  writeMigrationDocuments,
  type MigrationClient,
  type MigrationDocument,
  type ReadMigrationAsset,
} from './migration-runtime'

export {
  WORK_PAGE_DRAFT_ID,
  WORK_PAGE_ID,
  WORK_PROJECT_IDS,
  WORK_PROJECT_SLUGS,
} from '../../src/sanity/manifests/content'

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

const WORK_PAGE_HERO_PATH = '/images/381-1857.webp'

function loadSourceProject(slug: string): SourceProject {
  return JSON.parse(
    readFileSync(
      new URL(`./source/work-projects/${slug}.json`, import.meta.url),
      'utf8',
    ),
  ) as SourceProject
}

const sourceProjects = WORK_PROJECT_SLUGS.map(loadSourceProject)

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
  return draftReference(
    id,
    id.startsWith('service-') ? 'service' : 'workProject',
    key,
  )
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
      _id: draftId(id),
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

export async function migrateWork({
  client,
  readAsset,
  publish = false,
}: {
  client: MigrationClient
  readAsset?: ReadMigrationAsset
  publish?: boolean
}) {
  const assetStore = createMigrationAssets(client, readAsset)
  const assetIds: Record<string, string> = {}
  for (const publicPath of allAssetPaths()) {
    assetIds[publicPath] = await assetStore.uploadImage(
      migrationAssetPath(publicPath),
    )
  }

  const documents = buildWorkDocuments(assetIds)
  const drafts: MigrationDocument[] = [
    ...documents.projects,
    documents.workPage,
  ]

  await writeMigrationDocuments({ client, documents: drafts, publish })

  return documents
}

await runMigrationCommand({
  moduleUrl: import.meta.url,
  migrate: ({ client, publish }) => migrateWork({ client, publish }),
  successMessage: ({ dataset, publish }) =>
    `${publish ? 'Published' : 'Migrated'} Work content in ${dataset}.`,
})
