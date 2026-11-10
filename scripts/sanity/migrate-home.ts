import type { HomePage as HomePageSchema } from '../../sanity.types'
import {
  CLIENT_LOGO_IDS,
  HOME_PAGE_DRAFT_ID,
  JOURNAL_ARTICLE_IDS,
  SERVICE_IDS,
  WORK_PROJECT_IDS,
} from '../../src/sanity/manifests/content'
import { migrationAssetPath } from './migration-assets'
import {
  createMigrationAssets,
  draftReference,
  runMigrationCommand,
  writeMigrationDocuments,
  type MigrationClient,
  type ReadMigrationAsset,
} from './migration-runtime'

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
        draftReference(
          id,
          'clientLogo',
          id.replace('client-logo-', ''),
        ) as HomePageDocument['clientLogos'][number],
    ),
    featuredWorkHeading: 'Full of character.',
    featuredWorkProjects: WORK_PROJECT_IDS.slice(0, 2).map(
      (id) =>
        draftReference(
          id,
          'workProject',
          id.replace('work-project-', ''),
        ) as HomePageDocument['featuredWorkProjects'][number],
    ),
    featuredWorkCtaLabel: 'View Our Work →',
    featuredServices: SERVICE_IDS.map(
      (id) =>
        draftReference(
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
        draftReference(
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

export async function migrateHome({
  client,
  assetPaths,
  readAsset,
  publish = false,
}: {
  client: MigrationClient
  assetPaths: AssetPaths
  readAsset?: ReadMigrationAsset
  publish?: boolean
}) {
  const assetStore = createMigrationAssets(client, readAsset)
  const assets = {
    hero: await assetStore.uploadImage(assetPaths.hero),
    studio: await assetStore.uploadImage(assetPaths.studio),
  }
  const homePage = buildHomeDocument(assets)

  await writeMigrationDocuments({ client, documents: [homePage], publish })

  return homePage
}

await runMigrationCommand({
  moduleUrl: import.meta.url,
  migrate: ({ client, publish }) =>
    migrateHome({
      client,
      publish,
      assetPaths: HOME_ASSET_PATHS,
    }),
  successMessage: ({ dataset, publish }) =>
    `${publish ? 'Published' : 'Migrated'} Home content in ${dataset}.`,
})
