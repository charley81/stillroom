import { createClient, type SanityClient } from '@sanity/client'
import { isDeepStrictEqual } from 'node:util'
import { pathToFileURL } from 'node:url'
import { SANITY_API_VERSION } from '../../src/sanity/constants'
import { CONTENT_DOCUMENTS, draftId } from '../../src/sanity/manifests/content'

interface SanityDocument {
  _id: string
  _type: string
  [key: string]: unknown
}

interface AssetDocument {
  _id: string
  sha1hash?: string
}

export type CanonicalDocument = Record<string, unknown>

function canonicalizeValue(
  value: unknown,
  assetsById: ReadonlyMap<string, string>,
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => canonicalizeValue(item, assetsById))
  }
  if (!value || typeof value !== 'object') return value

  const source = value as Record<string, unknown>
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(source).sort()) {
    if (
      key === '_rev' ||
      key === '_createdAt' ||
      key === '_updatedAt' ||
      key === '_weak' ||
      key === '_strengthenOnPublish'
    ) {
      continue
    }

    const child = source[key]
    if (key === '_id' && typeof child === 'string') {
      result[key] = child.replace(/^drafts\./, '')
    } else if (key === '_ref' && typeof child === 'string') {
      const assetHash = assetsById.get(child)
      result[key] = assetHash
        ? `asset:${assetHash}`
        : child.replace(/^drafts\./, '')
    } else {
      result[key] = canonicalizeValue(child, assetsById)
    }
  }
  return result
}

export function canonicalizeDocument(
  document: SanityDocument,
  assetsById: ReadonlyMap<string, string>,
): CanonicalDocument {
  return canonicalizeValue(document, assetsById) as CanonicalDocument
}

export function compareCanonicalDocuments(
  source: ReadonlyMap<string, CanonicalDocument>,
  target: ReadonlyMap<string, CanonicalDocument>,
) {
  const sourceIds = [...source.keys()].sort()
  const targetIds = [...target.keys()].sort()
  if (!isDeepStrictEqual(targetIds, sourceIds)) {
    throw new Error(
      `Document identities differ. Source: ${sourceIds.join(', ')}. Target: ${targetIds.join(', ')}.`,
    )
  }

  for (const id of sourceIds) {
    if (!isDeepStrictEqual(target.get(id), source.get(id))) {
      throw new Error(`Content differs for ${id}.`)
    }
  }
}

async function fetchCanonicalDocuments({
  client,
  ids,
}: {
  client: SanityClient
  ids: string[]
}) {
  const [documents, assets] = await Promise.all([
    client.fetch<SanityDocument[]>(
      '*[_id in $ids]',
      { ids },
      { perspective: 'raw' },
    ),
    client.fetch<AssetDocument[]>(
      '*[_type in ["sanity.imageAsset", "sanity.fileAsset"]]{_id, sha1hash}',
      {},
      { perspective: 'raw' },
    ),
  ])
  const assetsById = new Map(
    assets.flatMap((asset) =>
      asset.sha1hash ? [[asset._id, asset.sha1hash] as const] : [],
    ),
  )
  return new Map(
    documents.map((document) => {
      const canonical = canonicalizeDocument(document, assetsById)
      return [String(canonical._id), canonical] as const
    }),
  )
}

export async function compareCutoverDatasets({
  sourceClient,
  targetClient,
  targetPerspective,
}: {
  sourceClient: SanityClient
  targetClient: SanityClient
  targetPerspective: 'drafts' | 'published'
}) {
  const publishedIds = CONTENT_DOCUMENTS.map(({ id }) => id)
  const targetIds = publishedIds.map((id) =>
    targetPerspective === 'drafts' ? draftId(id) : id,
  )
  const [source, target] = await Promise.all([
    fetchCanonicalDocuments({ client: sourceClient, ids: publishedIds }),
    fetchCanonicalDocuments({ client: targetClient, ids: targetIds }),
  ])

  compareCanonicalDocuments(source, target)
  console.log(
    `Compared ${source.size} ${targetPerspective} documents with the verified development dataset.`,
  )
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
    process.env.SANITY_API_READ_TOKEN ?? process.env.SANITY_AUTH_TOKEN
  const sourceDataset = argumentValue('source') ?? 'development'
  const targetDataset = argumentValue('target') ?? 'production'
  const targetPerspective = argumentValue('perspective') ?? 'drafts'

  if (!projectId || !token) {
    throw new Error(
      'PUBLIC_SANITY_PROJECT_ID and SANITY_API_READ_TOKEN are required.',
    )
  }
  if (targetPerspective !== 'drafts' && targetPerspective !== 'published') {
    throw new Error('--perspective must be drafts or published.')
  }
  if (
    targetDataset === 'production' &&
    process.env.ALLOW_PRODUCTION_VALIDATION !== 'true'
  ) {
    throw new Error(
      'Production comparison is blocked. Set ALLOW_PRODUCTION_VALIDATION=true explicitly.',
    )
  }

  const createDatasetClient = (dataset: string) =>
    createClient({
      projectId,
      dataset,
      apiVersion: SANITY_API_VERSION,
      token,
      useCdn: false,
    })

  await compareCutoverDatasets({
    sourceClient: createDatasetClient(sourceDataset),
    targetClient: createDatasetClient(targetDataset),
    targetPerspective,
  })
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await run()
}
