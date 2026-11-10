const singleton = {
  siteSettings: {
    id: 'siteSettings',
    type: 'siteSettings',
    title: 'Site Settings',
  },
  homePage: { id: 'homePage', type: 'homePage', title: 'Home' },
  workPage: { id: 'workPage', type: 'workPage', title: 'Work' },
  servicesPage: {
    id: 'servicesPage',
    type: 'servicesPage',
    title: 'Services',
  },
  aboutPage: { id: 'aboutPage', type: 'aboutPage', title: 'About' },
  journalPage: { id: 'journalPage', type: 'journalPage', title: 'Journal' },
  contactPage: { id: 'contactPage', type: 'contactPage', title: 'Contact' },
} as const

export const SINGLETON_DEFINITIONS = Object.values(singleton)

export function draftId<Id extends string>(id: Id): `drafts.${Id}` {
  return `drafts.${id}`
}

export const SITE_SETTINGS_ID = singleton.siteSettings.id
export const HOME_PAGE_ID = singleton.homePage.id
export const WORK_PAGE_ID = singleton.workPage.id
export const SERVICES_PAGE_ID = singleton.servicesPage.id
export const ABOUT_PAGE_ID = singleton.aboutPage.id
export const JOURNAL_PAGE_ID = singleton.journalPage.id
export const CONTACT_PAGE_ID = singleton.contactPage.id

export const SITE_SETTINGS_DRAFT_ID = draftId(SITE_SETTINGS_ID)
export const HOME_PAGE_DRAFT_ID = draftId(HOME_PAGE_ID)
export const WORK_PAGE_DRAFT_ID = draftId(WORK_PAGE_ID)
export const SERVICES_PAGE_DRAFT_ID = draftId(SERVICES_PAGE_ID)
export const ABOUT_PAGE_DRAFT_ID = draftId(ABOUT_PAGE_ID)
export const JOURNAL_PAGE_DRAFT_ID = draftId(JOURNAL_PAGE_ID)
export const CONTACT_PAGE_DRAFT_ID = draftId(CONTACT_PAGE_ID)

export const SERVICE_IDS = [
  'service-brand-strategy',
  'service-visual-identity',
  'service-digital-design-development',
  'service-campaign-content-direction',
] as const

export const CLIENT_LOGO_IDS = [
  'client-logo-orlo-house',
  'client-logo-juniper',
  'client-logo-fieldwork',
  'client-logo-the-long-table',
  'client-logo-morrow',
] as const

const workProjectSlugs = [
  'the-good-table',
  'orlo-house',
  'juniper',
  'fieldwork',
  'the-long-table',
  'morrow',
] as const

export const WORK_PROJECTS = workProjectSlugs.map((slug) => ({
  id: `work-project-${slug}` as const,
  slug,
}))
export const WORK_PROJECT_SLUGS = WORK_PROJECTS.map(({ slug }) => slug)
export const WORK_PROJECT_IDS = WORK_PROJECTS.map(({ id }) => id)

export const AUTHOR_IDS = ['author-stillroom'] as const

export const JOURNAL_CATEGORY_IDS = [
  'journal-category-culture',
  'journal-category-design',
  'journal-category-perspective',
  'journal-category-process',
  'journal-category-studio-notes',
] as const

const journalArticleSlugs = [
  'what-makes-a-place-stay-with-us',
  'the-quiet-power-of-a-good-menu',
  'the-everyday-ritual-reconsidered',
  'a-welcome-begins-before-the-door',
  'good-brands-have-good-ingredients',
  'a-little-more-personality-please',
  'made-for-good-company',
] as const

export const JOURNAL_ARTICLES = journalArticleSlugs.map((slug) => ({
  id: `journal-article-${slug}` as const,
  slug,
}))
export const JOURNAL_ARTICLE_SLUGS = JOURNAL_ARTICLES.map(({ slug }) => slug)
export const JOURNAL_ARTICLE_IDS = JOURNAL_ARTICLES.map(({ id }) => id)

export const CONTENT_DOCUMENTS = [
  ...SINGLETON_DEFINITIONS.map(({ id, type }) => ({ id, type })),
  ...SERVICE_IDS.map((id) => ({ id, type: 'service' as const })),
  ...CLIENT_LOGO_IDS.map((id) => ({ id, type: 'clientLogo' as const })),
  ...WORK_PROJECT_IDS.map((id) => ({ id, type: 'workProject' as const })),
  ...AUTHOR_IDS.map((id) => ({ id, type: 'author' as const })),
  ...JOURNAL_CATEGORY_IDS.map((id) => ({
    id,
    type: 'journalCategory' as const,
  })),
  ...JOURNAL_ARTICLE_IDS.map((id) => ({
    id,
    type: 'journalArticle' as const,
  })),
]

export const CONTENT_DRAFT_IDS = CONTENT_DOCUMENTS.map(({ id }) => draftId(id))
