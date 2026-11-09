import { describe, expect, it } from 'vitest'
import {
  MissingContentError,
  requireContactPage,
  requireServicesPage,
} from './content'

const image = {
  decorative: false,
  alt: 'Hands arranging hospitality brand materials',
  url: 'https://cdn.sanity.io/image.jpg',
  mobileUrl: null,
}

const services = [
  {
    _id: 'service-brand-strategy',
    title: 'Brand strategy',
    shortSummary: 'Find the idea worth building around.',
    description: 'Find the idea worth building around.',
    image,
    deliverables: ['Discovery & research'],
  },
  {
    _id: 'service-visual-identity',
    title: 'Visual identity',
    shortSummary: 'A character all your own.',
    description: 'A character all your own.',
    image,
    deliverables: ['Logo & identity system'],
  },
  {
    _id: 'service-digital-design-development',
    title: 'Digital design & development',
    shortSummary: 'An experience before the experience.',
    description: 'An experience before the experience.',
    image,
    deliverables: ['Website design'],
  },
  {
    _id: 'service-campaign-content-direction',
    title: 'Campaign & content direction',
    shortSummary: 'Give your story a life beyond the launch.',
    description: 'Give your story a life beyond the launch.',
    image,
    deliverables: ['Campaign concepts'],
  },
]

const servicesPage = {
  _id: 'servicesPage',
  heroHeading: 'A little thinking.',
  heroIntroduction: 'Thoughtfully connected hospitality brands.',
  heroImage: image,
  heroCtaLabel: 'Start a Project',
  services,
  processHeading: 'The whole is better together.',
  processSteps: [
    { _key: 'discover', title: 'Discover', description: 'Get close.' },
    { _key: 'define', title: 'Define', description: 'Find direction.' },
    { _key: 'create', title: 'Create', description: 'Bring it to life.' },
    { _key: 'launch', title: 'Launch', description: 'Open confidently.' },
  ],
  hospitalityHeading: 'For places with character.',
  hospitalitySectorLabels: [
    'Restaurants',
    'Boutique hotels',
    'Cafés & bars',
    'Food & drink',
  ],
  hospitalityPointOfView: 'The best hospitality brands create a feeling.',
  hospitalityImage: image,
  hospitalityCtaLabel: 'Explore our hospitality concepts',
  finalStatementEyebrow: 'Something good starts here',
  finalStatementHeading: 'Bring it all together.',
  seo: null,
}

const contactPage = {
  page: {
    _id: 'contactPage',
    heading: 'Pull up a chair.',
    introduction: 'Every good collaboration starts with a conversation.',
    supportingImage: image,
    supportingStatement: 'A little thinking. A lot of possibility.',
    seo: null,
  },
  services: services.map(({ _id, title }) => ({ _id, title })),
}

describe('Services and Contact content requirements', () => {
  it('accepts exactly four unique Services and process steps', () => {
    expect(requireServicesPage(servicesPage).services).toHaveLength(4)

    expect(() =>
      requireServicesPage({
        ...servicesPage,
        services: services.slice(0, 3),
      }),
    ).toThrow('exactly four Services')
    expect(() =>
      requireServicesPage({
        ...servicesPage,
        services: [services[0], services[0], services[2], services[3]],
      }),
    ).toThrow('unique Services')
    expect(() =>
      requireServicesPage({
        ...servicesPage,
        processSteps: servicesPage.processSteps.slice(0, 3),
      }),
    ).toThrow('exactly four process steps')
  })

  it('requires accessible editorial images and complete Service content', () => {
    expect(() =>
      requireServicesPage({
        ...servicesPage,
        services: [
          { ...services[0], image: { ...image, alt: '' } },
          ...services.slice(1),
        ],
      }),
    ).toThrow('services[0].image.alt')
    expect(() =>
      requireServicesPage({
        ...servicesPage,
        services: [
          { ...services[0], deliverables: ['Research', ' research '] },
          ...services.slice(1),
        ],
      }),
    ).toThrow('unique deliverables')
  })

  it('uses the four Services-page references as Contact form options', () => {
    const contact = requireContactPage(contactPage)

    expect(contact.serviceOptions).toEqual([
      { value: 'Brand strategy', label: 'Brand strategy' },
      { value: 'Visual identity', label: 'Visual identity' },
      {
        value: 'Digital design & development',
        label: 'Digital design & development',
      },
      {
        value: 'Campaign & content direction',
        label: 'Campaign & content direction',
      },
    ])
  })

  it('fails clearly when required singleton content is missing', () => {
    expect(() => requireServicesPage(null)).toThrow(MissingContentError)
    expect(() => requireContactPage({ page: null, services: [] })).toThrow(
      'Required Contact document',
    )
  })
})
