import { createClient } from '@sanity/client'
import { SANITY_API_VERSION } from '../../src/sanity/constants'

try {
  process.loadEnvFile('.env')
} catch {
  // CI can provide environment variables directly.
}

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID
const token =
  process.env.SANITY_AUTH_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN

if (!projectId) {
  throw new Error('PUBLIC_SANITY_PROJECT_ID is required.')
}

const queryUrl = new URL(
  `https://${projectId}.api.sanity.io/v${SANITY_API_VERSION}/data/query/development`,
)
queryUrl.searchParams.set('query', 'count(*)')

const verification = await fetch(queryUrl)

if (verification.ok) {
  console.log('Verified public development dataset.')
} else if (verification.status === 404) {
  if (!token) {
    throw new Error(
      'The development dataset is missing and SANITY_AUTH_TOKEN is required to create it.',
    )
  }

  const client = createClient({
    projectId,
    dataset: 'production',
    apiVersion: SANITY_API_VERSION,
    token,
    useCdn: false,
  })

  await client.datasets.create('development', {
    aclMode: 'public',
    description: 'Stillroom development and automated-test content',
  })
  console.log('Created public development dataset.')
} else {
  throw new Error(
    `Could not verify the development dataset (${verification.status} ${verification.statusText}).`,
  )
}
