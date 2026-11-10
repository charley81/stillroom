import reactRenderer from '@astrojs/react/server.js'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createContentRequestStub } from '../sanity/content/request.test-support'
import HomeRoute from './index.astro'

const fixtures = vi.hoisted(() => {
  const image = {
    decorative: false,
    alt: 'Published Home image',
    caption: null,
    url: 'https://cdn.sanity.io/home.jpg',
    mobileUrl: null,
  }
  const homePage = {
    _id: 'homePage',
    heroHeading: 'Published Home',
    heroImage: image,
    heroPrimaryCtaLabel: 'Published primary action',
    heroSecondaryCtaLabel: 'Published secondary action',
    clientLogos: ['One', 'Two', 'Three', 'Four', 'Five'].map(
      (clientName, index) => ({
        _id: `client-logo-${index}`,
        clientName,
        url: `https://cdn.sanity.io/logo-${index}.svg`,
        mimeType: 'image/svg+xml',
      }),
    ),
    featuredWorkHeading: 'Published Work heading',
    featuredWorkProjects: [1, 2].map((number) => ({
      _id: `work-project-${number}`,
      title: `Published Work ${number}`,
      slug: `work-${number}`,
      sectorLabel: 'Hospitality',
      cardSummary: `Published Work ${number} summary.`,
      cardImage: image,
      services: [{ _id: 'service-1', title: 'Strategy' }],
      positioningStatement: `Published positioning ${number}.`,
    })),
    featuredWorkCtaLabel: 'Published Work action →',
    featuredServices: [1, 2, 3, 4].map((number) => ({
      _id: `service-${number}`,
      title: `Published Service ${number}`,
      shortSummary: `Published Service ${number} summary.`,
    })),
    sectorLabels: ['Restaurant', 'Hotel', 'Café', 'Food & drink'],
    studioHeading: 'Published studio heading',
    studioIntroduction: 'Published Home SEO description.',
    studioImage: image,
    studioCtaLabel: 'Published studio action →',
    pointOfViewHeading: 'Published point of view heading',
    pointOfViewCopy: 'Published point of view copy.',
    processHeading: 'Published process heading',
    processSteps: [1, 2, 3, 4].map((number) => ({
      _key: String(number),
      _type: 'processStep',
      title: `Step ${number}`,
      description: `Published step ${number}.`,
    })),
    processCtaLabel: 'Published process action →',
    journalHeading: 'Published Journal heading',
    featuredJournalArticles: [1, 2, 3].map((number) => ({
      _id: `journal-article-${number}`,
      title: `Published Article ${number}`,
      slug: `article-${number}`,
      category: {
        _id: 'journal-category-culture',
        title: 'Culture',
        slug: 'culture',
      },
      publicationDate: `2026-10-0${number}`,
      standfirst: `Published standfirst ${number}.`,
      readingTime: '5 min read',
      heroImage: image,
    })),
    journalCtaLabel: 'Published Journal action →',
    finalCtaEyebrow: 'Published final eyebrow',
    finalCtaHeading: 'Published final heading',
    finalCtaLabel: 'Published final action',
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
    defaultSeoTitle: 'Default Stillroom title',
    defaultSeoDescription: 'Default Stillroom description',
    defaultSocialImage: {
      decorative: false,
      alt: 'Default Stillroom collage',
      url: 'https://cdn.sanity.io/default-social.jpg',
    },
  }
  return { homePage, siteSettings }
})

afterEach(() => {
  vi.unstubAllEnvs()
})

async function createContainer() {
  const container = await AstroContainer.create()
  container.addServerRenderer({ renderer: reactRenderer })
  container.addClientRenderer({
    name: '@astrojs/react',
    entrypoint: '@astrojs/react/client.js',
  })
  return container
}

function createHomeContent(preview: { enabled: boolean }) {
  return createContentRequestStub({
    loadHomePage: vi.fn(async () => ({
      content: preview.enabled
        ? { ...fixtures.homePage, heroHeading: 'Draft Home' }
        : fixtures.homePage,
      siteSettings: fixtures.siteSettings,
    })),
  })
}

describe('Home route', () => {
  it('renders published Sanity content without preview controls and uses visible-content SEO fallbacks', async () => {
    const container = await createContainer()
    const content = createHomeContent({ enabled: false })
    const html = await container.renderToString(HomeRoute, {
      partial: false,
      request: new Request('https://stillroom.test/'),
      locals: {
        preview: { enabled: false, perspective: 'published' },
        content,
      },
    })

    expect(content.loadHomePage).toHaveBeenCalledTimes(1)
    expect(html).toContain('Published Home')
    expect(html).toContain('Published point of view copy.')
    expect(html).toContain('Published final action')
    expect(html).toContain('<title>Published Home — Stillroom</title>')
    expect(html).toContain(
      '<meta name="description" content="Published Home SEO description.">',
    )
    expect(html).toContain(
      '<meta property="og:image" content="https://stillroom-app.netlify.app/.netlify/images?url=https%3A%2F%2Fcdn.sanity.io%2Fhome.jpg">',
    )
    expect(html).toContain(
      '<meta name="twitter:image" content="https://stillroom-app.netlify.app/.netlify/images?url=https%3A%2F%2Fcdn.sanity.io%2Fhome.jpg">',
    )
    expect(html).not.toContain('src="https://cdn.sanity.io')
    expect(html).toContain(
      '<link rel="canonical" href="https://stillroom-app.netlify.app/">',
    )
    expect(html).toContain(
      '<meta property="og:url" content="https://stillroom-app.netlify.app/">',
    )
    expect(html).toContain('<script type="application/ld+json"')
    expect(html).toContain('"@type":"WebPage"')
    expect(html).not.toContain('Exit preview')
  })

  it('uses the configured production origin for canonical, social, and structured URLs', async () => {
    vi.stubEnv('PUBLIC_SITE_ORIGIN', 'https://www.stillroom.example')
    const container = await createContainer()
    const html = await container.renderToString(HomeRoute, {
      partial: false,
      request: new Request('https://deploy-preview.example/'),
      locals: {
        preview: { enabled: false, perspective: 'published' },
        content: createHomeContent({ enabled: false }),
      },
    })

    expect(html).toContain(
      '<link rel="canonical" href="https://www.stillroom.example/">',
    )
    expect(html).toContain(
      '<meta property="og:url" content="https://www.stillroom.example/">',
    )
    expect(html).toContain('"url":"https://www.stillroom.example/"')
  })

  it('renders draft content and Visual Editing controls through the same route', async () => {
    const container = await createContainer()
    const html = await container.renderToString(HomeRoute, {
      partial: false,
      request: new Request('https://stillroom.test/'),
      locals: {
        preview: { enabled: true, perspective: 'drafts' },
        content: createHomeContent({ enabled: true }),
      },
    })

    expect(html).toContain('Draft Home')
    expect(html).toContain('Exit preview')
  })
})
