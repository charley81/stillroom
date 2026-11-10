import { PUBLIC_PREVIEW_STATE, type PreviewState } from '../preview'
import { loadAboutPage, type AboutPage } from './about'
import { createRuntimeContent, type ContentQueryClient } from './client'
import { loadHomePage, type HomePage } from './home'
import {
  loadJournalArticlePage,
  loadJournalPage,
  type JournalArticlePage,
  type JournalPage,
} from './journal'
import {
  loadContactPage,
  loadServicesPage,
  type ContactPage,
  type ServicesPage,
} from './services-contact'
import { loadSiteSettings, type SiteSettings } from './site-settings'
import {
  loadWorkPage,
  loadWorkProjectPage,
  type WorkPage,
  type WorkProjectPage,
} from './work'

export interface RenderContent<Content> {
  content: Content
  siteSettings: SiteSettings
}

export interface ContentRequest {
  getSiteSettings(): Promise<SiteSettings>
  loadHomePage(): Promise<RenderContent<HomePage>>
  loadAboutPage(): Promise<RenderContent<AboutPage>>
  loadServicesPage(): Promise<RenderContent<ServicesPage>>
  loadContactPage(): Promise<RenderContent<ContactPage>>
  loadWorkPage(): Promise<RenderContent<WorkPage>>
  loadWorkProjectPage(slug: string): Promise<RenderContent<WorkProjectPage>>
  loadJournalPage(): Promise<RenderContent<JournalPage>>
  loadJournalArticlePage(
    slug: string,
  ): Promise<RenderContent<JournalArticlePage>>
}

type PageLoader<Page> = (content: ContentQueryClient) => Promise<Page>
type CreateQueryContent = (preview: PreviewState) => ContentQueryClient

export function createContentRequest(
  preview: PreviewState = PUBLIC_PREVIEW_STATE,
  createQueryContent: CreateQueryContent = createRuntimeContent,
): ContentRequest {
  let queryContent: ContentQueryClient | undefined
  let siteSettingsPromise: Promise<SiteSettings> | undefined

  const getQueryContent = () => (queryContent ??= createQueryContent(preview))

  const getSiteSettings = () =>
    (siteSettingsPromise ??= loadSiteSettings(getQueryContent()))

  const loadPage = async <Page>(
    loader: PageLoader<Page>,
  ): Promise<RenderContent<Page>> => {
    const query = getQueryContent()
    const [content, siteSettings] = await Promise.all([
      loader(query),
      getSiteSettings(),
    ])
    return { content, siteSettings }
  }

  return {
    getSiteSettings,
    loadHomePage: () => loadPage(loadHomePage),
    loadAboutPage: () => loadPage(loadAboutPage),
    loadServicesPage: () => loadPage(loadServicesPage),
    loadContactPage: () => loadPage(loadContactPage),
    loadWorkPage: () => loadPage(loadWorkPage),
    loadWorkProjectPage: (slug) =>
      loadPage((content) => loadWorkProjectPage(content, slug)),
    loadJournalPage: () => loadPage(loadJournalPage),
    loadJournalArticlePage: (slug) =>
      loadPage((content) => loadJournalArticlePage(content, slug)),
  }
}
