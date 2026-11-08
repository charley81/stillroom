import type { StructureResolver } from 'sanity/structure'
import { SITE_SETTINGS_ID } from './constants'

export { SITE_SETTINGS_ID }

const SINGLETON_TYPES = new Set(['siteSettings'])
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
  if (
    !SINGLETON_TYPES.has(context.schemaType) ||
    context.documentId?.replace(/^drafts\./, '') !== SITE_SETTINGS_ID
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
  return templates.filter(
    (template) => !SINGLETON_TYPES.has(template.templateId),
  )
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
    ])
