import {
  ABOUT_PAGE_ID,
  AUTHOR_IDS,
  CLIENT_LOGO_IDS,
  CONTACT_PAGE_ID,
  HOME_PAGE_ID,
  JOURNAL_ARTICLE_IDS,
  JOURNAL_CATEGORY_IDS,
  JOURNAL_PAGE_ID,
  SERVICES_PAGE_ID,
  SERVICE_IDS,
  SITE_SETTINGS_ID,
  WORK_PAGE_ID,
  WORK_PROJECT_IDS,
} from './content'

export interface PublicationGroup {
  name: string
  ids: readonly string[]
}

export const PUBLICATION_GROUPS = [
  {
    name: 'reusable referenced documents',
    ids: [
      ...SERVICE_IDS,
      ...AUTHOR_IDS,
      ...JOURNAL_CATEGORY_IDS,
      ...CLIENT_LOGO_IDS,
    ],
  },
  {
    name: 'Work Projects and Journal Articles',
    ids: [...WORK_PROJECT_IDS, ...JOURNAL_ARTICLE_IDS],
  },
  {
    name: 'page singletons and Site Settings',
    ids: [
      HOME_PAGE_ID,
      WORK_PAGE_ID,
      SERVICES_PAGE_ID,
      ABOUT_PAGE_ID,
      JOURNAL_PAGE_ID,
      CONTACT_PAGE_ID,
      SITE_SETTINGS_ID,
    ],
  },
] as const satisfies readonly PublicationGroup[]
