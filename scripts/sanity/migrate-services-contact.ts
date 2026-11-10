import type {
  ContactPage as ContactPageSchema,
  Service as ServiceSchema,
  ServicesPage as ServicesPageSchema,
} from '../../sanity.types'
import {
  CONTACT_PAGE_DRAFT_ID,
  SERVICES_PAGE_DRAFT_ID,
  SERVICE_IDS,
  draftId,
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
  CONTACT_PAGE_DRAFT_ID,
  CONTACT_PAGE_ID,
  SERVICES_PAGE_DRAFT_ID,
  SERVICES_PAGE_ID,
  SERVICE_IDS,
} from '../../src/sanity/manifests/content'

interface AssetPaths {
  hero: string
  hospitality: string
  contact: string
  services: [string, string, string, string]
}

export const SERVICES_CONTACT_ASSET_PATHS: AssetPaths = {
  hero: migrationAssetPath('images/375-1387.webp'),
  hospitality: migrationAssetPath('images/375-1425.webp'),
  contact: migrationAssetPath('images/382-3276.webp'),
  services: [
    migrationAssetPath('figma-assets/service-brand.jpg'),
    migrationAssetPath('figma-assets/service-identity.jpg'),
    migrationAssetPath('figma-assets/service-digital.jpg'),
    migrationAssetPath('figma-assets/service-campaign.jpg'),
  ],
}

interface UploadedAssets {
  hero: string
  hospitality: string
  contact: string
  services: [string, string, string, string]
}

type ServiceDocument = Omit<ServiceSchema, '_createdAt' | '_updatedAt' | '_rev'>
type ServicesPageDocument = Omit<
  ServicesPageSchema,
  '_createdAt' | '_updatedAt' | '_rev'
>
type ContactPageDocument = Omit<
  ContactPageSchema,
  '_createdAt' | '_updatedAt' | '_rev'
>
type MigrationDocument =
  ServiceDocument | ServicesPageDocument | ContactPageDocument

const serviceContent = [
  {
    id: SERVICE_IDS[0],
    title: 'Brand strategy',
    shortSummary: 'Find the idea worth building around.',
    description:
      'Find the idea worth building around. We get close to your people, your place and the things that make your business worth knowing.',
    alt: 'Hands arranging printed hospitality brand strategy materials',
    deliverables: [
      'Discovery & research',
      'Positioning & audience',
      'Brand purpose & personality',
      'Messaging & tone of voice',
      'Brand architecture',
    ],
  },
  {
    id: SERVICE_IDS[1],
    title: 'Visual identity',
    shortSummary: 'A character all your own.',
    description:
      'A character all your own. Distinctive identities with the range to move from a matchbox to a front door, and everywhere in between.',
    alt: 'Hospitality visual identity shown across printed materials',
    deliverables: [
      'Creative & art direction',
      'Logo & identity system',
      'Colour & typography',
      'Menus, signage & packaging',
      'Guidelines & brand toolkit',
    ],
  },
  {
    id: SERVICE_IDS[2],
    title: 'Digital design & development',
    shortSummary: 'An experience before the experience.',
    description:
      'An experience before the experience. Websites that express your character and make the next step feel effortless.',
    alt: 'Hospitality website displayed on a laptop and mobile device',
    deliverables: [
      'Digital strategy & user experience',
      'Website design',
      'Responsive development',
      'Booking & enquiry journeys',
      'CMS setup & handover',
    ],
  },
  {
    id: SERVICE_IDS[3],
    title: 'Campaign & content direction',
    shortSummary: 'Give your story a life beyond the launch.',
    description:
      'Give your story a life beyond the launch. Ideas, images and words that bring the brand into the world with confidence.',
    alt: 'Hospitality campaign photography and editorial materials',
    deliverables: [
      'Campaign & launch concepts',
      'Photography & film direction',
      'Copy & editorial direction',
      'Social & campaign assets',
      'Ongoing creative direction',
    ],
  },
] as const

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

