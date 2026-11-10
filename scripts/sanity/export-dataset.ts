import { createClient, type SanityClient } from '@sanity/client'
import { exportDataset } from '@sanity/export'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SANITY_API_VERSION } from '../../src/sanity/constants'

interface BackupExporterOptions {
  client: SanityClient
  dataset: string
  outputPath: string
  assets: boolean
  drafts: boolean
  mode: 'stream'
}

interface BackupExporterResult {
  documentCount: number
  assetCount: number
}

type BackupExporter = (
  options: BackupExporterOptions,
) => Promise<BackupExporterResult>

export interface DatasetBackupResult {
  archivePath: string
  manifestPath: string
  documentCount: number
  assetCount: number
  sha256: string
}

export function createBackupPaths({
  directory,
  dataset,
  label,
  now,
}: {
  directory: string
  dataset: string
  label: string
  now: Date
}) {
  if (!/^[a-z0-9_-]+$/.test(dataset)) {
    throw new Error(`Invalid Sanity dataset name: ${dataset}`)
  }
  if (!/^[a-z0-9-]+$/.test(label)) {
    throw new Error(`Invalid backup label: ${label}`)
  }

  const timestamp = now.toISOString().replaceAll(':', '-').replace('.', '-')
  const basename = `${dataset}-${label}-${timestamp}`
  return {
    archivePath: join(directory, `${basename}.tar.gz`),
    manifestPath: join(directory, `${basename}.json`),
  }
}

export async function exportDatasetBackup({
  client,
  dataset,
  label,
  directory = '.sanity/backups',
  now = new Date(),
  exporter = exportDataset as unknown as BackupExporter,
}: {
  client: SanityClient
  dataset: string
  label: string
  directory?: string
  now?: Date
  exporter?: BackupExporter
}): Promise<DatasetBackupResult> {
  await mkdir(directory, { recursive: true })
  const { archivePath, manifestPath } = createBackupPaths({
    directory,
    dataset,
    label,
    now,
  })
  const result = await exporter({
    client,
    dataset,
    outputPath: archivePath,
    assets: true,
    drafts: true,
    mode: 'stream',
  })
  const archive = await readFile(archivePath)
  if (archive.byteLength === 0) {
    throw new Error(`Sanity export created an empty archive: ${archivePath}`)
  }

  const sha256 = createHash('sha256').update(archive).digest('hex')
  const manifest = {
    dataset,
    label,
    createdAt: now.toISOString(),
    archivePath,
    documentCount: result.documentCount,
    assetCount: result.assetCount,
    sha256,
  }
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, {
    flag: 'wx',
  })

  return {
    archivePath,
    manifestPath,
    documentCount: result.documentCount,
    assetCount: result.assetCount,
    sha256,
  }
}

function loadLocalEnvironment() {
  try {
    process.loadEnvFile('.env')
  } catch {
    // CI and production commands provide environment variables directly.
  }
}

function argumentValue(name: string) {
  const prefix = `--${name}=`
  return process.argv
    .find((argument) => argument.startsWith(prefix))
    ?.slice(prefix.length)
}

async function run() {
  loadLocalEnvironment()

  const projectId = process.env.PUBLIC_SANITY_PROJECT_ID
  const token =
    process.env.SANITY_API_WRITE_TOKEN ??
    process.env.SANITY_API_READ_TOKEN ??
    process.env.SANITY_AUTH_TOKEN
  const dataset =
    argumentValue('dataset') ?? process.env.SANITY_MIGRATION_DATASET
  const label = argumentValue('label')

  if (!projectId || !token || !dataset || !label) {
    throw new Error(
      'PUBLIC_SANITY_PROJECT_ID, a Sanity read token, --dataset, and --label are required.',
    )
  }
  if (
    dataset === 'production' &&
    process.env.ALLOW_PRODUCTION_EXPORT !== 'true'
  ) {
    throw new Error(
      'Production export is blocked. Set ALLOW_PRODUCTION_EXPORT=true explicitly.',
    )
  }

  const result = await exportDatasetBackup({
    client: createClient({
      projectId,
      dataset,
      apiVersion: SANITY_API_VERSION,
      token,
      useCdn: false,
    }),
    dataset,
    label,
  })

  console.log(
    `Exported ${result.documentCount} documents and ${result.assetCount} assets to ${result.archivePath}.`,
  )
  console.log(`Backup manifest: ${result.manifestPath} (${result.sha256}).`)
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await run()
}
