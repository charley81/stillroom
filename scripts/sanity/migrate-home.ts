import { createClient } from '@sanity/client'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { basename, extname } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { HomePage as HomePageSchema } from '../../sanity.types'
import { SANITY_API_VERSION } from '../../src/sanity/constants'
import {
  CLIENT_LOGO_IDS,
  HOME_PAGE_DRAFT_ID,
  HOME_PAGE_ID,
  JOURNAL_ARTICLE_IDS,
  SERVICE_IDS,
  WORK_PROJECT_IDS,
} from '../../src/sanity/manifests/content'
import { migrationAssetPath } from './migration-assets'

export {
  HOME_PAGE_DRAFT_ID,
  HOME_PAGE_ID,
} from '../../src/sanity/manifests/content'

interface AssetPaths {
  hero: string
  studio: string
}

export const HOME_ASSET_PATHS: AssetPaths = {
  hero: migrationAssetPath('figma-assets/hospitality-hero.png'),
  studio: migrationAssetPath('images/368-8334.webp'),
}

interface UploadedAssets {
  hero: string
  studio: string
}

type HomePageDocument = Omit<
  HomePageSchema,
  '_createdAt' | '_updatedAt' | '_rev'
>

interface MigrationClient {
  fetch: (query: string, params: { sha1: string }) => Promise<string | null>
  assets: {
    upload: (
      type: 'image',
      body: Buffer,
      options: { filename: string; contentType: string },
    ) => Promise<{ _id: string }>
  }
  createOrReplace: (document: HomePageDocument) => Promise<HomePageDocument>
  transaction: () => {
    createOrReplace: (document: HomePageDocument) => unknown
    delete: (documentId: string) => unknown
    commit: () => Promise<unknown>
  }
}

function reference(id: string, type: string, key = id) {
  return {
    _key: key,
    _type: 'reference' as const,
    _ref: id,
    _weak: true,
    _strengthenOnPublish: { type },
  }
}

function image(assetId: string, alt: string) {
  return {
    _type: 'editorialImage' as const,
    asset: {
      _type: 'image' as const,
      asset: { _type: 'reference' as const, _ref: assetId },
    },
    decorative: false,
    alt,
  }
}

function socialImage(assetId: string) {
  return {
    _type: 'image' as const,
    asset: { _type: 'reference' as const, _ref: assetId },
  }
}

