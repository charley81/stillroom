interface EditorialImageValue {
  decorative?: boolean
  alt?: string
}

const APPROVED_WORK_PROJECT_GALLERY_BLOCKS = new Set([
  'workProjectGalleryImage',
  'workProjectGalleryBrandPanel',
])
const APPROVED_JOURNAL_ARTICLE_BLOCKS = new Set([
  'journalArticleSection',
  'journalArticlePullQuote',
])

export function approvedGalleryBlocks(
  blocks: unknown[] | undefined,
): true | string {
  if (!blocks) return true
  const approved = blocks.every(
    (block) =>
      block &&
      typeof block === 'object' &&
      APPROVED_WORK_PROJECT_GALLERY_BLOCKS.has(
        String((block as { _type?: unknown })._type),
      ),
  )
  return approved
    ? true
    : 'Work Project galleries may only contain approved gallery blocks.'
}

export function approvedJournalArticleBody(
  blocks: unknown[] | undefined,
): true | string {
  if (!blocks) return true
  const approved = blocks.every(
    (block) =>
      block &&
      typeof block === 'object' &&
      APPROVED_JOURNAL_ARTICLE_BLOCKS.has(
        String((block as { _type?: unknown })._type),
      ),
  )
  if (!approved) {
    return 'Journal Article bodies may only contain approved sections and pull quotes.'
  }
  return blocks.some(
    (block) =>
      block &&
      typeof block === 'object' &&
      (block as { _type?: unknown })._type === 'journalArticleSection',
  )
    ? true
    : 'Journal Article bodies require at least one article section.'
}

export function relatedJournalArticles(
  references: unknown[] | undefined,
  documentId: string | undefined,
): true | string {
  if (!references) return true
  const ids = references.flatMap((reference) => {
    if (!reference || typeof reference !== 'object') return []
    const id = (reference as { _ref?: unknown })._ref
    return typeof id === 'string' ? [id.replace(/^drafts\./, '')] : []
  })
  if (new Set(ids).size !== ids.length) {
    return 'Related Journal Articles must be unique.'
  }
  const currentId = documentId?.replace(/^drafts\./, '')
  return currentId && ids.includes(currentId)
    ? 'A Journal Article cannot relate to itself.'
    : true
}

export function exactCount(
  value: unknown[] | undefined,
  count: number,
  label: string,
): true | string {
  return value?.length === count
    ? true
    : `${label} requires exactly ${count} items.`
}

export function uniqueReferences(
  references: unknown[] | undefined,
): true | string {
  if (!references) return true
  const ids = references.flatMap((reference) => {
    if (!reference || typeof reference !== 'object') return []
    const id = (reference as { _ref?: unknown })._ref
    return typeof id === 'string' ? [id] : []
  })
  return new Set(ids).size === ids.length ? true : 'References must be unique.'
}

export function uniqueTrimmedStrings(
  values: unknown[] | undefined,
): true | string {
  if (!values) return true
  if (values.some((value) => typeof value !== 'string')) {
    return 'Items must be non-empty and unique.'
  }
  const normalized = (values as string[]).map((value) =>
    value.trim().toLowerCase(),
  )
  return normalized.every(Boolean) && new Set(normalized).size === values.length
    ? true
    : 'Items must be non-empty and unique.'
}

export function validateEditorialImageAccessibility(
  value: EditorialImageValue | undefined,
): true | string {
  if (!value) return true
  const alt = value.alt?.trim() ?? ''

  if (value.decorative && alt) {
    return 'Decorative images must have empty alternative text.'
  }
  if (!value.decorative && !alt) {
    return 'Alternative text is required unless the image is decorative.'
  }
  if (!value.decorative && /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(alt)) {
    return 'Alternative text must describe the image, not repeat a filename.'
  }
  return true
}
