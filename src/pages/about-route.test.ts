import reactRenderer from '@astrojs/react/server.js'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { describe, expect, it, vi } from 'vitest'
import type { AboutPage } from '../sanity/content/about'
import { createContentRequestStub } from '../sanity/content/request.test-support'
import type { SiteSettings } from '../sanity/content/site-settings'
import AboutRoute from './about.astro'

const image = {
  decorative: false,
  alt: 'Stillroom studio materials',
  caption: null,
  url: 'https://cdn.sanity.io/studio.webp',
  mobileUrl: null,
}

const page: AboutPage = {
  _id: 'aboutPage',
  heading: 'Published About heading',
  heroImage: image,
  founderHeading: 'Published founder heading',
  founderStory: [
    {
      _key: 'story',
      _type: 'block',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _key: 'span',
          _type: 'span',
          text: 'Published founder story.',
          marks: [],
        },
      ],
    },
  ],
  founderName: 'Alex Morgan',
  founderRole: 'Founder & Creative Director',
  founderImage: image,
  teamHeading: 'Published team heading',
  teamIntroduction: 'Published team introduction.',
  teamMembers: ['Alex', 'Maya', 'Sam'].map((name, index) => ({
    _key: String(index),
    _type: 'teamProfile',
    name,
    role: 'Design',
    biography: `${name} published biography.`,
    portrait: { ...image, alt: `${name} portrait` },
  })),
  principlesHeading: 'Published principles heading',
  principles: ['Character', 'Closer', 'Care'].map((title, index) => ({
    _key: String(index),
    _type: 'workingPrinciple',
    title,
    description: `${title} published description.`,
  })),
  clientProofHeading: 'Published client proof heading',
  clientProofCopy: 'Published client proof copy.',
  clientLogos: ['One', 'Two', 'Three', 'Four', 'Five'].map(
    (clientName, index) => ({
      _id: `client-logo-${index}`,
      clientName,
      url: `https://cdn.sanity.io/${index}.svg`,
      mimeType: 'image/svg+xml',
    }),
  ),
  clientProofCtaLabel: 'Explore our work →',
  finalCtaEyebrow: 'Published invitation eyebrow.',
  finalCtaHeading: 'Pull up a chair.',
  finalCtaLabel: 'Start a Project',
  seo: null,
}

const siteSettings: SiteSettings = {
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

async function createContainer() {
  const container = await AstroContainer.create()
  container.addServerRenderer({ renderer: reactRenderer })
  container.addClientRenderer({
    name: '@astrojs/react',
    entrypoint: '@astrojs/react/client.js',
  })
  return container
}

describe('About route', () => {
  it('renders complete content through one request-scoped content load', async () => {
    const loadAboutPage = vi.fn(async () => ({ content: page, siteSettings }))
    const content = createContentRequestStub({ loadAboutPage })
    const container = await createContainer()
    const html = await container.renderToString(AboutRoute, {
      partial: false,
      request: new Request('https://stillroom.test/about'),
      locals: {
        preview: { enabled: false, perspective: 'published' },
        content,
      },
    })

    expect(loadAboutPage).toHaveBeenCalledTimes(1)
    expect(html).toContain('Published About heading')
    expect(html).toContain('Published founder story.')
    expect(html).toContain('Published client proof copy.')
    expect(html).not.toContain('Exit preview')
  })
})
