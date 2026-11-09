import reactRenderer from '@astrojs/react/server.js'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { describe, expect, it, vi } from 'vitest'
import NotFoundRoute from './404.astro'
import WorkProjectRoute from './work/[slug].astro'
import WorkRoute from './work/index.astro'

const fixtures = vi.hoisted(() => {
  const image = {
    decorative: false,
    alt: 'Hospitality identity materials',
    caption: null,
    url: 'https://cdn.sanity.io/work.jpg',
    mobileUrl: null,
  }
  const text = (copy: string) => [
    {
      _key: copy,
      _type: 'block',
      style: 'normal',
      markDefs: [],
      children: [
        { _key: `${copy}-span`, _type: 'span', marks: [], text: copy },
      ],
    },
  ]
  const cards = ['the-good-table', 'orlo-house'].map((slug, index) => ({
    _id: `work-project-${slug}`,
    title: index === 0 ? 'The Good Table' : 'Orlo House',
    slug,
    sectorLabel: 'Restaurant',
    cardSummary: `Published Work summary ${index + 1}`,
    cardImage: image,
    services: [{ _id: 'service-brand-strategy', title: 'Brand strategy' }],
    positioningStatement: `Published positioning ${index + 1}`,
  }))
  const workPage = {
    _id: 'workPage',
    heading: 'Published Work heading',
    heroArtwork: image,
    workProjects: cards,
    finalCtaEyebrow: 'Published Work eyebrow',
    finalCtaHeading: 'Published Work invitation',
    finalCtaLabel: 'Start a Project',
    seo: null,
  }
  const project = {
    ...cards[0],
    introduction: 'Published Work Project introduction.',
    heroArtwork: image,
    heroPhotograph: image,
    challenge: { heading: 'Published challenge', content: text('Challenge') },
    contribution: {
      heading: 'Published contribution',
      content: text('Contribution'),
    },
    galleryHeading: 'Published gallery heading',
    gallery: [{ _key: 'one', _type: 'workProjectGalleryImage', image }],
    outcomeHeading: 'Published outcome',
    outcomeCopy: text('Published outcome copy.'),
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
  return { project, siteSettings, workPage }
})

vi.mock('../sanity/content', () => {
  class WorkProjectNotFoundError extends Error {}
  return {
    WorkProjectNotFoundError,
    getSiteSettings: vi.fn(async () => fixtures.siteSettings),
    getWorkPage: vi.fn(async (preview) =>
      preview.enabled
        ? { ...fixtures.workPage, heading: 'Draft Work heading' }
        : fixtures.workPage,
    ),
    getWorkProjectPage: vi.fn(async (slug, preview) => {
      if (slug === 'missing') throw new WorkProjectNotFoundError()
      return {
        page: fixtures.workPage,
        project: preview.enabled
          ? { ...fixtures.project, title: 'Draft Work Project' }
          : fixtures.project,
        nextProject: fixtures.workPage.workProjects[1],
        nextProjectNumber: 2,
      }
    }),
  }
})

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

describe('Work routes', () => {
  it('renders the ordered Work listing from published and preview Sanity content', async () => {
    const container = await createContainer()
    const published = await container.renderToString(WorkRoute, {
      partial: false,
      request: new Request('https://stillroom.test/work'),
      locals: { preview: { enabled: false, perspective: 'published' } },
    })
    const preview = await container.renderToString(WorkRoute, {
      partial: false,
      request: new Request('https://stillroom.test/work'),
      locals: { preview: { enabled: true, perspective: 'drafts' } },
    })

    expect(published).toContain('Published Work heading')
    expect(published.indexOf('The Good Table')).toBeLessThan(
      published.indexOf('Orlo House'),
    )
    expect(preview).toContain('Draft Work heading')
    expect(preview).toContain('Exit preview')
  })

  it('renders published and changed Work Projects through the same route', async () => {
    const container = await createContainer()
    const published = await container.renderToString(WorkProjectRoute, {
      partial: false,
      params: { slug: 'the-good-table' },
      request: new Request('https://stillroom.test/work/the-good-table'),
      locals: { preview: { enabled: false, perspective: 'published' } },
    })
    const preview = await container.renderToString(WorkProjectRoute, {
      partial: false,
      params: { slug: 'the-good-table' },
      request: new Request('https://stillroom.test/work/the-good-table'),
      locals: { preview: { enabled: true, perspective: 'drafts' } },
    })

    expect(published).toContain('The Good Table')
    expect(published).toContain('Published challenge')
    expect(published).toContain('Published outcome copy.')
    expect(published).toContain('Next project / 02')
    expect(published).toContain('href="/work/orlo-house"')
    expect(published).toContain('alt="Hospitality identity materials"')
    expect(published).not.toContain('Draft Work Project')
    expect(preview).toContain('Draft Work Project')
    expect(preview).toContain('Exit preview')
  })

  it('returns the 404 route for an unknown Work Project slug', async () => {
    const container = await createContainer()
    const response = await container.renderToResponse(WorkProjectRoute, {
      partial: false,
      params: { slug: 'missing' },
      request: new Request('https://stillroom.test/work/missing'),
      locals: { preview: { enabled: false, perspective: 'published' } },
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toContain('Page not found')
  })
})
