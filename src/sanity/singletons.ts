import type { StructureResolver } from 'sanity/structure'
import {
  CONTACT_PAGE_ID,
  JOURNAL_PAGE_ID,
  SERVICES_PAGE_ID,
  SITE_SETTINGS_ID,
  WORK_PAGE_ID,
} from './constants'

export {
  CONTACT_PAGE_ID,
  JOURNAL_PAGE_ID,
  SERVICES_PAGE_ID,
  SITE_SETTINGS_ID,
  WORK_PAGE_ID,
}

const SINGLETON_IDS = new Map([
  ['siteSettings', SITE_SETTINGS_ID],
  ['workPage', WORK_PAGE_ID],
  ['servicesPage', SERVICES_PAGE_ID],
  ['contactPage', CONTACT_PAGE_ID],
  ['journalPage', JOURNAL_PAGE_ID],
])
const BLOCKED_SINGLETON_ACTIONS = new Set(['delete', 'duplicate'])

interface ActionLike {
  action?: string
}

interface ActionContext {
  documentId?: string
  schemaType: string
}

interface TemplateLike {
  templateId: string
}

export function filterSingletonActions<T extends ActionLike>(
  actions: T[],
  context: ActionContext,
): T[] {
  const singletonId = SINGLETON_IDS.get(context.schemaType)
  if (
    !singletonId ||
    context.documentId?.replace(/^drafts\./, '') !== singletonId
  ) {
    return actions
  }

  return actions.filter(
    (action) => !action.action || !BLOCKED_SINGLETON_ACTIONS.has(action.action),
  )
}

export function filterSingletonTemplates<T extends TemplateLike>(
  templates: T[],
): T[] {
  return templates.filter((template) => !SINGLETON_IDS.has(template.templateId))
}

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Global')
        .child(
          S.list()
            .title('Global')
            .items([
              S.listItem()
                .title('Site Settings')
                .schemaType('siteSettings')
                .child(
                  S.document()
                    .title('Site Settings')
                    .schemaType('siteSettings')
                    .documentId(SITE_SETTINGS_ID),
                ),
            ]),
        ),
      S.listItem()
        .title('Pages')
        .child(
          S.list()
            .title('Pages')
            .items([
              S.listItem()
                .title('Work')
                .schemaType('workPage')
                .child(
                  S.document()
                    .title('Work')
                    .schemaType('workPage')
                    .documentId(WORK_PAGE_ID),
                ),
              S.listItem()
                .title('Services')
                .schemaType('servicesPage')
                .child(
                  S.document()
                    .title('Services')
                    .schemaType('servicesPage')
                    .documentId(SERVICES_PAGE_ID),
                ),
              S.listItem()
                .title('Journal')
                .schemaType('journalPage')
                .child(
                  S.document()
                    .title('Journal')
                    .schemaType('journalPage')
                    .documentId(JOURNAL_PAGE_ID),
                ),
              S.listItem()
                .title('Contact')
                .schemaType('contactPage')
                .child(
                  S.document()
                    .title('Contact')
                    .schemaType('contactPage')
                    .documentId(CONTACT_PAGE_ID),
                ),
            ]),
        ),
      S.listItem()
        .title('Work')
        .child(
          S.list()
            .title('Work')
            .items([
              S.documentTypeListItem('workProject').title('Work Projects'),
            ]),
        ),
      S.listItem()
        .title('Journal')
        .child(
          S.list()
            .title('Journal')
            .items([
              S.documentTypeListItem('journalArticle').title(
                'Journal Articles',
              ),
              S.documentTypeListItem('author').title('Authors'),
              S.documentTypeListItem('journalCategory').title(
                'Journal Categories',
              ),
            ]),
        ),
      S.listItem()
        .title('Reusable Content')
        .child(
          S.list()
            .title('Reusable Content')
            .items([S.documentTypeListItem('service').title('Services')]),
        ),
    ])
