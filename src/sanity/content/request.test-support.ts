import type { ContentRequest } from './request'

function unexpected(method: keyof ContentRequest): Promise<never> {
  return Promise.reject(
    new Error(
      `Unexpected ContentRequest.${String(method)} call in route test.`,
    ),
  )
}

type ContentRequestOverrides = {
  [Method in keyof ContentRequest]?: (
    ...args: Parameters<ContentRequest[Method]>
  ) => Promise<unknown>
}

export function createContentRequestStub(
  overrides: ContentRequestOverrides,
): ContentRequest {
  return {
    getSiteSettings: () => unexpected('getSiteSettings'),
    loadHomePage: () => unexpected('loadHomePage'),
    loadAboutPage: () => unexpected('loadAboutPage'),
    loadServicesPage: () => unexpected('loadServicesPage'),
    loadContactPage: () => unexpected('loadContactPage'),
    loadWorkPage: () => unexpected('loadWorkPage'),
    loadWorkProjectPage: () => unexpected('loadWorkProjectPage'),
    loadJournalPage: () => unexpected('loadJournalPage'),
    loadJournalArticlePage: () => unexpected('loadJournalArticlePage'),
    ...overrides,
  } as ContentRequest
}
