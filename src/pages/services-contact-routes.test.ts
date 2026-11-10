import reactRenderer from '@astrojs/react/server.js'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { describe, expect, it, vi } from 'vitest'
import { createContentRequestStub } from '../sanity/content/request.test-support'
import ContactRoute from './contact.astro'
import ServicesRoute from './services.astro'

const fixtures = vi.hoisted(() => {
  const image = {
    decorative: false,
    alt: 'Hospitality brand materials',
    caption: null,
    url: 'https://cdn.sanity.io/image.jpg',
    mobileUrl: null,
  }
  const services = [
    'Brand strategy',
    'Visual identity',
    'Digital design & development',
    'Campaign & content direction',
  ].map((title, index) => ({
    _id: `service-${index}`,
    title,
    shortSummary: `${title} summary`,
    description: `${title} description`,
    image,
    deliverables: [`${title} deliverable`],
  }))
  const servicesPage = {
    _id: 'servicesPage',
    heroHeading: 'Published Services',
    heroIntroduction: 'Published Services introduction.',
    heroImage: image,
    heroCtaLabel: 'Start a Project',
    services,
    processHeading: 'Published process',
    processSteps: [1, 2, 3, 4].map((number) => ({
      _key: String(number),
      title: `Step ${number}`,
      description: `Step ${number} description`,
    })),
    hospitalityHeading: 'Published hospitality',
    hospitalitySectorLabels: ['Restaurants', 'Hotels'],
    hospitalityPointOfView: 'Published point of view.',
    hospitalityImage: image,
    hospitalityCtaLabel: 'Explore work',
    finalStatementEyebrow: 'Published eyebrow',
    finalStatementHeading: 'Published final statement',
    seo: null,
  }
  const contactPage = {
    _id: 'contactPage',
    heading: 'Published Contact',
    introduction: 'Published Contact introduction.',
    supportingImage: image,
    supportingStatement: 'Published supporting statement.',
    seo: null,
    serviceOptions: services.map(({ title }) => ({
      label: title,
      value: title,
    })),
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
  return { contactPage, servicesPage, siteSettings }
})

function createRouteContent(preview: { enabled: boolean }) {
  return createContentRequestStub({
    loadServicesPage: vi.fn(async () => ({
      content: preview.enabled
        ? { ...fixtures.servicesPage, heroHeading: 'Draft Services' }
        : fixtures.servicesPage,
      siteSettings: fixtures.siteSettings,
    })),
    loadContactPage: vi.fn(async () => ({
      content: preview.enabled
        ? { ...fixtures.contactPage, heading: 'Draft Contact' }
        : fixtures.contactPage,
      siteSettings: fixtures.siteSettings,
    })),
  })
}

async function createContainer() {
  const container = await AstroContainer.create()
  container.addServerRenderer({ renderer: reactRenderer })
  container.addClientRenderer({
    name: '@astrojs/react',
    entrypoint: '@astrojs/react/client.js',
  })
  return container
}

describe('Services and Contact routes', () => {
  it('renders published content without preview controls', async () => {
    const container = await createContainer()
    const published = { enabled: false, perspective: 'published' } as const
    const servicesContent = createRouteContent(published)
    const contactContent = createRouteContent(published)
    const services = await container.renderToString(ServicesRoute, {
      partial: false,
      request: new Request('https://stillroom.test/services'),
      locals: { preview: published, content: servicesContent },
    })
    const contact = await container.renderToString(ContactRoute, {
      partial: false,
      request: new Request('https://stillroom.test/contact'),
      locals: { preview: published, content: contactContent },
    })

    expect(servicesContent.loadServicesPage).toHaveBeenCalledTimes(1)
    expect(contactContent.loadContactPage).toHaveBeenCalledTimes(1)
    expect(services).toContain('Published Services')
    expect(contact).toContain('Published Contact')
    expect(services).not.toContain('Exit preview')
    expect(contact).not.toContain('Exit preview')
  })

  it('renders draft content and preview controls through the same routes', async () => {
    const container = await createContainer()
    const preview = { enabled: true, perspective: 'drafts' } as const
    const services = await container.renderToString(ServicesRoute, {
      partial: false,
      request: new Request('https://stillroom.test/services'),
      locals: { preview, content: createRouteContent(preview) },
    })
    const contact = await container.renderToString(ContactRoute, {
      partial: false,
      request: new Request('https://stillroom.test/contact'),
      locals: { preview, content: createRouteContent(preview) },
    })

    expect(services).toContain('Draft Services')
    expect(contact).toContain('Draft Contact')
    expect(services).toContain('Exit preview')
    expect(contact).toContain('Exit preview')
  })
})
