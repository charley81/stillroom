import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { describe, expect, it } from 'vitest'
import type { HomePage } from '../../sanity/content'
import HomeHero from './HomeHero.astro'
import JournalHighlights from './JournalHighlights.astro'
import ProcessOverview from './ProcessOverview.astro'
import SelectedConcepts from './SelectedConcepts.astro'
import ServicesOverview from './ServicesOverview.astro'
import StudioIntro from './StudioIntro.astro'

const image = {
  decorative: false,
  alt: 'Published image alternative text',
  caption: null,
  url: 'https://cdn.sanity.io/published.webp',
  mobileUrl: null,
}

const page = {
  _id: 'homePage',
  heroHeading: 'Published hero heading',
  heroImage: image,
  heroPrimaryCtaLabel: 'Published primary action',
  heroSecondaryCtaLabel: 'Published secondary action',
  clientLogos: [],
  featuredWorkHeading: 'Published Work heading',
  featuredWorkProjects: ['first-project', 'second-project'].map(
    (slug, index) => ({
      _id: `work-project-${slug}`,
      title: `Published Work Project ${index + 1}`,
      slug,
      sectorLabel: 'Hospitality',
      cardSummary: `Published Work summary ${index + 1}.`,
      cardImage: image,
      services: [{ _id: 'service-strategy', title: 'Strategy' }],
      positioningStatement: `Published positioning ${index + 1}.`,
    }),
  ),
  featuredWorkCtaLabel: 'Published Work action →',
  featuredServices: [1, 2, 3, 4].map((number) => ({
    _id: `service-${number}`,
    title: `Published Service ${number}`,
    shortSummary: `Published Service ${number} summary.`,
  })),
  sectorLabels: ['One', 'Two', 'Three', 'Four'],
  studioHeading: 'Published studio heading',
  studioIntroduction: 'Published studio introduction.',
  studioImage: image,
  studioCtaLabel: 'Published studio action →',
  pointOfViewHeading: 'Published point of view heading',
  pointOfViewCopy: 'Published point of view copy.',
  processHeading: 'Published process heading',
  processSteps: ['Discover', 'Define', 'Create', 'Launch'].map(
    (title, index) => ({
      _key: String(index),
      _type: 'processStep',
      title,
      description: `${title} published description.`,
    }),
  ),
  processCtaLabel: 'Published process action →',
  journalHeading: 'Published Journal heading',
  featuredJournalArticles: [1, 2, 3].map((number) => ({
    _id: `journal-article-${number}`,
    title: `Published Journal Article ${number}`,
    slug: `article-${number}`,
    category: {
      _id: 'journal-category-culture',
      title: 'Culture',
      slug: 'culture',
    },
    publicationDate: `2026-10-${number.toString().padStart(2, '0')}`,
    standfirst: `Published article ${number} standfirst.`,
    readingTime: `${number + 2} min read`,
    heroImage: image,
  })),
  journalCtaLabel: 'Published Journal action →',
  finalCtaEyebrow: 'Published final eyebrow',
  finalCtaHeading: 'Published final heading',
  finalCtaLabel: 'Published final action',
  seo: null,
} satisfies HomePage

describe('Home rendering', () => {
  it('renders the Sanity hero while keeping Contact and Work destinations fixed', async () => {
    const container = await AstroContainer.create()
    const html = await container.renderToString(HomeHero, { props: { page } })

    expect(html).toContain('Published hero heading')
    expect(html).toContain('Published primary action')
    expect(html).toContain('href="/contact"')
    expect(html).toContain('Published secondary action')
    expect(html).toContain('href="/work"')
    expect(html).toContain('src="https://cdn.sanity.io/published.webp"')
  })

  it('renders referenced Work Projects and Services without duplicate card content', async () => {
    const container = await AstroContainer.create()
    const [work, services] = await Promise.all([
      container.renderToString(SelectedConcepts, { props: { page } }),
      container.renderToString(ServicesOverview, { props: { page } }),
    ])

    expect(work).toContain('Published Work heading')
    expect(work).toContain('Published Work Project 1')
    expect(work).toContain('Published Work summary 2.')
    expect(work).toContain('href="/work/first-project"')
    expect(work).toContain('Published Work action →')
    expect(services).toContain('Published Service 4')
    expect(services).toContain('Published Service 4 summary.')
    expect(services).toContain('href="/services"')
  })

  it('renders direct studio and process content with fixed About and Services destinations', async () => {
    const container = await AstroContainer.create()
    const [studio, process] = await Promise.all([
      container.renderToString(StudioIntro, { props: { page } }),
      container.renderToString(ProcessOverview, { props: { page } }),
    ])

    expect(studio).toContain('Published studio heading')
    expect(studio).toContain('Published studio introduction.')
    expect(studio).toContain('href="/about"')
    expect(process).toContain('Published process heading')
    expect(process).toContain('Launch published description.')
    expect(process).toContain('href="/services"')
  })

  it('renders referenced Journal Articles and keeps the Journal destination fixed', async () => {
    const container = await AstroContainer.create()
    const html = await container.renderToString(JournalHighlights, {
      props: { page },
    })

    expect(html).toContain('Published Journal heading')
    expect(html).toContain('Published Journal Article 3')
    expect(html).toContain('Culture / 5 min read')
    expect(html).toContain('href="/journal/article-3"')
    expect(html).toContain('Published Journal action →')
  })
})
