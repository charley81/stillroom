import { JOURNAL_ARTICLE_SLUGS, WORK_PROJECT_SLUGS } from './content'

export const SITE_SETTINGS_ROUTES = [
  '/',
  '/work',
  '/services',
  '/about',
  '/journal',
  '/contact',
] as const

export const PUBLIC_ROUTE_PATTERNS = [
  { route: '/', type: 'homePage' },
  { route: '/work', type: 'workPage' },
  { route: '/work/:slug', type: 'workProject' },
  { route: '/services', type: 'servicesPage' },
  { route: '/about', type: 'aboutPage' },
  { route: '/journal', type: 'journalPage' },
  { route: '/journal/:slug', type: 'journalArticle' },
  { route: '/contact', type: 'contactPage' },
] as const

export const PUBLIC_ROUTES = [
  '/',
  '/services',
  '/work',
  ...WORK_PROJECT_SLUGS.map((slug) => `/work/${slug}` as const),
  '/about',
  '/journal',
  ...JOURNAL_ARTICLE_SLUGS.map((slug) => `/journal/${slug}` as const),
  '/contact',
]

export const NOT_FOUND_VERIFICATION_ROUTES = [
  '/cutover-404-check',
  '/work/cutover-404-check',
  '/journal/cutover-404-check',
] as const

export const ROUTE_VERIFICATION_CASES = [
  ...PUBLIC_ROUTES.map((route) => ({ route, expectedStatus: 200 as const })),
  ...NOT_FOUND_VERIFICATION_ROUTES.map((route) => ({
    route,
    expectedStatus: 404 as const,
  })),
]
