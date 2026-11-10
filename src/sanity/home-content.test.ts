import { describe, expect, it, vi } from 'vitest'
import {
  MissingContentError,
  createContent,
  requireHomePage,
  type HomePage,
} from './content'
import { HOME_PAGE_QUERY } from './queries/home'

const image = {
  decorative: false,
  alt: 'Stillroom hospitality collage',
  caption: null,
  url: 'https://cdn.sanity.io/home.webp',
  mobileUrl: null,
}

const clientLogos = [
  'orlo-house',
  'juniper',
  'fieldwork',
  'the-long-table',
  'morrow',
].map((id) => ({
  _id: `client-logo-${id}`,
  clientName: id.replaceAll('-', ' '),
  url: `https://cdn.sanity.io/${id}.svg`,
  mimeType: 'image/svg+xml',
}))

const workProjects = ['the-good-table', 'orlo-house'].map((slug, index) => ({
  _id: `work-project-${slug}`,
  title: index === 0 ? 'The Good Table' : 'Orlo House',
  slug,
  sectorLabel: index === 0 ? 'Restaurant' : 'Boutique hotel',
  cardSummary: `Published ${slug} summary.`,
  cardImage: { ...image, alt: `${slug} project collage` },
  services: [{ _id: 'service-brand-strategy', title: 'Brand strategy' }],
  positioningStatement: `Published ${slug} positioning.`,
}))

const services = [
  'Brand strategy',
  'Visual identity',
  'Digital design & development',
  'Campaign & content direction',
].map((title, index) => ({
  _id: `service-${index}`,
  title,
  shortSummary: `${title} published summary.`,
}))

const journalArticles = [
  'what-makes-a-place-stay-with-us',
  'the-quiet-power-of-a-good-menu',
  'the-everyday-ritual-reconsidered',
].map((slug, index) => ({
  _id: `journal-article-${slug}`,
  title: `Published article ${index + 1}`,
  slug,
  category: {
    _id: index === 1 ? 'journal-category-design' : 'journal-category-culture',
    title: index === 1 ? 'Design' : 'Culture',
    slug: index === 1 ? 'design' : 'culture',
  },
  publicationDate: `2026-10-${21 - index * 7}`,
  standfirst: `Published article ${index + 1} standfirst.`,
  readingTime: `${5 - index} min read`,
  heroImage: { ...image, alt: `Article ${index + 1} image` },
}))

const page = {
  _id: 'homePage' as const,
  heroHeading: 'Good places.\nGreat company.',
  heroImage: image,
  heroPrimaryCtaLabel: 'Start a Project',
  heroSecondaryCtaLabel: 'View Our Work',
  clientLogos,
  featuredWorkHeading: 'Full of character.',
  featuredWorkProjects: workProjects,
  featuredWorkCtaLabel: 'View Our Work →',
  featuredServices: services,
  sectorLabels: [
    'Restaurants',
    'Boutique hotels',
    'Cafés & bars',
    'Food & drink',
  ],
  studioHeading: 'Small team.\nPlenty of soul.',
  studioIntroduction: 'Published studio introduction.',
  studioImage: image,
  studioCtaLabel: 'Meet Stillroom →',
  pointOfViewHeading: 'A good brand should feel\nlike a place you belong!',
  pointOfViewCopy: 'Published point of view copy.',
  processHeading: 'Good chemistry.',
  processSteps: ['Discover', 'Define', 'Create', 'Launch'].map(
    (title, index) => ({
      _key: String(index + 1),
      _type: 'processStep' as const,
      title,
      description: `${title} published description.`,
    }),
  ),
  processCtaLabel: 'Our process →',
  journalHeading: 'Food for thought.',
  featuredJournalArticles: journalArticles,
  journalCtaLabel: 'Read the Journal →',
  finalCtaEyebrow: 'Something good starts with a conversation',
  finalCtaHeading: 'Pull up a chair.',
  finalCtaLabel: 'Start a Project',
  seo: null,
}

