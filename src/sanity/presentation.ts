import type {
  DocumentLocationsState,
  PresentationPluginOptions,
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
    ],
    locations: {
      siteSettings: siteSettingsLocations,
    },
  },
} satisfies PresentationPluginOptions
