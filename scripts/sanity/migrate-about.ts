import { createClient } from '@sanity/client'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { basename, extname } from 'node:path'
import { pathToFileURL } from 'node:url'
import type {
  AboutPage as AboutPageSchema,
  ClientLogo as ClientLogoSchema,
  ConstrainedRichText,
} from '../../sanity.types'
import {
  ABOUT_PAGE_DRAFT_ID,
  ABOUT_PAGE_ID,
  SANITY_API_VERSION,
} from '../../src/sanity/constants'
import { migrationAssetPath } from './migration-assets'

export const CLIENT_LOGO_IDS = [
  'client-logo-orlo-house',
  'client-logo-juniper',
  'client-logo-fieldwork',
  'client-logo-the-long-table',
  'client-logo-morrow',
] as const
export { ABOUT_PAGE_DRAFT_ID, ABOUT_PAGE_ID }

interface AssetPaths {
  hero: string
  founder: string
  team: [string, string, string]
  clientLogos: [string, string, string, string, string]
}

export const ABOUT_ASSET_PATHS: AssetPaths = {
  hero: migrationAssetPath('images/387-3526.webp'),
  founder: migrationAssetPath('images/387-3529.webp'),
  team: [
    migrationAssetPath('figma-assets/alex-morgan.png'),
    migrationAssetPath('figma-assets/maya-chen.png'),
    migrationAssetPath('figma-assets/sam-rivera.png'),
  ],
  clientLogos: [
    migrationAssetPath('figma-assets/client-logos/orlo-house.svg'),
    migrationAssetPath('figma-assets/client-logos/juniper.svg'),
    migrationAssetPath('figma-assets/client-logos/fieldwork.svg'),
    migrationAssetPath('figma-assets/client-logos/the-long-table.svg'),
    migrationAssetPath('figma-assets/client-logos/morrow.svg'),
  ],
}

interface UploadedAssets {
  hero: string
  founder: string
  team: [string, string, string]
  clientLogos: [string, string, string, string, string]
}

type ClientLogoDocument = Omit<
  ClientLogoSchema,
  '_createdAt' | '_updatedAt' | '_rev'
>
type AboutPageDocument = Omit<
  AboutPageSchema,
  '_createdAt' | '_updatedAt' | '_rev'
>
type MigrationDocument = ClientLogoDocument | AboutPageDocument

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

const clientNames = [
  'Orlo House',
  'Juniper',
  'Fieldwork',
  'The Long Table',
  'Morrow',
] as const

