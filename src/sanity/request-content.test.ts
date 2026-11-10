import { describe, expect, it, vi } from 'vitest'
import { createContent } from './content/client'
import { createContentRequest } from './content/request'
import { WORK_PAGE_QUERY } from './queries/work'
import { SITE_SETTINGS_QUERY } from './queries/site-settings'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

const image = {
  decorative: false,
  alt: 'Hospitality identity materials',
  caption: null,
  url: 'https://cdn.sanity.io/work.jpg',
  mobileUrl: null,
}

const workPage = {
  _id: 'workPage',
  heading: 'Published Work heading',
  heroArtwork: image,
  workProjects: [
    {
      _id: 'work-project-the-good-table',
      title: 'The Good Table',
      slug: 'the-good-table',
      sectorLabel: 'Restaurant',
      cardSummary: 'A neighbourhood restaurant.',
      cardImage: image,
      services: [{ _id: 'service-brand-strategy', title: 'Brand strategy' }],
      positioningStatement: 'Always a seat at the table.',
    },
  ],
  finalCtaEyebrow: 'Something good starts with a conversation',
  finalCtaHeading: 'Pull up a chair.',
  finalCtaLabel: 'Start a Project',
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

describe('request-scoped content', () => {
  it('loads a page and Site Settings concurrently through one client and reuses Site Settings', async () => {
    const pendingWork = deferred<{ result: typeof workPage }>()
    const pendingSettings = deferred<{ result: typeof siteSettings }>()
    const fetch = vi.fn((query: string) => {
      if (query === WORK_PAGE_QUERY) return pendingWork.promise
      if (query === SITE_SETTINGS_QUERY) return pendingSettings.promise
      throw new Error('Unexpected query')
    })
    const createClient = vi.fn().mockReturnValue({ fetch })
    const createQueryContent = vi.fn(() =>
      createContent(
        { projectId: 'project', dataset: 'development' },
        {},
        createClient,
      ),
    )
    const content = createContentRequest(
      { enabled: false, perspective: 'published' },
      createQueryContent,
    )

    const renderedContent = content.loadWorkPage()

    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))
    expect(createQueryContent).toHaveBeenCalledOnce()
    expect(createQueryContent).toHaveBeenCalledWith({
      enabled: false,
      perspective: 'published',
    })
    expect(createClient).toHaveBeenCalledOnce()

    pendingWork.resolve({ result: workPage })
    pendingSettings.resolve({ result: siteSettings })

    await expect(renderedContent).resolves.toEqual({
      content: workPage,
      siteSettings,
    })
    await expect(content.getSiteSettings()).resolves.toEqual(siteSettings)
    expect(
      fetch.mock.calls.filter(([query]) => query === SITE_SETTINGS_QUERY),
    ).toHaveLength(1)
  })
})