async function loadHomePage(
  result: unknown,
  preview = false,
): Promise<HomePage> {
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
  const queryResult = await content.loadQuery(HOME_PAGE_QUERY)
  return requireHomePage(queryResult.data)
}

describe('Home content requirements', () => {
  it('requires every exact count and rejects duplicate references and sector labels', () => {
    expect(requireHomePage(page).featuredJournalArticles).toHaveLength(3)

    expect(() =>
      requireHomePage({
        ...page,
        featuredWorkProjects: workProjects.slice(0, 1),
      }),
    ).toThrow('exactly two featured Work Project references')
    expect(() =>
      requireHomePage({ ...page, featuredServices: services.slice(0, 3) }),
    ).toThrow('exactly four featured Service references')
    expect(() =>
      requireHomePage({
        ...page,
        featuredJournalArticles: journalArticles.slice(0, 2),
      }),
    ).toThrow('exactly three featured Journal Article references')
    expect(() =>
      requireHomePage({ ...page, clientLogos: clientLogos.slice(0, 4) }),
    ).toThrow('exactly five Client Logo references')
    expect(() =>
      requireHomePage({ ...page, processSteps: page.processSteps.slice(0, 3) }),
    ).toThrow('exactly four process steps')
    expect(() =>
      requireHomePage({ ...page, sectorLabels: ['One', 'Two', 'Three'] }),
    ).toThrow('exactly four unique sector labels')
    expect(() =>
      requireHomePage({
        ...page,
        featuredWorkProjects: [workProjects[0], workProjects[0]],
      }),
    ).toThrow('two unique featured Work Project references')
    expect(() =>
      requireHomePage({
        ...page,
        sectorLabels: ['Restaurants', ' restaurants ', 'Hotels', 'Cafés'],
      }),
    ).toThrow('exactly four unique sector labels')
  })

  it('fails clearly for missing singleton or incomplete direct and referenced content', () => {
    expect(() => requireHomePage(null)).toThrow(MissingContentError)
    expect(() => requireHomePage({ ...page, heroHeading: '' })).toThrow(
      'heroHeading',
    )
    expect(() =>
      requireHomePage({
        ...page,
        featuredServices: [
          { ...services[0], shortSummary: '' },
          ...services.slice(1),
        ],
      }),
    ).toThrow('featuredServices[0]')
    expect(() =>
      requireHomePage({
        ...page,
        featuredJournalArticles: [
          { ...journalArticles[0], heroImage: { ...image, alt: '' } },
          ...journalArticles.slice(1),
        ],
      }),
    ).toThrow('featuredJournalArticles[0].heroImage.alt')
  })

  it('propagates referenced Work Project, Service, Journal Article, and Client Logo changes', () => {
    const changed = requireHomePage({
      ...page,
      featuredWorkProjects: [
        { ...workProjects[0], title: 'Changed Work Project' },
        workProjects[1],
      ],
      featuredServices: [
        { ...services[0], title: 'Changed Service' },
        ...services.slice(1),
      ],
      featuredJournalArticles: [
        { ...journalArticles[0], title: 'Changed Journal Article' },
        ...journalArticles.slice(1),
      ],
      clientLogos: [
        { ...clientLogos[0], clientName: 'Changed Client Logo' },
        ...clientLogos.slice(1),
      ],
    })

    expect(changed.featuredWorkProjects[0].title).toBe('Changed Work Project')
    expect(changed.featuredServices[0].title).toBe('Changed Service')
    expect(changed.featuredJournalArticles[0].title).toBe(
      'Changed Journal Article',
    )
    expect(changed.clientLogos[0].clientName).toBe('Changed Client Logo')
  })

  it('loads published and draft Home content through the same page-level typed query', async () => {
    const published = await loadHomePage(page)
    const draft = await loadHomePage(
      { ...page, heroHeading: 'Draft Home heading' },
      true,
    )

    expect(published.heroHeading).toBe('Good places.\nGreat company.')
    expect(draft.heroHeading).toBe('Draft Home heading')
  })
})
