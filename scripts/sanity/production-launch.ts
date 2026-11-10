import { createClient } from '@sanity/client'
import { execFile } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { pathToFileURL } from 'node:url'
import {
  ABOUT_PAGE_ID,
  CONTACT_PAGE_ID,
  HOME_PAGE_ID,
  JOURNAL_PAGE_ID,
  SERVICES_PAGE_ID,
  SITE_SETTINGS_ID,
  WORK_PAGE_ID,
  SANITY_API_VERSION,
} from '../../src/sanity/constants'
import { compareCutoverDatasets } from './compare-datasets'
import { exportDatasetBackup } from './export-dataset'
import { CLIENT_LOGO_IDS } from './migrate-about'
import { buildMigrationPlan, runMigrationPlan } from './migrate-all'
import {
  AUTHOR_IDS,
  JOURNAL_ARTICLE_IDS,
  JOURNAL_CATEGORY_IDS,
} from './migrate-journal'
import { SERVICE_IDS } from './migrate-services-contact'
import { WORK_PROJECT_IDS } from './migrate-work'
import {
  EXPECTED_CUTOVER_DOCUMENTS,
  validateCutoverDataset,
} from './validate-cutover'

const execFileAsync = promisify(execFile)

export interface ProductionLaunchStep {
  name: string
  run: () => Promise<unknown>
}

export interface ProductionPublishGroup {
  name: string
  ids: readonly string[]
}

export const PRODUCTION_PUBLISH_GROUPS = [
  {
    name: 'reusable referenced documents',
    ids: [
      ...SERVICE_IDS,
      ...AUTHOR_IDS,
      ...JOURNAL_CATEGORY_IDS,
      ...CLIENT_LOGO_IDS,
    ],
  },
  {
    name: 'Work Projects and Journal Articles',
    ids: [...WORK_PROJECT_IDS, ...JOURNAL_ARTICLE_IDS],
  },
  {
    name: 'page singletons and Site Settings',
    ids: [
      HOME_PAGE_ID,
      WORK_PAGE_ID,
      SERVICES_PAGE_ID,
      ABOUT_PAGE_ID,
      JOURNAL_PAGE_ID,
      CONTACT_PAGE_ID,
      SITE_SETTINGS_ID,
    ],
  },
] as const satisfies readonly ProductionPublishGroup[]

interface DraftDocument {
  _id: string
  _type: string
  [key: string]: unknown
}

interface PublicationTransaction {
  createOrReplace: (document: DraftDocument) => PublicationTransaction
  delete: (id: string) => PublicationTransaction
  commit: () => Promise<unknown>
}

interface PublicationClient {
  fetch: (
    query: string,
    params: { ids: readonly string[] },
    options?: { perspective: 'raw' },
  ) => Promise<DraftDocument[]>
  transaction: () => PublicationTransaction
}

export async function runProductionLaunchPlan(steps: ProductionLaunchStep[]) {
  for (const step of steps) {
    await step.run()
    console.log(`Completed production launch stage: ${step.name}.`)
  }
}

interface ValidationFileClient {
  fetch: (
    query: string,
    params: { draftIds: readonly string[] },
    options?: { perspective: 'raw' },
  ) => Promise<DraftDocument[]>
}

export async function writeDraftValidationFile({
  client,
  directory = '.sanity/backups',
  now = new Date(),
}: {
  client: ValidationFileClient
  directory?: string
  now?: Date
}) {
  await mkdir(directory, { recursive: true })
  const draftIds = EXPECTED_CUTOVER_DOCUMENTS.map(({ id }) => `drafts.${id}`)
  const documents = await client.fetch(
    '*[_id in $draftIds || _type in ["sanity.imageAsset", "sanity.fileAsset"]]',
    { draftIds },
    { perspective: 'raw' },
  )
  const timestamp = now.toISOString().replaceAll(':', '-').replace('.', '-')
  const path = join(directory, `production-drafts-${timestamp}.ndjson`)
  await writeFile(
    path,
    `${documents.map((document) => JSON.stringify(document)).join('\n')}\n`,
    { flag: 'wx' },
  )
  return path
}

function normalizePublishedValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizePublishedValue)
  if (!value || typeof value !== 'object') return value

  const source = value as Record<string, unknown>
  const entries = Object.entries(source)
    .filter(
      ([key]) =>
        key !== '_rev' &&
        key !== '_createdAt' &&
        key !== '_updatedAt' &&
        key !== '_weak' &&
        key !== '_strengthenOnPublish',
    )
    .map(([key, child]) => {
      if (key === '_id' && typeof child === 'string') {
        return [key, child.replace(/^drafts\./, '')]
      }
      if (
        key === '_ref' &&
        typeof child === 'string' &&
        source._type === 'reference'
      ) {
        return [key, child.replace(/^drafts\./, '')]
      }
      return [key, normalizePublishedValue(child)]
    })

  return Object.fromEntries(entries)
}

export function preparePublishedDocument(
  document: DraftDocument,
): DraftDocument {
  return normalizePublishedValue(document) as DraftDocument
}