export function buildServicesContactDocuments(assets: UploadedAssets) {
  const services: ServiceDocument[] = serviceContent.map((content, index) => ({
    _id: draftId(content.id),
    _type: 'service',
    title: content.title,
    shortSummary: content.shortSummary,
    description: content.description,
    image: image(assets.services[index], content.alt),
    deliverables: [...content.deliverables],
  }))

  const servicesPage: ServicesPageDocument = {
    _id: SERVICES_PAGE_DRAFT_ID,
    _type: 'servicesPage',
    heroHeading: 'A little\nthinking.',
    heroIntroduction:
      'Brand strategy, identity, websites and campaigns. Thoughtfully connected, built around the world of hospitality.',
    heroImage: image(
      assets.hero,
      'Red folded napkin beside a silver service bell',
    ),
    heroCtaLabel: 'Start a Project',
    services: SERVICE_IDS.map(
      (id) =>
        draftReference(
          id,
          'service',
          id.replace('service-', ''),
        ) as ServicesPageDocument['services'][number],
    ),
    processHeading: 'The whole is\nbetter together.',
    processSteps: [
      {
        _key: 'discover',
        _type: 'processStep',
        title: 'Discover',
        description: 'Get close to your people, your place and your ambitions.',
      },
      {
        _key: 'define',
        _type: 'processStep',
        title: 'Define',
        description: 'Find the direction that feels distinctly yours.',
      },
      {
        _key: 'create',
        _type: 'processStep',
        title: 'Create',
        description: 'Bring the idea to life across identity and experience.',
      },
      {
        _key: 'launch',
        _type: 'processStep',
        title: 'Launch',
        description:
          'Open with confidence, a clear toolkit and a considered handover.',
      },
    ],
    hospitalityHeading: 'For places\nwith character.',
    hospitalitySectorLabels: [
      'Restaurants',
      'Boutique hotels',
      'Cafés & bars',
      'Food & drink',
    ],
    hospitalityPointOfView:
      'The best hospitality brands are built around a feeling. We connect strategy, identity and experience so every detail belongs to the same world.',
    hospitalityImage: image(
      assets.hospitality,
      'Hospitality objects and branded materials arranged together',
    ),
    hospitalityCtaLabel: 'Explore our hospitality concepts',
    finalStatementEyebrow: 'Something good starts here',
    finalStatementHeading: 'Bring it\nall together.',
    seo: {
      _type: 'seoFields',
      metaTitle: 'Services — Stillroom',
      metaDescription:
        'Brand strategy, identity, digital design and campaigns for hospitality.',
      socialImage: socialImage(assets.hero),
    },
  }

  const contactPage: ContactPageDocument = {
    _id: CONTACT_PAGE_DRAFT_ID,
    _type: 'contactPage',
    heading: 'Pull up\na chair.',
    introduction:
      'Every good collaboration starts with a conversation. A few details will help us get to know you.',
    supportingImage: image(
      assets.contact,
      'Stillroom invitation stationery on a textured surface',
    ),
    supportingStatement: 'A little thinking. A lot of possibility.',
    seo: {
      _type: 'seoFields',
      metaTitle: 'Contact — Stillroom',
      metaDescription:
        'Tell Stillroom about your hospitality brand or digital project.',
      socialImage: socialImage(assets.contact),
    },
  }

  return { services, servicesPage, contactPage }
}

export async function migrateServicesContact({
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
  const serviceAssets = [] as string[]
  for (const path of assetPaths.services) {
    serviceAssets.push(await assetStore.uploadImage(path))
  }
  const assets: UploadedAssets = {
    hero: await assetStore.uploadImage(assetPaths.hero),
    hospitality: await assetStore.uploadImage(assetPaths.hospitality),
    contact: await assetStore.uploadImage(assetPaths.contact),
    services: serviceAssets as UploadedAssets['services'],
  }
  const documents = buildServicesContactDocuments(assets)
  const drafts: MigrationDocument[] = [
    ...documents.services,
    documents.servicesPage,
    documents.contactPage,
  ]

  await writeMigrationDocuments({ client, documents: drafts, publish })

  return documents
}

await runMigrationCommand({
  moduleUrl: import.meta.url,
  migrate: ({ client, publish }) =>
    migrateServicesContact({
      client,
      publish,
      assetPaths: SERVICES_CONTACT_ASSET_PATHS,
    }),
  successMessage: ({ dataset, publish }) =>
    `${publish ? 'Published' : 'Migrated'} Services and Contact content in ${dataset}.`,
})
