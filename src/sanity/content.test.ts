import { describe, expect, it, vi } from 'vitest'
import {
  MissingContentError,
  createContent,
  requireSiteSettings,
} from './content'
import { SITE_SETTINGS_QUERY } from './queries/site-settings'

const completeSiteSettings = {
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
  socialLinks: [
    {
      _key: 'instagram',
      platform: 'Instagram',
      url: 'https://instagram.com/stillroom',
    },
  ],
  newsletterHeading: 'Good things, every so often.',
  newsletterDescription: 'Ideas on hospitality, culture, and design.',
  footerTagline: 'Independent by nature.',
  defaultSeoTitle: 'Stillroom — Brand & Digital for Hospitality',
  defaultSeoDescription:
    'An independent creative studio for hospitality, food, and the places that bring people together.',
  defaultSocialImage: {
    decorative: false,
    alt: 'Stillroom hospitality collage',
    url: 'https://cdn.sanity.io/images/project/development/image.jpg',
  },
}

describe('published Sanity content', () => {
  it('uses the CDN and published perspective without a token', async () => {
    const fetch = vi.fn().mockResolvedValue({
      result: completeSiteSettings,
      resultSourceMap: undefined,
    })
    const createClient = vi.fn().mockReturnValue({ fetch })
    const content = createContent(
      { projectId: 'project', dataset: 'development' },
      {},
      createClient,
    )

    await content.loadQuery(SITE_SETTINGS_QUERY)

    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'project',
        dataset: 'development',
        useCdn: true,
      }),
    )
    expect(createClient.mock.calls[0][0]).not.toHaveProperty('token')
    expect(fetch).toHaveBeenCalledWith(
      SITE_SETTINGS_QUERY,
      {},
      expect.objectContaining({
        perspective: 'published',
        resultSourceMap: false,
        stega: false,
        useCdn: true,
      }),
    )
    expect(fetch.mock.calls[0][2]).not.toHaveProperty('token')
  })

  it('uses the same query with drafts, source maps, stega, and a server-only read token in preview', async () => {
    const fetch = vi.fn().mockResolvedValue({
      result: { ...completeSiteSettings, footerTagline: 'Draft tagline' },
      resultSourceMap: { mappings: {} },
    })
    const createClient = vi.fn().mockReturnValue({ fetch })
    const content = createContent(
      { projectId: 'project', dataset: 'development' },
      {
        preview: { enabled: true, perspective: 'drafts' },
        readToken: 'server-read-token',
      },
      createClient,
    )

    const result = await content.loadQuery(SITE_SETTINGS_QUERY)

    expect(result.data).toEqual(
      expect.objectContaining({ footerTagline: 'Draft tagline' }),
    )
    expect(result.perspective).toBe('drafts')
    expect(fetch).toHaveBeenCalledWith(
      SITE_SETTINGS_QUERY,
      {},
      expect.objectContaining({
        perspective: 'drafts',
        resultSourceMap: 'withKeyArraySelector',
        stega: true,
        token: 'server-read-token',
        useCdn: false,
      }),
    )
    expect(JSON.stringify(result)).not.toContain('server-read-token')
  })

  it('refuses preview queries when the server read token is missing', () => {
    expect(() =>
      createContent(
        { projectId: 'project', dataset: 'development' },
        { preview: { enabled: true, perspective: 'drafts' } },
      ),
    ).toThrow('SANITY_API_READ_TOKEN')
  })

  it('fails clearly when required Site Settings content is missing', () => {
    expect(() => requireSiteSettings(null)).toThrow(MissingContentError)
    expect(() =>
      requireSiteSettings({ ...completeSiteSettings, footerTagline: '' }),
    ).toThrow('Site Settings is missing required content: footerTagline')
    expect(() =>
      requireSiteSettings({
        ...completeSiteSettings,
        defaultSocialImage: {
          ...completeSiteSettings.defaultSocialImage,
          alt: '',
        },
      }),
    ).toThrow(
      'Site Settings is missing required content: defaultSocialImage.alt',
    )
  })
})