export function buildHomeDocument(assets: UploadedAssets): HomePageDocument {
  return {
    _id: HOME_PAGE_DRAFT_ID,
    _type: 'homePage',
    heroHeading: 'Good places.\nGreat company.',
    heroImage: image(
      assets.hero,
      'Hospitality objects arranged as a Stillroom collage',
    ),
    heroPrimaryCtaLabel: 'Start a Project',
    heroSecondaryCtaLabel: 'View Our Work',
    clientLogos: CLIENT_LOGO_IDS.map(
      (id) =>
        reference(
          id,
          'clientLogo',
          id.replace('client-logo-', ''),
        ) as HomePageDocument['clientLogos'][number],
    ),
    featuredWorkHeading: 'Full of character.',
    featuredWorkProjects: WORK_PROJECT_IDS.slice(0, 2).map(
      (id) =>
        reference(
          id,
          'workProject',
          id.replace('work-project-', ''),
        ) as HomePageDocument['featuredWorkProjects'][number],
    ),
    featuredWorkCtaLabel: 'View Our Work →',
    featuredServices: SERVICE_IDS.map(
      (id) =>
        reference(
          id,
          'service',
          id.replace('service-', ''),
        ) as HomePageDocument['featuredServices'][number],
    ),
    sectorLabels: [
      'Restaurants',
      'Boutique hotels',
      'Cafés & bars',
      'Food & drink',
    ],
    studioHeading: 'Small team.\nPlenty of soul.',
    studioIntroduction:
      'A senior-led team with a shared love of hospitality. We work closely, think clearly, and care about the details.',
    studioImage: image(assets.studio, 'Stillroom studio collage'),
    studioCtaLabel: 'Meet Stillroom →',
    pointOfViewHeading: 'A good brand should feel\nlike a place you belong!',
    pointOfViewCopy:
      'The Stillroom approach / Strategy, identity and digital, together.',
    processHeading: 'Good chemistry.',
    processSteps: [
      {
        _key: 'discover',
        _type: 'processStep',
        title: 'Discover',
        description:
          'Get close to your people,\nyour place and what\nmakes it worth knowing.',
      },
      {
        _key: 'define',
        _type: 'processStep',
        title: 'Define',
        description:
          'Find the idea, the voice\nand the direction that\nfeel distinctly yours.',
      },
      {
        _key: 'create',
        _type: 'processStep',
        title: 'Create',
        description:
          'Bring the brand to life,\nfrom the menu in hand\nto the screen at home.',
      },
      {
        _key: 'launch',
        _type: 'processStep',
        title: 'Launch',
        description:
          'Open with confidence.\nA clear toolkit and\na considered handover.',
      },
    ],
    processCtaLabel: 'Our process →',
    journalHeading: 'Food for thought.',
    featuredJournalArticles: JOURNAL_ARTICLE_IDS.slice(0, 3).map(
      (id) =>
        reference(
          id,
          'journalArticle',
          id.replace('journal-article-', ''),
        ) as HomePageDocument['featuredJournalArticles'][number],
    ),
    journalCtaLabel: 'Read the Journal →',
    finalCtaEyebrow: 'Something good starts with a conversation',
    finalCtaHeading: 'Pull up a chair.',
    finalCtaLabel: 'Start a Project',
    seo: {
      _type: 'seoFields',
      metaTitle: 'Stillroom — Hospitality Branding & Digital Studio',
      metaDescription:
        'Brand strategy, identity and digital experiences for independent hospitality businesses.',
      socialImage: socialImage(assets.hero),
    },
  }
}

function contentType(path: string) {
  switch (extname(path).toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.svg':
      return 'image/svg+xml'
    case '.webp':
      return 'image/webp'
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

function publishedDocument(document: HomePageDocument): HomePageDocument {
  const stripWeak = <Reference extends { _weak?: boolean }>(
    reference: Reference,
  ) => {
    const draftReference = reference as Reference & {
      _strengthenOnPublish?: unknown
    }
    const { _strengthenOnPublish, _weak, ...strongReference } = draftReference
    return strongReference as Reference
  }

  return {
    ...document,
    _id: HOME_PAGE_ID,
    clientLogos: document.clientLogos.map(stripWeak),
    featuredWorkProjects: document.featuredWorkProjects.map(stripWeak),
    featuredServices: document.featuredServices.map(stripWeak),
    featuredJournalArticles: document.featuredJournalArticles.map(stripWeak),
  }
}

export async function migrateHome({
  client,
  assetPaths,
  readAsset = readFile,
  publish = false,
}: {
  client: MigrationClient
  assetPaths: AssetPaths
  readAsset?: (path: string) => Promise<Buffer>
  publish?: boolean
}) {
  const assets = {
    hero: await uploadImageOnce({ client, path: assetPaths.hero, readAsset }),
    studio: await uploadImageOnce({
      client,
      path: assetPaths.studio,
      readAsset,
    }),
  }
  const homePage = buildHomeDocument(assets)

  await client.createOrReplace(homePage)

  if (publish) {
    const transaction = client.transaction()
    transaction.createOrReplace(publishedDocument(homePage))
    transaction.delete(homePage._id)
    await transaction.commit()
  }

  return homePage
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
  await migrateHome({
    client: client as unknown as MigrationClient,
    publish,
    assetPaths: HOME_ASSET_PATHS,
  })

  console.log(
    `${publish ? 'Published' : 'Migrated'} Home content in ${dataset}.`,
  )
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await run()
}
