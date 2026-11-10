import { createClient } from '@sanity/client'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { SiteSettings as SiteSettingsSchema } from '../../sanity.types'
import { SANITY_API_VERSION } from '../../src/sanity/constants'
import {
  SITE_SETTINGS_DRAFT_ID,
  SITE_SETTINGS_ID,
} from '../../src/sanity/manifests/content'
import { migrationAssetPath } from './migration-assets'

export { SITE_SETTINGS_DRAFT_ID } from '../../src/sanity/manifests/content'
export const SITE_SETTINGS_PUBLISHED_ID = SITE_SETTINGS_ID
export const SITE_SETTINGS_SOCIAL_IMAGE_PATH = migrationAssetPath(
  'images/368-8150.webp',
)

interface MigrationClient {
  fetch: (query: string, params: { sha1: string }) => Promise<string | null>
  assets: {
    upload: (
      type: 'image',
      body: Buffer,
      options: { filename: string; contentType: string },
    ) => Promise<{ _id: string }>
  }
  createOrReplace: <Document>(document: Document) => Promise<Document>
  transaction: () => {
    createOrReplace: (document: SiteSettingsDocument) => unknown
    delete: (documentId: string) => unknown
    commit: () => Promise<unknown>
  }
}

type SiteSettingsDocument = Omit<
  SiteSettingsSchema,
  '_createdAt' | '_updatedAt' | '_rev'
>

export function buildSiteSettingsDocument(
  imageAssetId: string,
): SiteSettingsDocument {
  return {
    _id: SITE_SETTINGS_DRAFT_ID,
    _type: 'siteSettings',
    studioName: 'Stillroom',
    registeredMarkText: 'stillroom®',
    homeLabel: 'Home',
    workLabel: 'Work',
    servicesLabel: 'Services',
    aboutLabel: 'About',
    journalLabel: 'Journal',
    contactLabel: 'Contact',
    headerCtaLabel: 'Start a Project',
    emailAddress: 'hello@stillroom.studio',
    socialLinks: [
      {
        _key: 'instagram',
        _type: 'socialLink',
        platform: 'Instagram',
        url: 'https://www.instagram.com/stillroom.studio/',
      },
      {
        _key: 'linkedin',
        _type: 'socialLink',
        platform: 'LinkedIn',
        url: 'https://www.linkedin.com/company/stillroom-studio/',
      },
    ],
    newsletterHeading: 'Good things, every so often.',
    newsletterDescription: 'Ideas on hospitality, culture, and design.',
    footerTagline: 'Independent by nature.',
    defaultSeoTitle: 'Stillroom — Brand & Digital for Hospitality',
    defaultSeoDescription:
      'An independent creative studio for hospitality, food, and the places that bring people together.',
    defaultSocialImage: {
      _type: 'editorialImage',
      asset: {
        _type: 'image',
        asset: { _type: 'reference', _ref: imageAssetId },
      },
      decorative: false,
      alt: 'Hospitality objects arranged as a Stillroom collage',
    },
  }
}

export async function migrateSiteSettings({
  client,
  socialImagePath,
  readAsset = readFile,
  publish = false,
}: {
  client: MigrationClient
  socialImagePath: string
  readAsset?: (path: string) => Promise<Buffer>
  publish?: boolean
}): Promise<SiteSettingsDocument> {
  const image = await readAsset(socialImagePath)
  const sha1 = createHash('sha1').update(image).digest('hex')
  const existingAssetId = await client.fetch(
    '*[_type == "sanity.imageAsset" && sha1hash == $sha1][0]._id',
    { sha1 },
  )
  const assetId =
    existingAssetId ??
    (
      await client.assets.upload('image', image, {
        filename: basename(socialImagePath),
        contentType: 'image/webp',
      })
    )._id
  const draft = buildSiteSettingsDocument(assetId)

  await client.createOrReplace(draft)

  if (publish) {
    const published = { ...draft, _id: SITE_SETTINGS_PUBLISHED_ID }
    const transaction = client.transaction()
    transaction.createOrReplace(published)
    transaction.delete(SITE_SETTINGS_DRAFT_ID)
    await transaction.commit()
  }

  return draft
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
  const draft = await migrateSiteSettings({
    client,
    socialImagePath: SITE_SETTINGS_SOCIAL_IMAGE_PATH,
    publish,
  })

  console.log(
    `${publish ? `Published ${SITE_SETTINGS_PUBLISHED_ID}` : `Migrated ${draft._id}`} in ${dataset}.`,
  )
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await run()
}
