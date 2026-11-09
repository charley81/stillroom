import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { describe, expect, it, vi } from 'vitest'
import {
  createContent,
  requireServicesPage,
  type ServicesPage,
} from '../../sanity/content'
import { SERVICES_PAGE_QUERY } from '../../sanity/queries/services-contact'
import ContactInquiry from '../contact/ContactInquiry.astro'
import HospitalityFocus from './HospitalityFocus.astro'
import ServiceProcess from './ServiceProcess.astro'
import ServicesCatalog from './ServicesCatalog.astro'
import ServicesHero from './ServicesHero.astro'

const image = {
  decorative: false,
  alt: 'Hospitality brand materials on a table',
  caption: null,
  url: 'https://cdn.sanity.io/services.jpg',
  mobileUrl: null,
}

const services = [
  {
    _id: 'service-brand-strategy',
    title: 'Brand strategy',
    shortSummary: 'Find the idea worth building around.',
    description: 'Published brand strategy description.',
    image,
    deliverables: ['Discovery & research'],
  },
  {
    _id: 'service-visual-identity',
    title: 'Visual identity',
    shortSummary: 'A character all your own.',
    description: 'Published visual identity description.',
    image,
    deliverables: ['Logo & identity system'],
  },
  {
    _id: 'service-digital-design-development',
    title: 'Digital design & development',
    shortSummary: 'An experience before the experience.',
    description: 'Published digital description.',
    image,
    deliverables: ['Website design'],
  },
  {
    _id: 'service-campaign-content-direction',
    title: 'Campaign & content direction',
    shortSummary: 'Give your story a life beyond launch.',
    description: 'Published campaign description.',
    image,
    deliverables: ['Campaign concepts'],
  },
]

const page = {
  _id: 'servicesPage' as const,
  heroHeading: 'Published services heading',
  heroIntroduction: 'Published services introduction.',
  heroImage: image,
  heroCtaLabel: 'Start a Project',
  services,
  processHeading: 'Published process heading',
  processSteps: [
    { _key: '1', title: 'Discover', description: 'Published discovery.' },
    { _key: '2', title: 'Define', description: 'Published definition.' },
    { _key: '3', title: 'Create', description: 'Published creation.' },
    { _key: '4', title: 'Launch', description: 'Published launch.' },
  ],
  hospitalityHeading: 'Published hospitality heading',
  hospitalitySectorLabels: ['Restaurants', 'Boutique hotels'],
  hospitalityPointOfView: 'Published hospitality point of view.',
  hospitalityImage: image,
  hospitalityCtaLabel: 'Explore published work',
  finalStatementEyebrow: 'Published eyebrow',
  finalStatementHeading: 'Published final statement',
  seo: null,
}

async function loadServicesPage(
  result: unknown,
  preview = false,
): Promise<ServicesPage> {
  const fetch = vi.fn().mockResolvedValue({
    result,
    resultSourceMap: preview ? { mappings: {} } : undefined,
  })
  const content = createContent(
    { projectId: 'project', dataset: 'development' },
    preview
      ? {
          preview: { enabled: true, perspective: 'drafts' },
          readToken: 'server-read-token',
        }
      : {},
    vi.fn().mockReturnValue({ fetch }),
  )
  const queryResult = await content.loadQuery(SERVICES_PAGE_QUERY)
  return requireServicesPage(queryResult.data)
}

describe('Services and Contact rendering', () => {
  it('renders published and preview content through the same typed query path and components', async () => {
    const container = await AstroContainer.create()
    const publishedPage = await loadServicesPage(page)
    const draftPage = await loadServicesPage(
      {
        ...page,
        heroHeading: 'Draft services heading',
        heroIntroduction: 'Draft services introduction.',
      },
      true,
    )
    const published = await container.renderToString(ServicesHero, {
      props: { page: publishedPage },
    })
    const preview = await container.renderToString(ServicesHero, {
      props: { page: draftPage },
    })

    expect(published).toContain('Published services heading')
    expect(published).toContain('Published services introduction.')
    expect(preview).toContain('Draft services heading')
    expect(preview).toContain('Draft services introduction.')
    expect(preview).toContain('href="/contact"')
  })

  it('renders all Sanity-owned Services sections without changing fixed labels or routes', async () => {
    const container = await AstroContainer.create()
    const [catalog, process, hospitality] = await Promise.all([
      container.renderToString(ServicesCatalog, { props: { page } }),
      container.renderToString(ServiceProcess, { props: { page } }),
      container.renderToString(HospitalityFocus, { props: { page } }),
    ])

    expect(catalog).toContain('Brand<br>strategy')
    expect(catalog).toContain('Published brand strategy description.')
    expect(catalog).toContain('Discovery &amp; research')
    expect(catalog).toContain('Our services')
    expect(catalog).toContain('What we shape')
    expect(process).toContain('Published process heading')
    expect(process).toContain('01')
    expect(hospitality).toContain('Published hospitality point of view.')
    expect(hospitality).toContain('href="/work"')
  })

  it('renders Contact editorial content and shared Service options while keeping form behavior fixed', async () => {
    const container = await AstroContainer.create()
    const html = await container.renderToString(ContactInquiry, {
      props: {
        page: {
          _id: 'contactPage',
          heading: 'Draft contact heading',
          introduction: 'Draft contact introduction.',
          supportingImage: image,
          supportingStatement: 'Draft supporting statement.',
          seo: null,
          serviceOptions: services.map(({ title }) => ({
            label: title,
            value: title,
          })),
        },
      },
    })

    expect(html).toContain('Draft contact heading')
    expect(html).toContain('Draft contact introduction.')
    expect(html).toContain('Draft supporting statement.')
    expect(html).toContain('value="Brand strategy"')
    expect(html).toContain('Digital design &amp; development')
    expect(html).toContain('Tell us about your project')
    expect(html).toContain('data-contact-form')
    expect(html).toContain('data-form-status')
  })
})
