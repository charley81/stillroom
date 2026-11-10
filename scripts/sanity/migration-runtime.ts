import {
  createClient,
  type SanityClient,
  type SanityReference,
} from '@sanity/client'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { basename, extname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SANITY_API_VERSION } from '../../src/sanity/constants'

export interface MigrationDocument {
  _id: string
  _type: string
  [key: string]: unknown
}

interface MigrationTransaction {
  createOrReplace: (document: MigrationDocument) => unknown
  delete: (documentId: string) => unknown
  commit: () => Promise<unknown>
}

export interface MigrationClient {
  fetch: (query: string, params: { sha1: string }) => Promise<string | null>
  assets: {
    upload: (
      type: 'image',
      body: Buffer,
      options: { filename: string; contentType: string },
    ) => Promise<{ _id: string }>
  }
  createOrReplace: (document: MigrationDocument) => Promise<unknown>
  transaction: () => MigrationTransaction
}

export type ReadMigrationAsset = (path: string) => Promise<Buffer>

export interface MigrationAssets {
  uploadImage: (path: string) => Promise<string>
}

function imageContentType(path: string) {
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

export function createMigrationAssets(
  client: Pick<MigrationClient, 'assets' | 'fetch'>,
  readAsset: ReadMigrationAsset = readFile,
): MigrationAssets {
  return {
    async uploadImage(path) {
      const body = await readAsset(path)
      const sha1 = createHash('sha1').update(body).digest('hex')
      const existingAssetId = await client.fetch(
        '*[_type == "sanity.imageAsset" && sha1hash == $sha1][0]._id',
        { sha1 },
      )

      if (existingAssetId) return existingAssetId

      const asset = await client.assets.upload('image', body, {
        filename: basename(path),
        contentType: imageContentType(path),
      })
      return asset._id
    },
  }
}

export interface DraftReference extends SanityReference {
  _key: string
  _type: 'reference'
  _weak: true
  _strengthenOnPublish: { type: string }
}

export function draftReference(
  id: string,
  type: string,
  key = id,
): DraftReference {
  return {
    _key: key,
    _type: 'reference',
    _ref: id,
    _weak: true,
    _strengthenOnPublish: { type },
  }
}

export function publishedId(documentId: string) {
  return documentId.replace(/^drafts\./, '')
}

function normalizePublishedValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizePublishedValue)
  if (!value || typeof value !== 'object') return value

  const source = value as Record<string, unknown>
  return Object.fromEntries(
    Object.entries(source)
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
          return [key, publishedId(child)]
        }
        if (
          key === '_ref' &&
          typeof child === 'string' &&
          source._type === 'reference'
        ) {
          return [key, publishedId(child)]
        }
        return [key, normalizePublishedValue(child)]
      }),
  )
}

export function preparePublishedDocument<Document extends MigrationDocument>(
  document: Document,
): Document {
  return normalizePublishedValue(document) as Document
}

export async function writeMigrationDocuments({
  client,
  documents,
  publish = false,
}: {
  client: Pick<MigrationClient, 'createOrReplace' | 'transaction'>
  documents: readonly MigrationDocument[]
  publish?: boolean
}) {
  for (const document of documents) {
    await client.createOrReplace(document)
  }

  if (!publish) return

  const transaction = client.transaction()
  for (const document of documents) {
    transaction.createOrReplace(preparePublishedDocument(document))
  }
  for (const document of documents) {
    transaction.delete(document._id)
  }
  await transaction.commit()
}

export interface MigrationCommandEnvironment {
  client: SanityClient
  dataset: string
  publish: boolean
}

export interface ProductionLaunchCommandEnvironment {
  developmentClient: SanityClient
  productionReadClient: SanityClient
  productionWriteClient: SanityClient
  writeToken: string
}

function loadLocalEnvironment() {
  try {
    process.loadEnvFile('.env')
  } catch {
    // CI and production commands provide environment variables directly.
  }
}

function isDirectExecution(moduleUrl: string) {
  return Boolean(
    process.argv[1] && moduleUrl === pathToFileURL(process.argv[1]).href,
  )
}

function commandClient({
  projectId,
  dataset,
  token,
}: {
  projectId: string
  dataset: string
  token: string
}) {
  return createClient({
    projectId,
    dataset,
    apiVersion: SANITY_API_VERSION,
    token,
    useCdn: false,
  })
}

export async function runMigrationCommand({
  moduleUrl,
  migrate,
  successMessage,
}: {
  moduleUrl: string
  migrate: (environment: MigrationCommandEnvironment) => Promise<unknown>
  successMessage: (environment: MigrationCommandEnvironment) => string
}) {
  if (!isDirectExecution(moduleUrl)) return

  loadLocalEnvironment()

  const projectId = process.env.PUBLIC_SANITY_PROJECT_ID
  const token =
    process.env.SANITY_API_WRITE_TOKEN ?? process.env.SANITY_AUTH_TOKEN
  const dataset = process.env.SANITY_MIGRATION_DATASET ?? 'development'
  const publish = process.argv.includes('--publish')

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

  const environment = {
    client: commandClient({ projectId, dataset, token }),
    dataset,
    publish,
  }
  await migrate(environment)
  console.log(successMessage(environment))
}

export async function runProductionLaunchCommand({
  moduleUrl,
  launch,
}: {
  moduleUrl: string
  launch: (environment: ProductionLaunchCommandEnvironment) => Promise<unknown>
}) {
  if (!isDirectExecution(moduleUrl)) return

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

  await launch({
    developmentClient: commandClient({
      projectId,
      dataset: 'development',
      token: readToken,
    }),
    productionReadClient: commandClient({
      projectId,
      dataset: 'production',
      token: readToken,
    }),
    productionWriteClient: commandClient({
      projectId,
      dataset: 'production',
      token: writeToken,
    }),
    writeToken,
  })
}
