import { describe, expect, it } from 'vitest'
import { MissingContentError } from './content/errors'
import {
  WorkProjectNotFoundError,
  requireWorkPage,
  requireWorkProjectResult,
} from './content/work'

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
    children: [{ _key: `${copy}-span`, _type: 'span', marks: [], text: copy }],
  },
]

const cards = ['the-good-table', 'orlo-house', 'juniper'].map(
  (slug, index) => ({
    _id: `work-project-${slug}`,
    title: slug.replaceAll('-', ' '),
    slug,
    sectorLabel: 'Restaurant',
    cardSummary: `Summary ${index + 1}`,
    cardImage: image,
    services: [{ _id: 'service-brand-strategy', title: 'Brand strategy' }],
    positioningStatement: `Positioning ${index + 1}`,
  }),
)

const workPage = {
  _id: 'workPage',
  heading: 'Places with personality.',
  heroArtwork: image,
  workProjects: cards,
  finalCtaEyebrow: 'Something good starts with a conversation',
  finalCtaHeading: 'Pull up a chair.',
  finalCtaLabel: 'Start a Project',
  seo: null,
}

const project = {
  ...cards[0],
  introduction: 'A neighbourhood restaurant.',
  heroArtwork: image,
  heroPhotograph: image,
  challenge: { heading: 'The challenge heading', content: text('Challenge') },
  contribution: {
    heading: 'The contribution heading',
    content: text('Contribution'),
  },
  galleryHeading: 'The identity, in good company',
  gallery: [
    { _key: 'one', _type: 'workProjectGalleryImage', image },
    {
      _key: 'two',
      _type: 'workProjectGalleryBrandPanel',
      title: 'The Good Table',
      statement: 'Always a seat.',
      label: 'Neighbourhood restaurant',
      image,
    },
  ],
  outcomeHeading: 'A brand that feels like a warm welcome.',
  outcomeCopy: text('A cohesive identity.'),
  seo: null,
}

describe('Work content requirements', () => {
  it('preserves the Work-page reference order as the canonical listing order', () => {
    expect(
      requireWorkPage(workPage).workProjects.map(({ slug }) => slug),
    ).toEqual(['the-good-table', 'orlo-house', 'juniper'])
    expect(() =>
      requireWorkPage({
        ...workPage,
        workProjects: [cards[0], cards[0]],
      }),
    ).toThrow('unique Work Project references')
  })

  it('derives the next Work Project from the Work-page order and wraps at the end', () => {
    expect(
      requireWorkProjectResult({ page: workPage, project }).nextProject.slug,
    ).toBe('orlo-house')
    expect(
      requireWorkProjectResult({
        page: workPage,
        project: { ...project, ...cards[2] },
      }).nextProject.slug,
    ).toBe('the-good-table')
  })

  it('rejects missing projects and unsupported or empty galleries', () => {
    expect(() =>
      requireWorkProjectResult({ page: workPage, project: null }, 'missing'),
    ).toThrow(WorkProjectNotFoundError)
    expect(() =>
      requireWorkProjectResult({
        page: workPage,
        project: { ...project, gallery: [] },
      }),
    ).toThrow('requires at least one gallery block')
    expect(() =>
      requireWorkProjectResult({
        page: workPage,
        project: {
          ...project,
          gallery: [{ _key: 'bad', _type: 'twoImagePair', image }],
        },
      }),
    ).toThrow('unsupported gallery block')
  })

  it('fails clearly when the required Work singleton is missing', () => {
    expect(() => requireWorkPage(null)).toThrow(MissingContentError)
  })
})