const team = [
  {
    key: 'alex-morgan',
    name: 'Alex Morgan',
    role: 'Founder / Creative direction',
    biography:
      'Alex brings a love of hospitality and a clear creative point of view to the studio, guiding every project from first conversation to final detail.',
    alt: 'Alex Morgan, Stillroom founder and creative director',
  },
  {
    key: 'maya-chen',
    name: 'Maya Chen',
    role: 'Strategy / Design',
    biography:
      'Maya connects the story to the system, finding what makes a place distinctive and shaping identities with warmth, clarity and character.',
    alt: 'Maya Chen, Stillroom strategist and designer',
  },
  {
    key: 'sam-rivera',
    name: 'Sam Rivera',
    role: 'Digital / Collaboration',
    biography:
      'Sam brings brands to life online, pairing thoughtful design with intuitive digital experiences that make every interaction feel considered.',
    alt: 'Sam Rivera, Stillroom digital designer and collaborator',
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

function logo(assetId: string) {
  return {
    _type: 'image' as const,
    asset: { _type: 'reference' as const, _ref: assetId },
  }
}

function socialImage(assetId: string) {
  return {
    _type: 'image' as const,
    asset: { _type: 'reference' as const, _ref: assetId },
  }
}

function richText(paragraphs: string[]): ConstrainedRichText {
  return paragraphs.map((text, index) => ({
    _key: `paragraph-${index + 1}`,
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [
      {
        _key: `paragraph-${index + 1}-span`,
        _type: 'span',
        marks: [],
        text,
      },
    ],
  }))
}

export function buildAboutDocuments(assets: UploadedAssets) {
  const clientLogos: ClientLogoDocument[] = CLIENT_LOGO_IDS.map(
    (id, index) => ({
      _id: `drafts.${id}`,
      _type: 'clientLogo',
      clientName: clientNames[index],
      logo: logo(assets.clientLogos[index]),
    }),
  )

  const aboutPage: AboutPageDocument = {
    _id: ABOUT_PAGE_DRAFT_ID,
    _type: 'aboutPage',
    heading: 'Small team.\nPlenty of soul.',
    heroImage: image(assets.hero, 'Stillroom table collage'),
    founderHeading: 'It starts\nwith a feeling.',
    founderStory: richText([
      'The places we remember are rarely just about what’s on the menu. They’re about a feeling: the welcome, the atmosphere, the details that make somewhere its own.',
      'Stillroom brings that same thoughtfulness to branding. A small, senior-led studio with a shared love of hospitality, working closely with people who care deeply about what they do.',
    ]),
    founderName: 'Alex Morgan',
    founderRole: 'Founder & Creative Director',
    founderImage: image(assets.founder, 'Stillroom studio collage'),
    teamHeading: 'Good company.',
    teamIntroduction:
      'A close-knit team, with the right collaborators around the table. Strategy, design and digital working together from the start.',
    teamMembers: team.map((profile, index) => ({
      _key: profile.key,
      _type: 'teamProfile',
      name: profile.name,
      role: profile.role,
      biography: profile.biography,
      portrait: image(assets.team[index], profile.alt),
    })),
    principlesHeading: 'Good work.\nGood chemistry.',
    principles: [
      {
        _key: 'character-over-convention',
        _type: 'workingPrinciple',
        title: 'Character\nover convention.',
        description:
          'Every place has something that makes it different. We find it, sharpen it, and make sure it comes through in everything.',
      },
      {
        _key: 'closer-is-better',
        _type: 'workingPrinciple',
        title: 'Closer is\nbetter.',
        description:
          'You work directly with the people doing the work. Open conversations, shared curiosity and a genuine seat at the table.',
      },
      {
        _key: 'care-in-every-detail',
        _type: 'workingPrinciple',
        title: 'Care in\nevery detail.',
        description:
          'From the first idea to the final touchpoint, we make things that feel considered, connected and unmistakably yours.',
      },
    ],
    clientProofHeading: 'Made for people\nwho care.',
    clientProofCopy:
      'Restaurants, hotels, cafés and food & drink brands. Different worlds, united by a belief that the details matter.',
    clientLogos: CLIENT_LOGO_IDS.map(
      (id) =>
        ({
          _key: id.replace('client-logo-', ''),
          _type: 'reference',
          _ref: id,
          _weak: true,
          _strengthenOnPublish: { type: 'clientLogo' },
        }) as AboutPageDocument['clientLogos'][number],
    ),
    clientProofCtaLabel: 'Explore our work →',
    finalCtaEyebrow: 'Good people. Good projects. Let’s meet.',
    finalCtaHeading: 'Pull up a chair.',
    finalCtaLabel: 'Start a Project',
    seo: {
      _type: 'seoFields',
      metaTitle: 'About — Stillroom',
      metaDescription:
        'Meet Stillroom, a small independent creative studio with plenty of soul.',
      socialImage: socialImage(assets.hero),
    },
  }

  return { clientLogos, aboutPage }
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

function publishedDocument(document: MigrationDocument): MigrationDocument {
  const published = { ...document, _id: document._id.replace(/^drafts\./, '') }
  if (published._type === 'aboutPage') {
    return {
      ...published,
      clientLogos: published.clientLogos.map((reference) => {
        const draftReference = reference as typeof reference & {
          _strengthenOnPublish?: unknown
        }
        const { _strengthenOnPublish, _weak, ...strongReference } =
          draftReference
        return strongReference
      }),
    }
  }
  return published
}

export async function migrateAbout({
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
  const teamAssets = [] as string[]
  for (const path of assetPaths.team) {
    teamAssets.push(await uploadImageOnce({ client, path, readAsset }))
  }
  const logoAssets = [] as string[]
  for (const path of assetPaths.clientLogos) {
    logoAssets.push(await uploadImageOnce({ client, path, readAsset }))
  }
  const assets: UploadedAssets = {
    hero: await uploadImageOnce({ client, path: assetPaths.hero, readAsset }),
    founder: await uploadImageOnce({
      client,
      path: assetPaths.founder,
      readAsset,
    }),
    team: teamAssets as UploadedAssets['team'],
    clientLogos: logoAssets as UploadedAssets['clientLogos'],
  }
  const documents = buildAboutDocuments(assets)
  const drafts: MigrationDocument[] = [
    ...documents.clientLogos,
    documents.aboutPage,
  ]

  for (const document of drafts) {
    await client.createOrReplace(document)
  }

  if (publish) {
    const transaction = client.transaction()
    for (const document of drafts) {
      transaction.createOrReplace(publishedDocument(document))
    }
    for (const document of drafts) {
      transaction.delete(document._id)
    }
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
  await migrateAbout({
    client: client as unknown as MigrationClient,
    publish,
    assetPaths: ABOUT_ASSET_PATHS,
  })

  console.log(
    `${publish ? 'Published' : 'Migrated'} About and Client Logo content in ${dataset}.`,
  )
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await run()
}
