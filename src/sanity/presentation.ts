import {
  type DocumentLocationResolverObject,
  type DocumentLocationsState,
  type PresentationPluginOptions,
} from 'sanity/presentation'
import { resolveRuntimeSiteOrigin } from '../site-origin'
import { PUBLIC_ROUTE_PATTERNS, SITE_SETTINGS_ROUTES } from './manifests/routes'
import { createTrustedPresentationOrigins } from './presentation-origins'

export { TRUSTED_PRESENTATION_ORIGINS } from './presentation-origins'

export const siteSettingsLocations = {
  locations: [
    { title: 'Home', href: '/' },
    { title: 'Work', href: '/work' },
    { title: 'Services', href: '/services' },
    { title: 'About', href: '/about' },
    { title: 'Journal', href: '/journal' },
    { title: 'Contact', href: '/contact' },
  ],
} satisfies DocumentLocationsState

export const homePageLocations = {
  locations: [{ title: 'Home', href: '/' }],
} satisfies DocumentLocationsState

export const workPageLocations = {
  locations: [{ title: 'Work', href: '/work' }],
} satisfies DocumentLocationsState

const workProjectLocationResolver = {
  select: {
    title: 'title',
    slug: 'slug.current',
    featuredOnHome: 'count(*[_type == "homePage" && references(^._id)]) > 0',
  },
  resolve: (document) => {
    if (!document?.slug) {
      return { message: 'Add a slug to preview this Work Project.' }
    }
    return {
      locations: [
        {
          title: document.title || 'Work Project',
          href: `/work/${document.slug}`,
        },
        { title: 'Work listing', href: '/work' },
        ...(document.featuredOnHome
          ? [{ title: 'Home featured Work placement', href: '/' }]
          : []),
      ],
    }
  },
} satisfies DocumentLocationResolverObject<'title' | 'slug' | 'featuredOnHome'>

export const workProjectLocations = workProjectLocationResolver

export const journalPageLocations = {
  locations: [{ title: 'Journal', href: '/journal' }],
} satisfies DocumentLocationsState

interface JournalArticleLocationValue {
  title?: string
  slug?: string
  relatedIn?: Array<{ title?: string; slug?: string }>
  featuredOnHome?: boolean
}

export const journalArticleLocations = {
  select: {
    title: 'title',
    slug: 'slug.current',
    relatedIn:
      '*[_type == "journalArticle" && references(^._id)]{title, "slug": slug.current}',
    featuredOnHome: 'count(*[_type == "homePage" && references(^._id)]) > 0',
  },
  resolve: (document: JournalArticleLocationValue | null) => {
    if (!document?.slug) {
      return { message: 'Add a slug to preview this Journal Article.' }
    }
    return {
      locations: [
        {
          title: document.title || 'Journal Article',
          href: `/journal/${document.slug}`,
        },
        { title: 'Journal listing', href: '/journal' },
        ...(document.featuredOnHome
          ? [{ title: 'Home featured Journal placement', href: '/' }]
          : []),
        ...(document.relatedIn ?? []).flatMap((article) =>
          article.slug
            ? [
                {
                  title: `Related in ${article.title || 'Journal Article'}`,
                  href: `/journal/${article.slug}`,
                },
              ]
            : [],
        ),
      ],
    }
  },
} satisfies DocumentLocationResolverObject<
  'title' | 'slug' | 'relatedIn' | 'featuredOnHome'
>

interface JournalReferenceLocationValue {
  name?: string
  title?: string
  articles?: Array<{ title?: string; slug?: string }>
}

export const authorLocations = {
  select: {
    name: 'name',
    articles:
      '*[_type == "journalArticle" && references(^._id)]{title, "slug": slug.current}',
  },
  resolve: (document: JournalReferenceLocationValue | null) => ({
    locations: (document?.articles ?? []).flatMap((article) =>
      article.slug
        ? [
            {
              title: article.title || document?.name || 'Journal Article',
              href: `/journal/${article.slug}`,
            },
          ]
        : [],
    ),
  }),
} satisfies DocumentLocationResolverObject<'name' | 'articles'>