export async function publishDraftGroups(
  client: PublicationClient,
  groups: readonly ProductionPublishGroup[] = PRODUCTION_PUBLISH_GROUPS,
) {
  for (const group of groups) {
    const draftIds = group.ids.map((id) => `drafts.${id}`)
    const drafts = await client.fetch(
      '*[_id in $ids]',
      { ids: draftIds },
      { perspective: 'raw' },
    )
    const draftsById = new Map(
      drafts.map((document) => [document._id, document]),
    )
    const missing = draftIds.filter((id) => !draftsById.has(id))
    if (missing.length > 0) {
      throw new Error(
        `Cannot publish ${group.name}; missing drafts: ${missing.join(', ')}.`,
      )
    }

    const transaction = client.transaction()
    for (const draftId of draftIds) {
      transaction.createOrReplace(
        preparePublishedDocument(draftsById.get(draftId)!),
      )
    }
    for (const draftId of draftIds) transaction.delete(draftId)
    await transaction.commit()

    console.log(`Published ${group.name} (${draftIds.length} documents).`)
  }
}

function loadLocalEnvironment() {
  try {
    process.loadEnvFile('.env')
  } catch {
    // CI and production commands provide environment variables directly.
  }
}

async function validateSanityDocuments(token: string, archivePath?: string) {
  const sourceArguments = archivePath
    ? ['--file', archivePath]
    : ['--dataset', 'production']
  const { stdout, stderr } = await execFileAsync(
    'pnpm',
    [
      'exec',
      'sanity',
      'documents',
      'validate',
      ...sourceArguments,
      '--yes',
      '--level',
      'error',
    ],
    {
      env: {
        ...process.env,
        SANITY_AUTH_TOKEN: process.env.SANITY_AUTH_TOKEN ?? token,
      },
      maxBuffer: 10 * 1024 * 1024,
    },
  )
  if (stdout.trim()) console.log(stdout.trim())
  if (stderr.trim()) console.error(stderr.trim())
}

async function run() {
  loadLocalEnvironment()

  const projectId = process.env.PUBLIC_SANITY_PROJECT_ID
  const writeToken =
    process.env.SANITY_API_WRITE_TOKEN ?? process.env.SANITY_AUTH_TOKEN
  const readToken = process.env.SANITY_API_READ_TOKEN ?? writeToken

  if (!projectId || !writeToken || !readToken) {
    throw new Error(
      'PUBLIC_SANITY_PROJECT_ID plus Sanity read and write tokens are required.',
    )
  }
  if (process.env.ALLOW_PRODUCTION_LAUNCH !== 'true') {
    throw new Error(
      'Production launch is blocked. Set ALLOW_PRODUCTION_LAUNCH=true explicitly.',
    )
  }

  const createDatasetClient = (dataset: string, token: string) =>
    createClient({
      projectId,
      dataset,
      apiVersion: SANITY_API_VERSION,
      token,
      useCdn: false,
    })
  const developmentClient = createDatasetClient('development', readToken)
  const productionReadClient = createDatasetClient('production', readToken)
  const productionWriteClient = createDatasetClient('production', writeToken)
  let preMigrationBackup: Awaited<ReturnType<typeof exportDatasetBackup>>
  let prePublicationBackup: Awaited<ReturnType<typeof exportDatasetBackup>>
  let draftValidationFile: string
  let postMigrationBackup: Awaited<ReturnType<typeof exportDatasetBackup>>

  const steps: ProductionLaunchStep[] = [
    {
      name: 'pre-migration production export',
      run: async () => {
        preMigrationBackup = await exportDatasetBackup({
          client: productionReadClient,
          dataset: 'production',
          label: 'pre-migration',
        })
      },
    },
    {
      name: 'deterministic production draft migration',
      run: () =>
        runMigrationPlan(buildMigrationPlan(productionWriteClient, false)),
    },
    {
      name: 'pre-publication production export',
      run: async () => {
        prePublicationBackup = await exportDatasetBackup({
          client: productionReadClient,
          dataset: 'production',
          label: 'pre-publication',
        })
      },
    },
    {
      name: 'draft-only validation dataset',
      run: async () => {
        draftValidationFile = await writeDraftValidationFile({
          client: productionReadClient as unknown as ValidationFileClient,
        })
      },
    },
    {
      name: 'production draft schema validation',
      run: () => validateSanityDocuments(writeToken, draftValidationFile),
    },
    {
      name: 'production draft content validation',
      run: () =>
        validateCutoverDataset({
          client: productionReadClient,
          dataset: 'production',
          perspective: 'drafts',
        }),
    },
    {
      name: 'development-to-production draft comparison',
      run: () =>
        compareCutoverDatasets({
          sourceClient: developmentClient,
          targetClient: productionReadClient,
          targetPerspective: 'drafts',
        }),
    },
    {
      name: 'dependency-ordered production publication',
      run: () =>
        publishDraftGroups(
          productionWriteClient as unknown as PublicationClient,
        ),
    },
    {
      name: 'published production schema validation',
      run: () => validateSanityDocuments(writeToken),
    },
    {
      name: 'published production content validation',
      run: () =>
        validateCutoverDataset({
          client: productionReadClient,
          dataset: 'production',
          perspective: 'published',
        }),
    },
    {
      name: 'development-to-production published comparison',
      run: () =>
        compareCutoverDatasets({
          sourceClient: developmentClient,
          targetClient: productionReadClient,
          targetPerspective: 'published',
        }),
    },
    {
      name: 'post-migration production export',
      run: async () => {
        postMigrationBackup = await exportDatasetBackup({
          client: productionReadClient,
          dataset: 'production',
          label: 'post-migration',
        })
      },
    },
  ]

  await runProductionLaunchPlan(steps)

  console.log(`Pre-migration backup: ${preMigrationBackup!.archivePath}`)
  console.log(`Pre-publication backup: ${prePublicationBackup!.archivePath}`)
  console.log(`Post-migration backup: ${postMigrationBackup!.archivePath}`)
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await run()
}
