import { createClient } from '@sanity/client'
import { pathToFileURL } from 'node:url'
import {
  requireAboutPage,
  requireContactPage,
  requireHomePage,
  requireJournalArticleResult,
  requireJournalPage,
  requireServicesPage,
  requireSiteSettings,
  requireWorkPage,
  requireWorkProjectResult,
} from '../../src/sanity/content'
import {
  ABOUT_PAGE_ID,
  CONTACT_PAGE_ID,
  HOME_PAGE_ID,
  JOURNAL_PAGE_ID,
  SANITY_API_VERSION,
  SERVICES_PAGE_ID,
  SITE_SETTINGS_ID,
  WORK_PAGE_ID,
} from '../../src/sanity/constants'
import { ABOUT_PAGE_QUERY } from '../../src/sanity/queries/about'
import { HOME_PAGE_QUERY } from '../../src/sanity/queries/home'
import {
  JOURNAL_ARTICLE_QUERY,
  JOURNAL_PAGE_QUERY,
} from '../../src/sanity/queries/journal'
import {
  CONTACT_PAGE_QUERY,
  SERVICES_PAGE_QUERY,
} from '../../src/sanity/queries/services-contact'
import { SITE_SETTINGS_QUERY } from '../../src/sanity/queries/site-settings'
import {
  WORK_PAGE_QUERY,
  WORK_PROJECT_QUERY,
} from '../../src/sanity/queries/work'
import { CLIENT_LOGO_IDS } from './migrate-about'
import {
  AUTHOR_IDS,
  JOURNAL_ARTICLE_IDS,
  JOURNAL_ARTICLE_SLUGS,
  JOURNAL_CATEGORY_IDS,
} from './migrate-journal'
import { SERVICE_IDS } from './migrate-services-contact'
import { WORK_PROJECT_IDS, WORK_PROJECT_SLUGS } from './migrate-work'

const SINGLETONS = [
  [SITE_SETTINGS_ID, 'siteSettings'],
  [HOME_PAGE_ID, 'homePage'],
  [WORK_PAGE_ID, 'workPage'],
  [SERVICES_PAGE_ID, 'servicesPage'],
  [ABOUT_PAGE_ID, 'aboutPage'],
  [JOURNAL_PAGE_ID, 'journalPage'],
  [CONTACT_PAGE_ID, 'contactPage'],
] as const

export const EXPECTED_CUTOVER_DOCUMENTS = [
  ...SINGLETONS.map(([id, type]) => ({ id, type })),
  ...SERVICE_IDS.map((id) => ({ id, type: 'service' })),
  ...CLIENT_LOGO_IDS.map((id) => ({ id, type: 'clientLogo' })),
  ...WORK_PROJECT_IDS.map((id) => ({ id, type: 'workProject' })),
  ...AUTHOR_IDS.map((id) => ({ id, type: 'author' })),
  ...JOURNAL_CATEGORY_IDS.map((id) => ({ id, type: 'journalCategory' })),
  ...JOURNAL_ARTICLE_IDS.map((id) => ({ id, type: 'journalArticle' })),
]

interface InventoryDocument {
  _id: string
  _type: string
}

export type CutoverPerspective = 'drafts' | 'published'

export function assertCutoverInventory(
  documents: InventoryDocument[],
  perspective: CutoverPerspective = 'published',
) {
  const expectedById = new Map(
    EXPECTED_CUTOVER_DOCUMENTS.map((document) => [document.id, document.type]),
  )
  const expectedPrefix = perspective === 'drafts' ? 'drafts.' : ''
  const documentState = perspective === 'drafts' ? 'draft' : 'published'
  const selected = new Map(
    documents
      .filter(({ _id }) =>
        perspective === 'drafts'
          ? _id.startsWith('drafts.')
          : !_id.startsWith('drafts.'),
      )
      .map(({ _id, _type }) => [_id, _type]),
  )
  const errors: string[] = []

  for (const { id, type } of EXPECTED_CUTOVER_DOCUMENTS) {
    const expectedId = `${expectedPrefix}${id}`
    const actualType = selected.get(expectedId)
    if (!actualType) {
      errors.push(`Missing ${documentState} document: ${expectedId}`)
    } else if (actualType !== type) {
      errors.push(
        `Document ${expectedId} has type ${actualType}; expected ${type}`,
      )
    }
  }

  const unexpected = documents
    .filter(({ _id }) => !expectedById.has(_id.replace(/^drafts\./, '')))
    .map(({ _id }) => `Unexpected cutover document: ${_id}`)
  const leftoverDrafts =
    perspective === 'published'
      ? documents
          .filter(
            ({ _id }) =>
              _id.startsWith('drafts.') &&
              expectedById.has(_id.replace(/^drafts\./, '')),
          )
          .map(({ _id }) => `Leftover migration draft: ${_id}`)
      : []

  errors.push(...unexpected, ...leftoverDrafts)
  if (errors.length > 0) throw new Error(errors.join('\n'))
}

