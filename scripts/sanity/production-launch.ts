import { execFile } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { CONTENT_DRAFT_IDS, draftId } from '../../src/sanity/manifests/content'
import {
  PUBLICATION_GROUPS,
  type PublicationGroup,
} from '../../src/sanity/manifests/publication'
import { compareCutoverDatasets } from './compare-datasets'
import { exportDatasetBackup } from './export-dataset'
import { validateCutoverDataset } from './validate-cutover'
import {
  preparePublishedDocument,
  runProductionLaunchCommand,
  type MigrationDocument,
  type ProductionLaunchCommandEnvironment,
} from './migration-runtime'

export { preparePublishedDocument } from './migration-runtime'

const execFileAsync = promisify(execFile)

export interface ProductionLaunchStep {
  name: string
  run: () => Promise<unknown>
}

export type ProductionPublishGroup = PublicationGroup
export const PRODUCTION_PUBLISH_GROUPS = PUBLICATION_GROUPS

type DraftDocument = MigrationDocument

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
  const draftIds = CONTENT_DRAFT_IDS
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

export async function publishDraftGroups(
  client: PublicationClient,
  groups: readonly ProductionPublishGroup[] = PRODUCTION_PUBLISH_GROUPS,
) {
  for (const group of groups) {
    const draftIds = group.ids.map(draftId)
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

async function launchProduction({
  developmentClient,
  productionReadClient,
  productionWriteClient,
  writeToken,
}: ProductionLaunchCommandEnvironment) {
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
      run: async () => {
        const { buildMigrationPlan, runMigrationPlan } =
          await import('./migrate-all')
        return runMigrationPlan(
          buildMigrationPlan(productionWriteClient, false),
        )
      },
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
          client: productionReadClient,
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
      run: () => publishDraftGroups(productionWriteClient),
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

await runProductionLaunchCommand({
  moduleUrl: import.meta.url,
  launch: launchProduction,
})
