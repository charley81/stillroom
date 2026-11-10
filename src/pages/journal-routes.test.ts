import reactRenderer from '@astrojs/react/server.js'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { describe, expect, it, vi } from 'vitest'
import { JournalArticleNotFoundError } from '../sanity/content'
import { createContentRequestStub } from '../sanity/content/request.test-support'
import NotFoundRoute from './404.astro'
import JournalArticleRoute from './journal/[slug].astro'
import JournalRoute from './journal/index.astro'

const fixtures = vi.hoisted(() => {
  const image = {
    decorative: false,
    alt: 'A warm restaurant dining room set for service',
    caption: null,
    url: 'https://cdn.sanity.io/journal.jpg',
    mobileUrl: null,
  }
  const cards = [
    {
      _id: 'journal-article-featured',
      title: 'What Makes a Place Stay With Us?',
      slug: 'what-makes-a-place-stay-with-us',
      category: {
        _id: 'journal-category-culture',
        title: 'Culture',
        slug: 'culture',
      },
      publicationDate: '2026-10-21',
      standfirst: 'Published standfirst.',
      readingTime: '5 min read',
      heroImage: image,
    },
    {
      _id: 'journal-article-newer',
      title: 'The Quiet Power of a Good Menu.',
      slug: 'the-quiet-power-of-a-good-menu',
      category: {
        _id: 'journal-category-design',
        title: 'Design',
        slug: 'design',
      },
      publicationDate: '2026-10-14',
      standfirst: 'Published newer standfirst.',
      readingTime: '4 min read',
      heroImage: image,
    },
    {
      _id: 'journal-article-older',
      title: 'The Everyday Ritual, Reconsidered.',
      slug: 'the-everyday-ritual-reconsidered',
      category: {
        _id: 'journal-category-culture',
        title: 'Culture',
        slug: 'culture',
      },
      publicationDate: '2026-10-07',
      standfirst: 'Published older standfirst.',
      readingTime: '5 min read',
      heroImage: image,
    },
  ]
  const journalPage = {
    _id: 'journalPage',
    heading: 'Published Journal heading',
    introduction: 'Published Journal introduction.',
    introductionArtwork: { ...image, decorative: true, alt: '' },
    featuredJournalArticle: cards[0],
    articles: [cards[1], cards[2]],
    seo: null,
  }
  const article = {
    ...cards[0],
    author: {
      _id: 'author-stillroom',
      name: 'Stillroom',
      biography: 'Published author biography.',
    },
    body: [
      {
        _key: 'one',
        _type: 'journalArticleSection',
        label: '01 / The feeling of a place',
        content: [
          {
            _key: 'paragraph',
            _type: 'block',
            style: 'normal',
            markDefs: [],
            children: [
              {
                _key: 'paragraph-span',
                _type: 'span',
                marks: [],
                text: 'Published article paragraph.',
              },
            ],
          },
          {
            _key: 'heading',
            _type: 'block',
            style: 'h2',
            markDefs: [],
            children: [
              {
                _key: 'heading-span',
                _type: 'span',
                marks: [],
                text: 'Published article subheading.',
              },
            ],
          },
        ],
      },
      {
        _key: 'quote',
        _type: 'journalArticlePullQuote',
        label: 'A note to come back to',
        quote: 'Published pull quote.',
      },
    ],
    relatedJournalArticles: [cards[1], cards[2]],
    seo: null,
  }
  const siteSettings = {
    _id: 'siteSettings',
    studioName: 'Stillroom',
    registeredMarkText: 'stillroom®',
    homeLabel: 'Home',
    workLabel: 'Work',
    servicesLabel: 'Services',
    aboutLabel: 'About',
    journalLabel: 'Journal',
    contactLabel: 'Contact',
    headerCtaLabel: 'Start a Project',
    emailAddress: 'hello@stillroom.studio',
    socialLinks: [],
    newsletterHeading: 'Good things, every so often.',
    newsletterDescription: 'Ideas on hospitality, culture, and design.',
    footerTagline: 'Independent by nature.',
    defaultSeoTitle: 'Stillroom',
    defaultSeoDescription: 'Stillroom description',
    defaultSocialImage: {
      decorative: false,
      alt: 'Stillroom collage',
      url: 'https://cdn.sanity.io/social.jpg',
    },
  }
  return { article, journalPage, siteSettings }
})

function createRouteContent(preview: { enabled: boolean }) {
  return createContentRequestStub({
    getSiteSettings: vi.fn(async () => fixtures.siteSettings),
    loadJournalPage: vi.fn(async () => ({
      content: preview.enabled
        ? { ...fixtures.journalPage, heading: 'Draft Journal heading' }
        : fixtures.journalPage,
      siteSettings: fixtures.siteSettings,
    })),
    loadJournalArticlePage: vi.fn(async (slug: string) => {
      if (slug === 'missing' || (slug === 'draft-only' && !preview.enabled)) {
        throw new JournalArticleNotFoundError(slug)
      }
      return {
        content: {
          article: preview.enabled
            ? { ...fixtures.article, title: 'Draft Journal Article' }
            : fixtures.article,
        },
        siteSettings: fixtures.siteSettings,
      }
    }),
  })
}

