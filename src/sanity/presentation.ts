import {
  type DocumentLocationResolverObject,
  type DocumentLocationsState,
  type PresentationPluginOptions,
} from 'sanity/presentation'
import { TRUSTED_PRESENTATION_ORIGINS } from './presentation-origins'

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

export const workPageLocations = {
  locations: [{ title: 'Work', href: '/work' }],
} satisfies DocumentLocationsState

const workProjectLocationResolver = {
  select: { title: 'title', slug: 'slug.current' },
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
        { title: 'Home featured Work placement', href: '/' },
      ],
    }
  },
} satisfies DocumentLocationResolverObject<'title' | 'slug'>

export const workProjectLocations = workProjectLocationResolver

export const journalPageLocations = {
  locations: [{ title: 'Journal', href: '/journal' }],
} satisfies DocumentLocationsState

interface JournalArticleLocationValue {
  title?: string
  slug?: string
  relatedIn?: Array<{ title?: string; slug?: string }>
}

export const journalArticleLocations = {
  select: {
    title: 'title',
    slug: 'slug.current',
    relatedIn:
      '*[_type == "journalArticle" && references(^._id)]{title, "slug": slug.current}',
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
        { title: 'Home featured Journal placement', href: '/' },
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
} satisfies DocumentLocationResolverObject<'title' | 'slug' | 'relatedIn'>

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

export const clientLogoLocations = {
  select: { clientName: 'clientName' },
  resolve: (_document: { clientName?: string } | null) => ({
    locations: [{ title: 'About', href: '/about' }],
  }),
} satisfies DocumentLocationResolverObject<'clientName'>

interface ServiceLocationValue {
  title?: string
  workProjects?: Array<{ title?: string; slug?: string }>
}

export const serviceLocations = {
  select: {
    title: 'title',
    workProjects:
      '*[_type == "workProject" && references(^._id)]{title, "slug": slug.current}',
  },
  resolve: (document: ServiceLocationValue | null) => ({
    locations: [
      { title: 'Services', href: '/services' },
      { title: 'Contact form', href: '/contact' },
      { title: 'Home featured Services placement', href: '/' },
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
} satisfies DocumentLocationResolverObject<'title' | 'workProjects'>

export const PRESENTATION_OPTIONS = {
  allowOrigins: [...TRUSTED_PRESENTATION_ORIGINS],
  previewUrl: {
    initial: ({ origin }) =>
      TRUSTED_PRESENTATION_ORIGINS.some((trusted) => trusted === origin)
        ? origin
        : 'https://stillroom-app.netlify.app',
    previewMode: async ({ targetOrigin }) =>
      TRUSTED_PRESENTATION_ORIGINS.some((trusted) => trusted === targetOrigin)
        ? {
            enable: '/api/preview/enable',
            shareAccess: false,
          }
        : false,
  },
  resolve: {
    mainDocuments: [
      {
        route: ['/', '/work', '/services', '/about', '/journal', '/contact'],
        type: 'siteSettings',
      },
      { route: '/work', type: 'workPage' },
      { route: '/work/:slug', type: 'workProject' },
      { route: '/services', type: 'servicesPage' },
      { route: '/about', type: 'aboutPage' },
      { route: '/journal', type: 'journalPage' },
      { route: '/journal/:slug', type: 'journalArticle' },
      { route: '/contact', type: 'contactPage' },
    ],
    locations: {
      siteSettings: siteSettingsLocations,
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
} satisfies PresentationPluginOptions
