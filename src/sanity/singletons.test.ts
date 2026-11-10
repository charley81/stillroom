import { describe, expect, it } from 'vitest'
import {
  ABOUT_PAGE_ID,
  CONTACT_PAGE_ID,
  filterSingletonActions,
  JOURNAL_PAGE_ID,
  filterSingletonTemplates,
  SERVICES_PAGE_ID,
  SITE_SETTINGS_ID,
  WORK_PAGE_ID,
} from './singletons'

describe('Site Settings singleton behavior', () => {
  it('removes duplicate and delete actions for the singleton document', () => {
    const actions = [
      { action: 'publish' },
      { action: 'duplicate' },
      { action: 'delete' },
      { action: 'discardChanges' },
    ]

    expect(
      filterSingletonActions(actions, {
        documentId: SITE_SETTINGS_ID,
        schemaType: 'siteSettings',
      }).map((action) => action.action),
    ).toEqual(['publish', 'discardChanges'])
  })

  it('protects the Work, Services, About, Journal, and Contact singleton documents', () => {
    const actions = [
      { action: 'publish' },
      { action: 'duplicate' },
      { action: 'delete' },
    ]

    expect(
      filterSingletonActions(actions, {
        documentId: WORK_PAGE_ID,
        schemaType: 'workPage',
      }).map((action) => action.action),
    ).toEqual(['publish'])
    expect(
      filterSingletonActions(actions, {
        documentId: SERVICES_PAGE_ID,
        schemaType: 'servicesPage',
      }).map((action) => action.action),
    ).toEqual(['publish'])
    expect(
      filterSingletonActions(actions, {
        documentId: ABOUT_PAGE_ID,
        schemaType: 'aboutPage',
      }).map((action) => action.action),
    ).toEqual(['publish'])
    expect(
      filterSingletonActions(actions, {
        documentId: JOURNAL_PAGE_ID,
        schemaType: 'journalPage',
      }).map((action) => action.action),
    ).toEqual(['publish'])
    expect(
      filterSingletonActions(actions, {
        documentId: CONTACT_PAGE_ID,
        schemaType: 'contactPage',
      }).map((action) => action.action),
    ).toEqual(['publish'])
  })

  it('removes all singleton pages from the normal create menu', () => {
    const templates = [
      { templateId: 'siteSettings', schemaType: 'siteSettings' },
      { templateId: 'workPage', schemaType: 'workPage' },
      { templateId: 'servicesPage', schemaType: 'servicesPage' },
      { templateId: 'contactPage', schemaType: 'contactPage' },
      { templateId: 'journalPage', schemaType: 'journalPage' },
      { templateId: 'aboutPage', schemaType: 'aboutPage' },
      { templateId: 'service', schemaType: 'service' },
    ]

    expect(filterSingletonTemplates(templates)).toEqual([
      { templateId: 'service', schemaType: 'service' },
    ])
  })
})
