import { createClient } from '@sanity/client'
import { exportDataset } from '@sanity/export'
import { mkdir } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { SANITY_API_VERSION } from '../../src/sanity/constants'

function loadLocalEnvironment() {
  try {
    process.loadEnvFile('.env')
  } catch {
    // CI can provide environment variables directly.
  }
}

export async function exportDevelopmentDataset() {
  loadLocalEnvironment()

  const projectId = process.env.PUBLIC_SANITY_PROJECT_ID
  const token =
    process.env.SANITY_API_WRITE_TOKEN ??
    process.env.SANITY_API_READ_TOKEN ??
    process.env.SANITY_AUTH_TOKEN
  if (!projectId || !token) {
    throw new Error(
      'PUBLIC_SANITY_PROJECT_ID and a Sanity read or write token are required to export the development dataset.',
    )
  }

  const outputPath = '.sanity/backups/development.tar.gz'
  await mkdir('.sanity/backups', { recursive: true })

  const result = await exportDataset({
    client: createClient({
      projectId,
      dataset: 'development',
      apiVersion: SANITY_API_VERSION,
      token,
      useCdn: false,
    }),
    dataset: 'development',
    outputPath,
    assets: true,
    drafts: true,
    mode: 'stream',
  })

  if (result.documentCount === 0 || result.assetCount === 0) {
    throw new Error(
      `Incomplete development export (${result.documentCount} documents, ${result.assetCount} assets).`,
    )
  }

  console.log(
    `Exported ${result.documentCount} documents and ${result.assetCount} assets to ${outputPath}.`,
  )
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await exportDevelopmentDataset()
}
