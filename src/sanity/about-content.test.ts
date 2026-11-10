import { describe, expect, it, vi } from 'vitest'
import {
  MissingContentError,
  createContent,
  requireAboutPage,
  type AboutPage,
} from './content'
import { ABOUT_PAGE_QUERY } from './queries/about'

const image = {
  decorative: false,
  alt: 'Stillroom studio materials arranged on a table',
  caption: null,
  url: 'https://cdn.sanity.io/studio.webp',
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

const page = {
  _id: 'aboutPage' as const,
  heading: 'Small team.\nPlenty of soul.',
  heroImage: image,
  founderHeading: 'It starts\nwith a feeling.',
  founderStory: [
    {
      _key: 'story',
      _type: 'block' as const,
      style: 'normal' as const,
      markDefs: [],
      children: [
        {
          _key: 'story-span',
          _type: 'span' as const,
          marks: [],
          text: 'The places we remember are about a feeling.',
        },
      ],
    },
  ],
  founderName: 'Alex Morgan',
  founderRole: 'Founder & Creative Director',
  founderImage: image,
  teamHeading: 'Good company.',
  teamIntroduction: 'A close-knit team with the right collaborators.',
  teamMembers: ['Alex Morgan', 'Maya Chen', 'Sam Rivera'].map(
    (name, index) => ({
      _key: String(index + 1),
      _type: 'teamProfile' as const,
      name,
      role: 'Design',
      biography: `${name} biography.`,
      portrait: { ...image, alt: `${name} portrait` },
    }),
  ),
  principlesHeading: 'Good work.\nGood chemistry.',
  principles: [
    'Character over convention.',
    'Closer is better.',
    'Care in every detail.',
  ].map((title, index) => ({
    _key: String(index + 1),
    _type: 'workingPrinciple' as const,
    title,
    description: `${title} Description.`,
  })),
  clientProofHeading: 'Made for people\nwho care.',
  clientProofCopy: 'Restaurants, hotels, cafés and food & drink brands.',
  clientLogos,
  clientProofCtaLabel: 'Explore our work →',
  finalCtaEyebrow: 'Good people. Good projects. Let’s meet.',
  finalCtaHeading: 'Pull up a chair.',
  finalCtaLabel: 'Start a Project',
  seo: null,
}

async function loadAboutPage(
  result: unknown,
  preview = false,
): Promise<AboutPage> {
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
  const queryResult = await content.loadQuery(ABOUT_PAGE_QUERY)
  return requireAboutPage(queryResult.data)
}

describe('About content requirements', () => {
  it('accepts exactly three team profiles, three principles, and five unique Client Logos', () => {
    expect(requireAboutPage(page).clientLogos).toHaveLength(5)

    expect(() =>
      requireAboutPage({ ...page, teamMembers: page.teamMembers.slice(0, 2) }),
    ).toThrow('exactly three team profiles')
    expect(() =>
      requireAboutPage({ ...page, principles: page.principles.slice(0, 2) }),
    ).toThrow('exactly three working principles')
    expect(() =>
      requireAboutPage({
        ...page,
        clientLogos: [clientLogos[0], clientLogos[0], ...clientLogos.slice(2)],
      }),
    ).toThrow('five unique Client Logo references')
  })

  it('requires complete accessible images, constrained rich text, and SVG-safe Client Logos', () => {
    expect(() =>
      requireAboutPage({
        ...page,
        teamMembers: [
          { ...page.teamMembers[0], portrait: { ...image, alt: '' } },
          ...page.teamMembers.slice(1),
        ],
      }),
    ).toThrow('teamMembers[0].portrait.alt')
    expect(() => requireAboutPage({ ...page, founderStory: [] })).toThrow(
      'founderStory',
    )
    expect(() =>
      requireAboutPage({
        ...page,
        clientLogos: [
          { ...clientLogos[0], clientName: '' },
          ...clientLogos.slice(1),
        ],
      }),
    ).toThrow('About clientLogos[0] is missing required content: clientName')
    expect(requireAboutPage(page).clientLogos[0]).toEqual(
      expect.objectContaining({ mimeType: 'image/svg+xml' }),
    )
  })

  it('fails clearly when the About singleton is missing', () => {
    expect(() => requireAboutPage(null)).toThrow(MissingContentError)
  })

  it('loads published and draft About content through the same typed query', async () => {
    const published = await loadAboutPage(page)
    const draft = await loadAboutPage(
      { ...page, heading: 'Draft About heading' },
      true,
    )

    expect(published.heading).toBe('Small team.\nPlenty of soul.')
    expect(draft.heading).toBe('Draft About heading')
  })
})
