import { createClient } from '@sanity/client'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { basename, extname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SANITY_API_VERSION } from '../../src/sanity/constants'
import {
  AUTHOR_IDS,
  JOURNAL_ARTICLE_IDS,
  JOURNAL_ARTICLE_SLUGS,
  JOURNAL_CATEGORY_IDS,
  JOURNAL_PAGE_DRAFT_ID,
  draftId,
} from '../../src/sanity/manifests/content'
import { migrationAssetPath } from './migration-assets'

export {
  AUTHOR_IDS,
  JOURNAL_ARTICLE_IDS,
  JOURNAL_ARTICLE_SLUGS,
  JOURNAL_CATEGORY_IDS,
  JOURNAL_PAGE_DRAFT_ID,
  JOURNAL_PAGE_ID,
} from '../../src/sanity/manifests/content'

interface SourceImage {
  src: string
  alt: string
  caption?: string
}

interface SourceContentBlock {
  type: 'heading' | 'paragraph'
  text: string
}

interface SourceArticle {
  title: string
  category: string
  readTime: string
  date: string
  excerpt: string
  image: string
  imageAlt: string
  heroImage: SourceImage
  order: number
  featured: boolean
  author: string
  authorBio: string
  body: Array<
    | { type: 'section'; label: string; content: SourceContentBlock[] }
    | { type: 'pullQuote'; label?: string; quote: string }
    | { type: 'image'; image: SourceImage }
  >
  relatedArticles: string[]
}

interface JournalArticleSectionDocument {
  _key: string
  _type: 'journalArticleSection'
  label: string
  content: ReturnType<typeof portableTextBlock>[]
}

interface JournalArticlePullQuoteDocument {
  _key: string
  _type: 'journalArticlePullQuote'
  label?: string
  quote: string
}

type JournalArticleBodyDocument =
  JournalArticleSectionDocument | JournalArticlePullQuoteDocument

interface MigrationDocument {
  _id: string
  _type: string
  [key: string]: unknown
}

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

const JOURNAL_PAGE_ARTWORK_PATH = '/images/387-3818.webp'

function loadSourceArticle(slug: string): SourceArticle {
  return JSON.parse(
    readFileSync(
      new URL(`./source/journal-articles/${slug}.json`, import.meta.url),
      'utf8',
    ),
  ) as SourceArticle
}

const sourceArticles = JOURNAL_ARTICLE_SLUGS.map(loadSourceArticle)

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function reference(id: string, type: string, key = id) {
  return {
    _key: key,
    _type: 'reference' as const,
    _ref: id,
    _weak: true,
    _strengthenOnPublish: { type },
  }
}

function editorialImage(
  assetId: string,
  source: { alt: string; caption?: string },
  decorative = false,
) {
  return {
    _type: 'editorialImage' as const,
    asset: {
      _type: 'image' as const,
      asset: { _type: 'reference' as const, _ref: assetId },
    },
    decorative,
    alt: decorative ? '' : source.alt,
    ...(source.caption ? { caption: source.caption } : {}),
  }
}

function portableTextBlock(block: SourceContentBlock, index: number) {
  const key = `content-${index + 1}`
  return {
    _key: key,
    _type: 'block' as const,
    style: block.type === 'heading' ? ('h2' as const) : ('normal' as const),
    markDefs: [],
    children: [
      {
        _key: `${key}-span`,
        _type: 'span' as const,
        marks: [],
        text: block.text,
      },
    ],
  }
}

function requiredAsset(assetIds: Record<string, string>, path: string) {
  const assetId = assetIds[path]
  if (!assetId) throw new Error(`Missing uploaded Journal asset: ${path}`)
  return assetId
}