function cleanId(id: string) {
  return id.replace(/^drafts\./, '')
}

function assertSameIds(
  label: string,
  actual: readonly string[],
  expected: readonly string[],
) {
  const actualIds = [...new Set(actual.map(cleanId))].sort()
  const expectedIds = [...new Set(expected.map(cleanId))].sort()
  if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
    throw new Error(
      `${label} references ${actualIds.join(', ')}; expected ${expectedIds.join(', ')}.`,
    )
  }
}

function loadLocalEnvironment() {
  try {
    process.loadEnvFile('.env')
  } catch {
    // CI and production commands provide environment variables directly.
  }
}

export async function validateCutoverDataset({
  client,
  dataset,
  perspective = 'published',
}: {
  client: ReturnType<typeof createClient>
  dataset: string
  perspective?: CutoverPerspective
}) {
  const contentTypes = [
    ...new Set(EXPECTED_CUTOVER_DOCUMENTS.map(({ type }) => type)),
  ]
  const inventory = await client.fetch<InventoryDocument[]>(
    '*[_type in $types]{_id, _type}',
    { types: contentTypes },
    { perspective: 'raw' },
  )
  assertCutoverInventory(inventory, perspective)

  const perspectiveClient = client.withConfig({ perspective })
  const [siteSettings, home, services, contact, about, work, journal] =
    await Promise.all([
      perspectiveClient.fetch(SITE_SETTINGS_QUERY).then(requireSiteSettings),
      perspectiveClient.fetch(HOME_PAGE_QUERY).then(requireHomePage),
      perspectiveClient.fetch(SERVICES_PAGE_QUERY).then(requireServicesPage),
      perspectiveClient.fetch(CONTACT_PAGE_QUERY).then(requireContactPage),
      perspectiveClient.fetch(ABOUT_PAGE_QUERY).then(requireAboutPage),
      perspectiveClient.fetch(WORK_PAGE_QUERY).then(requireWorkPage),
      perspectiveClient.fetch(JOURNAL_PAGE_QUERY).then(requireJournalPage),
    ])

  await Promise.all(
    WORK_PROJECT_SLUGS.map(async (slug) =>
      requireWorkProjectResult(
        await perspectiveClient.fetch(WORK_PROJECT_QUERY, { slug }),
        slug,
      ),
    ),
  )
  await Promise.all(
    JOURNAL_ARTICLE_SLUGS.map(async (slug) =>
      requireJournalArticleResult(
        await perspectiveClient.fetch(JOURNAL_ARTICLE_QUERY, { slug }),
        slug,
      ),
    ),
  )

  assertSameIds(
    'Home featured Services',
    home.featuredServices.map(({ _id }) => _id),
    services.services.map(({ _id }) => _id),
  )
  assertSameIds(
    'Home Client Logos',
    home.clientLogos.map(({ _id }) => _id),
    CLIENT_LOGO_IDS,
  )
  assertSameIds(
    'About Client Logos',
    about.clientLogos.map(({ _id }) => _id),
    CLIENT_LOGO_IDS,
  )
  assertSameIds(
    'Work Project routes',
    work.workProjects.map(({ _id }) => _id),
    WORK_PROJECT_IDS,
  )
  assertSameIds(
    'Journal Article routes',
    [journal.featuredJournalArticle, ...journal.articles].map(({ _id }) => _id),
    JOURNAL_ARTICLE_IDS,
  )

  console.log(
    `Validated ${EXPECTED_CUTOVER_DOCUMENTS.length} ${perspective} content documents in ${dataset}.`,
  )
  console.log(
    `Site Settings: ${siteSettings._id}; Contact options: ${contact.serviceOptions.length}.`,
  )
}

async function run() {
  loadLocalEnvironment()

  const projectId = process.env.PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.SANITY_MIGRATION_DATASET ?? 'development'
  const token = process.env.SANITY_API_READ_TOKEN
  const perspective = process.env.SANITY_VALIDATION_PERSPECTIVE ?? 'published'

  if (!projectId) throw new Error('PUBLIC_SANITY_PROJECT_ID is required.')
  if (perspective !== 'drafts' && perspective !== 'published') {
    throw new Error(
      'SANITY_VALIDATION_PERSPECTIVE must be drafts or published.',
    )
  }
  if (
    dataset === 'production' &&
    process.env.ALLOW_PRODUCTION_VALIDATION !== 'true'
  ) {
    throw new Error(
      'Production validation is blocked. Set ALLOW_PRODUCTION_VALIDATION=true explicitly.',
    )
  }

  await validateCutoverDataset({
    client: createClient({
      projectId,
      dataset,
      apiVersion: SANITY_API_VERSION,
      token,
      useCdn: false,
    }),
    dataset,
    perspective,
  })
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await run()
}
