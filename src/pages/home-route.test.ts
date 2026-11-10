import reactRenderer from '@astrojs/react/server.js'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { describe, expect, it, vi } from 'vitest'
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

vi.mock('../sanity/content', () => ({
  getSiteSettings: vi.fn(async () => fixtures.siteSettings),
  getHomePage: vi.fn(async (preview) =>
    preview.enabled
      ? { ...fixtures.homePage, heroHeading: 'Draft Home' }
      : fixtures.homePage,
  ),
}))

async function createContainer() {
  const container = await AstroContainer.create()
  container.addServerRenderer({ renderer: reactRenderer })
  container.addClientRenderer({
    name: '@astrojs/react',
    entrypoint: '@astrojs/react/client.js',
  })
  return container
}

describe('Home route', () => {
  it('renders published Sanity content without preview controls and uses visible-content SEO fallbacks', async () => {
    const container = await createContainer()
    const html = await container.renderToString(HomeRoute, {
      partial: false,
      request: new Request('https://stillroom.test/'),
      locals: { preview: { enabled: false, perspective: 'published' } },
    })

    expect(html).toContain('Published Home')
    expect(html).toContain('Published point of view copy.')
    expect(html).toContain('Published final action')
    expect(html).toContain('<title>Published Home — Stillroom</title>')
    expect(html).toContain(
      '<meta name="description" content="Published Home SEO description.">',
    )
    expect(html).toContain(
      '<meta property="og:image" content="https://cdn.sanity.io/home.jpg">',
    )
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

  it('renders draft content and Visual Editing controls through the same route', async () => {
    const container = await createContainer()
    const html = await container.renderToString(HomeRoute, {
      partial: false,
      request: new Request('https://stillroom.test/'),
      locals: { preview: { enabled: true, perspective: 'drafts' } },
    })

    expect(html).toContain('Draft Home')
    expect(html).toContain('Exit preview')
  })
})
