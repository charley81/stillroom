import type { SiteSettings as SiteSettingsSchema } from '../../sanity.types'
import {
  SITE_SETTINGS_DRAFT_ID,
  SITE_SETTINGS_ID,
} from '../../src/sanity/manifests/content'
import { migrationAssetPath } from './migration-assets'
import {
  createMigrationAssets,
  runMigrationCommand,
  writeMigrationDocuments,
  type MigrationClient,
  type ReadMigrationAsset,
} from './migration-runtime'

export { SITE_SETTINGS_DRAFT_ID } from '../../src/sanity/manifests/content'
export const SITE_SETTINGS_PUBLISHED_ID = SITE_SETTINGS_ID
export const SITE_SETTINGS_SOCIAL_IMAGE_PATH = migrationAssetPath(
  'images/368-8150.webp',
)

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
  readAsset,
  publish = false,
}: {
  client: MigrationClient
  socialImagePath: string
  readAsset?: ReadMigrationAsset
  publish?: boolean
}): Promise<SiteSettingsDocument> {
  const assets = createMigrationAssets(client, readAsset)
  const draft = buildSiteSettingsDocument(
    await assets.uploadImage(socialImagePath),
  )

  await writeMigrationDocuments({ client, documents: [draft], publish })

  return draft
}

await runMigrationCommand({
  moduleUrl: import.meta.url,
  migrate: ({ client, publish }) =>
    migrateSiteSettings({
      client,
      socialImagePath: SITE_SETTINGS_SOCIAL_IMAGE_PATH,
      publish,
    }),
  successMessage: ({ dataset, publish }) =>
    `${publish ? `Published ${SITE_SETTINGS_PUBLISHED_ID}` : `Migrated ${SITE_SETTINGS_DRAFT_ID}`} in ${dataset}.`,
})
