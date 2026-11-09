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

export const servicesPageLocations = {
  locations: [
    { title: 'Services', href: '/services' },
    { title: 'Contact form', href: '/contact' },
  ],
} satisfies DocumentLocationsState

export const contactPageLocations = {
  locations: [{ title: 'Contact', href: '/contact' }],
} satisfies DocumentLocationsState

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
      { route: '/contact', type: 'contactPage' },
    ],
    locations: {
      siteSettings: siteSettingsLocations,
      workPage: workPageLocations,
      workProject: workProjectLocations,
      servicesPage: servicesPageLocations,
      contactPage: contactPageLocations,
      service: serviceLocations,
    },
  },
} satisfies PresentationPluginOptions