export function buildJournalDocuments(assetIds: Record<string, string>) {
  const authorNames = [...new Set(sourceArticles.map(({ author }) => author))]
  const authorIdsBySlug = new Map(
    AUTHOR_IDS.map((id) => [id.replace(/^author-/, ''), id]),
  )
  const authors = authorNames.map((name) => {
    const source = sourceArticles.find((article) => article.author === name)!
    const id = authorIdsBySlug.get(slugify(name))
    if (!id) throw new Error(`Missing manifest Author ID for ${name}.`)
    return {
      _id: draftId(id),
      _type: 'author' as const,
      name,
      biography: source.authorBio,
    }
  })

  const categoryTitles = [
    ...new Set(sourceArticles.map(({ category }) => category)),
  ]
  const categoryIdsBySlug = new Map(
    JOURNAL_CATEGORY_IDS.map((id) => [
      id.replace(/^journal-category-/, ''),
      id,
    ]),
  )
  const categories = categoryTitles.map((title) => {
    const slug = slugify(title)
    const id = categoryIdsBySlug.get(slug)
    if (!id)
      throw new Error(`Missing manifest Journal Category ID for ${title}.`)
    return {
      _id: draftId(id),
      _type: 'journalCategory' as const,
      title,
      slug: { _type: 'slug' as const, current: slug },
    }
  })

  const articles = sourceArticles.map((source, index) => {
    const slug = JOURNAL_ARTICLE_SLUGS[index]
    const id = JOURNAL_ARTICLE_IDS[index]
    const categoryId = categoryIdsBySlug.get(slugify(source.category))
    const authorId = authorIdsBySlug.get(slugify(source.author))
    if (!categoryId || !authorId) {
      throw new Error(
        `Missing manifest references for Journal Article ${slug}.`,
      )
    }
    const body: JournalArticleBodyDocument[] = []
    source.body.forEach((block, bodyIndex) => {
      if (block.type === 'image') return
      if (block.type === 'pullQuote') {
        body.push({
          _key: `pull-quote-${bodyIndex + 1}`,
          _type: 'journalArticlePullQuote',
          ...(block.label ? { label: block.label } : {}),
          quote: block.quote,
        })
        return
      }
      body.push({
        _key: `section-${bodyIndex + 1}`,
        _type: 'journalArticleSection',
        label: block.label,
        content: block.content.map(portableTextBlock),
      })
    })

    return {
      _id: draftId(id),
      _type: 'journalArticle' as const,
      title: source.title,
      slug: { _type: 'slug' as const, current: slug },
      category: reference(categoryId, 'journalCategory', 'category'),
      author: reference(authorId, 'author', 'author'),
      publicationDate: source.date,
      standfirst: source.excerpt,
      readingTime: source.readTime,
      heroImage: editorialImage(
        requiredAsset(assetIds, source.heroImage.src),
        source.heroImage,
      ),
      body,
      relatedJournalArticles: source.relatedArticles.map((relatedSlug) => {
        const relatedId = `journal-article-${relatedSlug}`
        return reference(relatedId, 'journalArticle', relatedSlug)
      }),
      seo: {
        _type: 'seoFields' as const,
        metaTitle: `${source.title} — Stillroom Journal`,
        metaDescription: source.excerpt,
        socialImage: {
          _type: 'image' as const,
          asset: {
            _type: 'reference' as const,
            _ref: requiredAsset(assetIds, source.heroImage.src),
          },
        },
      },
    }
  })

  const featured = sourceArticles.find(({ featured }) => featured)
  if (!featured)
    throw new Error('Journal migration requires a featured article.')
  const featuredSlug = JOURNAL_ARTICLE_SLUGS[sourceArticles.indexOf(featured)]

  const journalPage = {
    _id: JOURNAL_PAGE_DRAFT_ID,
    _type: 'journalPage' as const,
    heading: 'Food for thought.',
    introduction:
      'Ideas, observations, and the things we keep coming back to. On hospitality, culture, and design — and what happens when they meet.',
    introductionArtwork: editorialImage(
      requiredAsset(assetIds, JOURNAL_PAGE_ARTWORK_PATH),
      { alt: '' },
      true,
    ),
    featuredJournalArticle: reference(
      `journal-article-${featuredSlug}`,
      'journalArticle',
      'featured',
    ),
    seo: {
      _type: 'seoFields' as const,
      metaTitle: 'Journal — Stillroom',
      metaDescription:
        'Ideas and observations about hospitality, culture and design.',
      socialImage: {
        _type: 'image' as const,
        asset: {
          _type: 'reference' as const,
          _ref: requiredAsset(assetIds, featured.heroImage.src),
        },
      },
    },
  }

  return { authors, categories, articles, journalPage }
}

function allAssetPaths() {
  return [
    JOURNAL_PAGE_ARTWORK_PATH,
    ...new Set(sourceArticles.map(({ heroImage }) => heroImage.src)),
  ]
}

function contentType(path: string) {
  switch (extname(path).toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.webp':
      return 'image/webp'
    case '.svg':
      return 'image/svg+xml'
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
  const strengthen = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(strengthen)
    if (!value || typeof value !== 'object') return value

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => key !== '_weak' && key !== '_strengthenOnPublish')
        .map(([key, child]) => [key, strengthen(child)]),
    )
  }

  return strengthen({
    ...document,
    _id: document._id.replace(/^drafts\./, ''),
  }) as MigrationDocument
}

export async function migrateJournal({
  client,
  readAsset = async (path) => readFile(path),
  publish = false,
}: {
  client: MigrationClient
  readAsset?: (path: string) => Promise<Buffer>
  publish?: boolean
}) {
  const assetIds: Record<string, string> = {}
  for (const publicPath of allAssetPaths()) {
    const diskPath = migrationAssetPath(publicPath)
    assetIds[publicPath] = await uploadImageOnce({
      client,
      path: diskPath,
      readAsset,
    })
  }

  const documents = buildJournalDocuments(assetIds)
  const drafts: MigrationDocument[] = [
    ...documents.authors,
    ...documents.categories,
    ...documents.articles,
    documents.journalPage,
  ]
  for (const document of drafts) await client.createOrReplace(document)

  if (publish) {
    const transaction = client.transaction()
    for (const document of drafts) {
      transaction.createOrReplace(publishedDocument(document))
    }
    for (const document of drafts) transaction.delete(document._id)
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
  await migrateJournal({
    client: client as unknown as MigrationClient,
    publish,
  })

  console.log(
    `${publish ? 'Published' : 'Migrated'} Journal content in ${dataset}.`,
  )
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await run()
}
