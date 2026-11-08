import { describe, expect, it } from 'vitest'
import {
  filterSingletonActions,
  filterSingletonTemplates,
  SITE_SETTINGS_ID,
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

  it('removes Site Settings from the normal create menu', () => {
    const templates = [
      { templateId: 'siteSettings', schemaType: 'siteSettings' },
      { templateId: 'workProject', schemaType: 'workProject' },
    ]

    expect(filterSingletonTemplates(templates)).toEqual([
      { templateId: 'workProject', schemaType: 'workProject' },
    ])
  })
})
