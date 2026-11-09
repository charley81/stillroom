interface EditorialImageValue {
  decorative?: boolean
  alt?: string
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