export const journalCategoryLocations = {
  select: {
    title: 'title',
    articles:
      '*[_type == "journalArticle" && references(^._id)]{title, "slug": slug.current}',
  },
  resolve: (document: JournalReferenceLocationValue | null) => ({
    locations: [
      ...(document?.articles ?? []).flatMap((article) =>
        article.slug
          ? [
              {
                title: article.title || document?.title || 'Journal Article',
                href: `/journal/${article.slug}`,
              },
            ]
          : [],
      ),
      { title: 'Journal listing', href: '/journal' },
      { title: 'Home featured Journal placement', href: '/' },
    ],
  }),
} satisfies DocumentLocationResolverObject<'title' | 'articles'>

export const servicesPageLocations = {
  locations: [
    { title: 'Services', href: '/services' },
    { title: 'Contact form', href: '/contact' },
  ],
} satisfies DocumentLocationsState

export const contactPageLocations = {
  locations: [{ title: 'Contact', href: '/contact' }],
} satisfies DocumentLocationsState

export const aboutPageLocations = {
  locations: [{ title: 'About', href: '/about' }],
} satisfies DocumentLocationsState

interface ClientLogoLocationValue {
  clientName?: string
  featuredOnHome?: boolean
  shownOnAbout?: boolean
}

export const clientLogoLocations = {
  select: {
    clientName: 'clientName',
    featuredOnHome: 'count(*[_type == "homePage" && references(^._id)]) > 0',
    shownOnAbout: 'count(*[_type == "aboutPage" && references(^._id)]) > 0',
  },
  resolve: (document: ClientLogoLocationValue | null) => ({
    locations: [
      ...(document?.featuredOnHome ? [{ title: 'Home', href: '/' }] : []),
      ...(document?.shownOnAbout ? [{ title: 'About', href: '/about' }] : []),
    ],
  }),
} satisfies DocumentLocationResolverObject<
  'clientName' | 'featuredOnHome' | 'shownOnAbout'
>

interface ServiceLocationValue {
  title?: string
  workProjects?: Array<{ title?: string; slug?: string }>
  featuredOnHome?: boolean
  shownOnServices?: boolean
}

export const serviceLocations = {
  select: {
    title: 'title',
    workProjects:
      '*[_type == "workProject" && references(^._id)]{title, "slug": slug.current}',
    featuredOnHome: 'count(*[_type == "homePage" && references(^._id)]) > 0',
    shownOnServices:
      'count(*[_type == "servicesPage" && references(^._id)]) > 0',
  },
  resolve: (document: ServiceLocationValue | null) => ({
    locations: [
      ...(document?.shownOnServices
        ? [
            { title: 'Services', href: '/services' },
            { title: 'Contact form', href: '/contact' },
          ]
        : []),
      ...(document?.featuredOnHome
        ? [{ title: 'Home featured Services placement', href: '/' }]
        : []),
      ...(document?.workProjects ?? []).flatMap((project) =>
        project.slug
          ? [
              {
                title: project.title || document?.title || 'Work Project',
                href: `/work/${project.slug}`,
              },
            ]
          : [],
      ),
    ],
  }),
} satisfies DocumentLocationResolverObject<
  'title' | 'workProjects' | 'featuredOnHome' | 'shownOnServices'
>

export function createPresentationOptions(
  siteOrigin: string,
): PresentationPluginOptions {
  const trustedOrigins = createTrustedPresentationOrigins(siteOrigin)

  return {
    allowOrigins: [...trustedOrigins],
    previewUrl: {
      initial: ({ origin }) =>
        trustedOrigins.some((trusted) => trusted === origin)
          ? origin
          : siteOrigin,
      previewMode: async ({ targetOrigin }) =>
        trustedOrigins.some((trusted) => trusted === targetOrigin)
          ? {
              enable: '/api/preview/enable',
              shareAccess: false,
            }
          : false,
    },
    resolve: {
      mainDocuments: [
        {
          route: [...SITE_SETTINGS_ROUTES],
          type: 'siteSettings',
        },
        ...PUBLIC_ROUTE_PATTERNS,
      ],
      locations: {
        siteSettings: siteSettingsLocations,
        homePage: homePageLocations,
        workPage: workPageLocations,
        workProject: workProjectLocations,
        servicesPage: servicesPageLocations,
        journalPage: journalPageLocations,
        journalArticle: journalArticleLocations,
        author: authorLocations,
        journalCategory: journalCategoryLocations,
        contactPage: contactPageLocations,
        aboutPage: aboutPageLocations,
        clientLogo: clientLogoLocations,
        service: serviceLocations,
      },
    },
  }
}

export const PRESENTATION_OPTIONS = createPresentationOptions(
  resolveRuntimeSiteOrigin(import.meta.env),
)
