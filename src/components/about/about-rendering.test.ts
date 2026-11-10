import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { describe, expect, it } from 'vitest'
import type { AboutPage } from '../../sanity/content/about'
import ClientLogos from '../site/ClientLogos.astro'
import ProjectInvitation from '../site/ProjectInvitation.astro'
import ClientProof from './ClientProof.astro'
import FounderStory from './FounderStory.astro'
import TeamOverview from './TeamOverview.astro'
import WorkingPrinciples from './WorkingPrinciples.astro'

const image = {
  decorative: false,
  alt: 'Stillroom studio materials',
  caption: null,
  url: 'https://cdn.sanity.io/studio.webp',
  mobileUrl: null,
}

const page: AboutPage = {
  _id: 'aboutPage',
  heading: 'Small team.\nPlenty of soul.',
  heroImage: image,
  founderHeading: 'It starts\nwith a feeling.',
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
          text: 'A published founder story.',
          marks: [],
        },
      ],
    },
  ],
  founderName: 'Alex Morgan',
  founderRole: 'Founder & Creative Director',
  founderImage: image,
  teamHeading: 'Good company.',
  teamIntroduction: 'A published team introduction.',
  teamMembers: ['Alex', 'Maya', 'Sam'].map((name, index) => ({
    _key: String(index),
    _type: 'teamProfile',
    name,
    role: 'Design',
    biography: `${name} published biography.`,
    portrait: { ...image, alt: `${name} portrait` },
  })),
  principlesHeading: 'Good work.\nGood chemistry.',
  principles: ['Character', 'Closer', 'Care'].map((title, index) => ({
    _key: String(index),
    _type: 'workingPrinciple',
    title,
    description: `${title} published description.`,
  })),
  clientProofHeading: 'Made for people\nwho care.',
  clientProofCopy: 'Published client proof copy.',
  clientLogos: [
    'Orlo House',
    'Juniper',
    'Fieldwork',
    'The Long Table',
    'Morrow',
  ].map((clientName, index) => ({
    _id: `client-logo-${index}`,
    clientName,
    url: `https://cdn.sanity.io/${index}.svg`,
    mimeType: 'image/svg+xml',
  })),
  clientProofCtaLabel: 'Explore our work →',
  finalCtaEyebrow: 'Published invitation eyebrow.',
  finalCtaHeading: 'Pull up a chair.',
  finalCtaLabel: 'Start a Project',
  seo: null,
}

describe('About rendering', () => {
  it('renders Sanity-owned founder, team, and principle content with fixed labels and numbers', async () => {
    const container = await AstroContainer.create()
    const [founder, team, principles] = await Promise.all([
      container.renderToString(FounderStory, { props: { page } }),
      container.renderToString(TeamOverview, { props: { page } }),
      container.renderToString(WorkingPrinciples, { props: { page } }),
    ])

    expect(founder).toContain('Our story')
    expect(founder).toContain('A published founder story.')
    expect(founder).toContain('Alex Morgan / Founder &amp; Creative Director')
    expect(team).toContain('A published team introduction.')
    expect(team).toContain('Maya published biography.')
    expect(principles).toContain('What we believe')
    expect(principles).toContain('01')
    expect(principles).toContain('03')
    expect(principles).toContain('Care published description.')
  })

  it('renders accessible SVG Client Logo assets through the first-party CDN without explicit raster transformation parameters', async () => {
    const container = await AstroContainer.create()
    const html = await container.renderToString(ClientLogos, {
      props: { logos: page.clientLogos, variant: 'proof' },
    })

    expect(html).toContain(
      'src="/.netlify/images?url=https%3A%2F%2Fcdn.sanity.io%2F0.svg"',
    )
    expect(html).not.toContain('src="https://cdn.sanity.io')
    expect(html).toContain('alt="Orlo House"')
    expect(html).not.toContain('?w=')
    expect(html).not.toContain('<strong')
  })

  it('renders client proof and invitation copy while keeping Work and Contact destinations fixed', async () => {
    const container = await AstroContainer.create()
    const [proof, invitation] = await Promise.all([
      container.renderToString(ClientProof, { props: { page } }),
      container.renderToString(ProjectInvitation, {
        props: {
          eyebrow: page.finalCtaEyebrow,
          title: page.finalCtaHeading,
          label: page.finalCtaLabel,
          variant: 'about',
        },
      }),
    ])

    expect(proof).toContain('Published client proof copy.')
    expect(proof).toContain('href="/work"')
    expect(proof).toContain('Explore our work →')
    expect(invitation).toContain('Published invitation eyebrow.')
    expect(invitation).toContain('href="/contact"')
  })
})
