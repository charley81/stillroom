import { describe, expect, it } from 'vitest'
import { isTrustedPresentationOrigin } from './presentation-origins'
import {
  PRESENTATION_OPTIONS,
  TRUSTED_PRESENTATION_ORIGINS,
  aboutPageLocations,
  authorLocations,
  clientLogoLocations,
  contactPageLocations,
  createPresentationOptions,
  homePageLocations,
  journalArticleLocations,
  journalCategoryLocations,
  journalPageLocations,
  serviceLocations,
  servicesPageLocations,
  siteSettingsLocations,
  workPageLocations,
  workProjectLocations,
} from './presentation'

describe('Sanity Presentation configuration', () => {
  it('allows only local Astro and the production Netlify origin', () => {
    expect(TRUSTED_PRESENTATION_ORIGINS).toEqual([
      'http://localhost:4321',
      'https://stillroom-app.netlify.app',
    ])
    expect(PRESENTATION_OPTIONS.allowOrigins).toEqual(
      TRUSTED_PRESENTATION_ORIGINS,
    )
    expect(isTrustedPresentationOrigin('http://localhost:4321')).toBe(true)
    expect(
      isTrustedPresentationOrigin('https://stillroom-app.netlify.app'),
    ).toBe(true)
    expect(
      isTrustedPresentationOrigin(
        'https://deploy-preview-42--stillroom-app.netlify.app',
      ),
    ).toBe(false)
  })

  it('uses the configured production origin as the explicit Presentation fallback', async () => {
    const configuredOrigin = 'https://www.stillroom.example'
    const options = createPresentationOptions(configuredOrigin)
    const previewUrl = options.previewUrl

    expect(options.allowOrigins).toEqual([
      'http://localhost:4321',
      configuredOrigin,
    ])
    expect(typeof previewUrl).toBe('object')
    if (typeof previewUrl !== 'object') {
      throw new Error('Expected preview options')
    }
    expect(previewUrl.initial).toBeTypeOf('function')
    if (typeof previewUrl.initial !== 'function') {
      throw new Error('Expected an initial URL resolver')
    }
    expect(
      previewUrl.initial({
        origin: 'https://deploy-preview-42--stillroom-app.netlify.app',
      } as never),
    ).toBe(configuredOrigin)
    expect(previewUrl.previewMode).toBeTypeOf('function')
    if (typeof previewUrl.previewMode !== 'function') {
      throw new Error('Expected a preview mode resolver')
    }
    await expect(
      previewUrl.previewMode({
        client: {} as never,
        origin: configuredOrigin,
        targetOrigin: configuredOrigin,
      }),
    ).resolves.toEqual({
      enable: '/api/preview/enable',
      shareAccess: false,
    })
  })

  it('enables preview mode only for trusted target origins', async () => {
    const previewUrl = PRESENTATION_OPTIONS.previewUrl
    expect(typeof previewUrl).toBe('object')
    if (typeof previewUrl !== 'object')
      throw new Error('Expected preview options')

    const resolvePreviewMode = previewUrl.previewMode
    expect(typeof resolvePreviewMode).toBe('function')
    if (typeof resolvePreviewMode !== 'function') {
      throw new Error('Expected a preview mode resolver')
    }

    await expect(
      resolvePreviewMode({
        client: {} as never,
        origin: 'https://stillroom-app.netlify.app',
        targetOrigin: 'https://stillroom-app.netlify.app',
      }),
    ).resolves.toEqual({
      enable: '/api/preview/enable',
      shareAccess: false,
    })

    await expect(
      resolvePreviewMode({
        client: {} as never,
        origin: 'https://deploy-preview-42--stillroom-app.netlify.app',
        targetOrigin: 'https://deploy-preview-42--stillroom-app.netlify.app',
      }),
    ).resolves.toBe(false)
  })

  it('locates Site Settings on every page where its global content appears', () => {
    expect(siteSettingsLocations.locations).toEqual([
      { title: 'Home', href: '/' },
      { title: 'Work', href: '/work' },
      { title: 'Services', href: '/services' },
      { title: 'About', href: '/about' },
      { title: 'Journal', href: '/journal' },
      { title: 'Contact', href: '/contact' },
    ])
    expect(PRESENTATION_OPTIONS.resolve?.locations).toEqual(
      expect.objectContaining({ siteSettings: siteSettingsLocations }),
    )
  })

  it('locates the Home singleton on the Home route', () => {
    expect(homePageLocations.locations).toEqual([{ title: 'Home', href: '/' }])
    expect(PRESENTATION_OPTIONS.resolve?.mainDocuments).toContainEqual({
      route: '/',
      type: 'homePage',
    })
    expect(PRESENTATION_OPTIONS.resolve?.locations).toEqual(
      expect.objectContaining({ homePage: homePageLocations }),
    )
  })

  it('locates Work documents on their routes and shared placements', () => {
    expect(workPageLocations.locations).toEqual([
      { title: 'Work', href: '/work' },
    ])
    expect(
      workProjectLocations.resolve({
        title: 'The Good Table',
        slug: 'the-good-table',
        featuredOnHome: true,
      }),
    ).toEqual({
      locations: [
        { title: 'The Good Table', href: '/work/the-good-table' },
        { title: 'Work listing', href: '/work' },
        { title: 'Home featured Work placement', href: '/' },
      ],
    })
    expect(
      workProjectLocations.resolve({
        title: 'Fieldwork',
        slug: 'fieldwork',
        featuredOnHome: false,
      }).locations,
    ).not.toContainEqual({ title: 'Home featured Work placement', href: '/' })
    expect(PRESENTATION_OPTIONS.resolve?.locations).toEqual(
      expect.objectContaining({
        workPage: workPageLocations,
        workProject: workProjectLocations,
      }),
    )
  })

  it('locates Journal documents on their routes and shared placements', () => {
    expect(journalPageLocations.locations).toEqual([
      { title: 'Journal', href: '/journal' },
    ])
    expect(
      journalArticleLocations.resolve({
        title: 'What Makes a Place Stay With Us?',
        slug: 'what-makes-a-place-stay-with-us',
        relatedIn: [
          {
            title: 'The Quiet Power of a Good Menu.',
            slug: 'the-quiet-power-of-a-good-menu',
          },
        ],
        featuredOnHome: true,
      }).locations,
    ).toEqual([
      {
        title: 'What Makes a Place Stay With Us?',
        href: '/journal/what-makes-a-place-stay-with-us',
      },
      { title: 'Journal listing', href: '/journal' },
      { title: 'Home featured Journal placement', href: '/' },
      {
        title: 'Related in The Quiet Power of a Good Menu.',
        href: '/journal/the-quiet-power-of-a-good-menu',
      },
    ])
    expect(
      journalArticleLocations.resolve({
        title: 'Made for Good Company',
        slug: 'made-for-good-company',
        relatedIn: [],
        featuredOnHome: false,
      }).locations,
    ).not.toContainEqual({
      title: 'Home featured Journal placement',
      href: '/',
    })
    expect(
      authorLocations.resolve({
        name: 'Stillroom',
        articles: [
          {
            title: 'What Makes a Place Stay With Us?',
            slug: 'what-makes-a-place-stay-with-us',
          },
        ],
      }).locations,
    ).toEqual([
      {
        title: 'What Makes a Place Stay With Us?',
        href: '/journal/what-makes-a-place-stay-with-us',
      },
    ])
    expect(
      journalCategoryLocations.resolve({
        title: 'Culture',
        articles: [
          {
            title: 'What Makes a Place Stay With Us?',
            slug: 'what-makes-a-place-stay-with-us',
          },
        ],
      }).locations,
    ).toEqual([
      {
        title: 'What Makes a Place Stay With Us?',
        href: '/journal/what-makes-a-place-stay-with-us',
      },
      { title: 'Journal listing', href: '/journal' },
      { title: 'Home featured Journal placement', href: '/' },
    ])
    expect(PRESENTATION_OPTIONS.resolve?.locations).toEqual(
      expect.objectContaining({
        journalPage: journalPageLocations,
        journalArticle: journalArticleLocations,
        author: authorLocations,
        journalCategory: journalCategoryLocations,
      }),
    )
  })

  it('locates About and Client Logo documents on every referenced route', () => {
    expect(aboutPageLocations.locations).toEqual([
      { title: 'About', href: '/about' },
    ])
    expect(
      clientLogoLocations.resolve({
        clientName: 'Orlo House',
        featuredOnHome: true,
        shownOnAbout: true,
      }).locations,
    ).toEqual([
      { title: 'Home', href: '/' },
      { title: 'About', href: '/about' },
    ])
    expect(
      clientLogoLocations.resolve({
        clientName: 'Unused Logo',
        featuredOnHome: false,
        shownOnAbout: false,
      }).locations,
    ).toEqual([])
    expect(PRESENTATION_OPTIONS.resolve?.locations).toEqual(
      expect.objectContaining({
        aboutPage: aboutPageLocations,
        clientLogo: clientLogoLocations,
      }),
    )
  })

  it('locates Services and Contact documents where their content appears', () => {
    expect(servicesPageLocations.locations).toEqual([
      { title: 'Services', href: '/services' },
      { title: 'Contact form', href: '/contact' },
    ])
    expect(contactPageLocations.locations).toEqual([
      { title: 'Contact', href: '/contact' },
    ])
    expect(
      serviceLocations.resolve({
        title: 'Brand strategy',
        workProjects: [{ title: 'The Good Table', slug: 'the-good-table' }],
        featuredOnHome: true,
        shownOnServices: true,
      }).locations,
    ).toEqual([
      { title: 'Services', href: '/services' },
      { title: 'Contact form', href: '/contact' },
      { title: 'Home featured Services placement', href: '/' },
      { title: 'The Good Table', href: '/work/the-good-table' },
    ])
    expect(
      serviceLocations.resolve({
        title: 'Unused Service',
        workProjects: [],
        featuredOnHome: false,
        shownOnServices: false,
      }).locations,
    ).toEqual([])
    expect(PRESENTATION_OPTIONS.resolve?.locations).toEqual(
      expect.objectContaining({
        servicesPage: servicesPageLocations,
        contactPage: contactPageLocations,
        service: serviceLocations,
      }),
    )
  })
})
