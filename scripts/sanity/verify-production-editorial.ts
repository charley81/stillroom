import { createClient } from '@sanity/client'
import { stegaClean } from '@sanity/client/stega'
import { pathToFileURL } from 'node:url'
import { HOME_PAGE_ID, SANITY_API_VERSION } from '../../src/sanity/constants'
import { requireConfiguredSiteOrigin } from '../../src/site-origin'
import {
  PREVIEW_COOKIE_NAME,
  createPreviewSession,
} from '../../src/sanity/preview'
import { preparePublishedDocument } from './production-launch'

interface HomeDocument {
  _id: string
  _type: string
  heroHeading: string
  [key: string]: unknown
}

function loadLocalEnvironment() {
  try {
    process.loadEnvFile('.env')
  } catch {
    // CI and production commands provide environment variables directly.
  }
}

async function fetchHome(productionOrigin: string, cookie?: string) {
  const response = await fetch(
    `${productionOrigin}/?editorial-check=${Date.now()}`,
    {
      headers: cookie ? { Cookie: cookie } : undefined,
      signal: AbortSignal.timeout(30_000),
    },
  )
  return {
    response,
    html: stegaClean(await response.text()),
  }
}

async function waitForPublishedText(
  productionOrigin: string,
  text: string,
  expected: boolean,
  refresh?: () => Promise<unknown>,
) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const { response, html } = await fetchHome(productionOrigin)
    if (response.status === 200 && html.includes(text) === expected) return
    if (refresh && attempt > 0 && attempt % 10 === 0) await refresh()
    await new Promise((resolve) => setTimeout(resolve, 2_000))
  }
  throw new Error(
    `Timed out waiting for published Home content to ${expected ? 'include' : 'exclude'} ${JSON.stringify(text)}.`,
  )
}

async function run() {
  loadLocalEnvironment()

  const productionOrigin = requireConfiguredSiteOrigin(process.env)
  const projectId = process.env.PUBLIC_SANITY_PROJECT_ID
  const token =
    process.env.SANITY_API_WRITE_TOKEN ?? process.env.SANITY_AUTH_TOKEN
  const sessionSecret = process.env.SANITY_PREVIEW_SESSION_SECRET
  if (!projectId || !token || !sessionSecret) {
    throw new Error(
      'PUBLIC_SANITY_PROJECT_ID, SANITY_API_WRITE_TOKEN, and SANITY_PREVIEW_SESSION_SECRET are required.',
    )
  }
  if (process.env.ALLOW_PRODUCTION_EDITORIAL_CHECK !== 'true') {
    throw new Error(
      'Production editorial verification is blocked. Set ALLOW_PRODUCTION_EDITORIAL_CHECK=true explicitly.',
    )
  }

  const client = createClient({
    projectId,
    dataset: 'production',
    apiVersion: SANITY_API_VERSION,
    token,
    useCdn: false,
  })
  const original = await client.fetch<HomeDocument | null>(
    '*[_id == $id][0]',
    { id: HOME_PAGE_ID },
    { perspective: 'raw' },
  )
  if (!original || typeof original.heroHeading !== 'string') {
    throw new Error('Published Home content is unavailable for verification.')
  }

  const publishedOriginal = preparePublishedDocument(original)
  const marker = `Editorial verification ${Date.now()}`
  const draft = {
    ...publishedOriginal,
    _id: `drafts.${HOME_PAGE_ID}`,
    heroHeading: `${original.heroHeading}\n${marker}`,
  }
  const cookie = `${PREVIEW_COOKIE_NAME}=${await createPreviewSession(sessionSecret)}`

  const restoreOriginal = async () => {
    const restore = client.transaction()
    restore.createOrReplace(publishedOriginal)
    restore.delete(`drafts.${HOME_PAGE_ID}`)
    await restore.commit()
  }

  try {
    await client.createOrReplace(draft)

    const publicPage = await fetchHome(productionOrigin)
    if (publicPage.html.includes(marker)) {
      throw new Error('The production draft leaked to the public page.')
    }

    const previewPage = await fetchHome(productionOrigin, cookie)
    if (!previewPage.html.includes(marker)) {
      throw new Error('The production preview did not display the draft edit.')
    }
    if (
      !previewPage.html.includes('Exit preview') ||
      !previewPage.html.includes('visual-editing-component')
    ) {
      throw new Error('Visual Editing controls were not rendered in preview.')
    }
    const cacheDirectives = new Set(
      (previewPage.response.headers.get('cache-control') ?? '')
        .split(',')
        .map((directive) => directive.trim()),
    )
    if (
      previewPage.response.headers.get('x-robots-tag') !==
        'noindex, nofollow' ||
      !cacheDirectives.has('private') ||
      !cacheDirectives.has('no-store')
    ) {
      throw new Error('Preview response security headers are incomplete.')
    }

    const publish = client.transaction()
    publish.createOrReplace(preparePublishedDocument(draft))
    publish.delete(draft._id)
    await publish.commit()
    const publishedHeading = await client.fetch<string>(
      '*[_id == $id][0].heroHeading',
      { id: HOME_PAGE_ID },
      { perspective: 'published' },
    )
    if (!publishedHeading.includes(marker)) {
      throw new Error('Sanity did not publish the editorial verification edit.')
    }
    await waitForPublishedText(productionOrigin, marker, true)

    console.log(
      'Verified draft preview, Visual Editing, and publication without a deployment.',
    )
  } finally {
    await restoreOriginal()
    await waitForPublishedText(productionOrigin, marker, false, restoreOriginal)
  }

  console.log('Restored the verified Home content after the editorial check.')
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await run()
}