async function createContainer() {
  const container = await AstroContainer.create()
  container.addServerRenderer({ renderer: reactRenderer })
  container.addClientRenderer({
    name: '@astrojs/react',
    entrypoint: '@astrojs/react/client.js',
  })
  container.insertPageRoute('/404', NotFoundRoute)
  return container
}

describe('Journal routes', () => {
  it('renders the featured article and date-ordered archive from public and preview content', async () => {
    const container = await createContainer()
    const publishedPreview = {
      enabled: false,
      perspective: 'published',
    } as const
    const draftPreview = { enabled: true, perspective: 'drafts' } as const
    const publishedContent = createRouteContent(publishedPreview)
    const published = await container.renderToString(JournalRoute, {
      partial: false,
      request: new Request('https://stillroom.test/journal'),
      locals: {
        preview: publishedPreview,
        content: publishedContent,
      },
    })
    const preview = await container.renderToString(JournalRoute, {
      partial: false,
      request: new Request('https://stillroom.test/journal'),
      locals: {
        preview: draftPreview,
        content: createRouteContent(draftPreview),
      },
    })

    expect(publishedContent.loadJournalPage).toHaveBeenCalledTimes(1)
    expect(published).toContain('Published Journal heading')
    expect(published).toContain('What Makes a Place Stay With Us?')
    expect(published.indexOf('The Quiet Power of a Good Menu.')).toBeLessThan(
      published.indexOf('The Everyday Ritual, Reconsidered.'),
    )
    expect(published).not.toContain('Draft Journal heading')
    expect(preview).toContain('Draft Journal heading')
    expect(preview).toContain('Exit preview')
  })

  it('renders the Journal Article, constrained body, author note, related cards, and SEO fallbacks', async () => {
    const container = await createContainer()
    const preview = { enabled: false, perspective: 'published' } as const
    const content = createRouteContent(preview)
    const html = await container.renderToString(JournalArticleRoute, {
      partial: false,
      params: { slug: 'what-makes-a-place-stay-with-us' },
      request: new Request(
        'https://stillroom.test/journal/what-makes-a-place-stay-with-us',
      ),
      locals: { preview, content },
    })

    expect(content.loadJournalArticlePage).toHaveBeenCalledTimes(1)
    expect(html).toContain('What Makes a Place Stay With Us?')
    expect(html).toContain('Published article paragraph.')
    expect(html).toContain('<h2')
    expect(html).toContain('Published article subheading.')
    expect(html).toContain('Published pull quote.')
    expect(html).toContain('Published author biography.')
    expect(html).toContain('The Quiet Power of a Good Menu.')
    expect(html).toContain(
      '<meta name="description" content="Published standfirst."',
    )
    expect(html).toContain('https://cdn.sanity.io/journal.jpg')
  })

  it('previews an unpublished Journal Article without exposing it publicly', async () => {
    const container = await createContainer()
    const publishedPreview = {
      enabled: false,
      perspective: 'published',
    } as const
    const draftPreview = { enabled: true, perspective: 'drafts' } as const
    const publicResponse = await container.renderToResponse(
      JournalArticleRoute,
      {
        partial: false,
        params: { slug: 'draft-only' },
        request: new Request('https://stillroom.test/journal/draft-only'),
        locals: {
          preview: publishedPreview,
          content: createRouteContent(publishedPreview),
        },
      },
    )
    const previewHtml = await container.renderToString(JournalArticleRoute, {
      partial: false,
      params: { slug: 'draft-only' },
      request: new Request('https://stillroom.test/journal/draft-only'),
      locals: {
        preview: draftPreview,
        content: createRouteContent(draftPreview),
      },
    })

    expect(publicResponse.status).toBe(404)
    expect(previewHtml).toContain('Draft Journal Article')
    expect(previewHtml).toContain('Exit preview')
  })

  it('returns the 404 route for an unknown Journal Article slug', async () => {
    const container = await createContainer()
    const preview = { enabled: false, perspective: 'published' } as const
    const content = createRouteContent(preview)
    const response = await container.renderToResponse(JournalArticleRoute, {
      partial: false,
      params: { slug: 'missing' },
      request: new Request('https://stillroom.test/journal/missing'),
      locals: { preview, content },
    })

    expect(content.loadJournalArticlePage).toHaveBeenCalledTimes(1)
    expect(content.getSiteSettings).toHaveBeenCalledTimes(1)
    expect(response.status).toBe(404)
    expect(await response.text()).toContain('Page not found')
  })
})
