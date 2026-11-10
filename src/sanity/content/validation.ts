import { MissingContentError } from './errors'

export interface ContentImageCrop {
  left: number
  right: number
  top: number
  bottom: number
}

export interface ContentImageHotspot {
  x: number
  y: number
  width: number
  height: number
}

export interface ContentImage {
  decorative: boolean
  alt: string | null
  caption: string | null
  url: string
  crop?: ContentImageCrop | null
  hotspot?: ContentImageHotspot | null
  mobileUrl: string | null
  mobileCrop?: ContentImageCrop | null
  mobileHotspot?: ContentImageHotspot | null
}

export interface ClientLogo {
  _id: string
  clientName: string
  url: string
  mimeType: string | null
}

export function requireString(
  value: Record<string, unknown>,
  field: string,
  scope: string,
) {
  if (typeof value[field] !== 'string' || value[field].trim() === '') {
    throw new MissingContentError(
      `${scope} is missing required content: ${field}`,
    )
  }
}

export function requireContentImage(
  value: unknown,
  field: string,
): ContentImage {
  if (!value || typeof value !== 'object') {
    throw new MissingContentError(`Missing required editorial image: ${field}`)
  }
  const image = value as Record<string, unknown>
  if (typeof image.url !== 'string' || image.url.trim() === '') {
    throw new MissingContentError(
      `Missing required editorial image: ${field}.url`,
    )
  }
  if (typeof image.decorative !== 'boolean') {
    throw new MissingContentError(
      `Missing required editorial image: ${field}.decorative`,
    )
  }
  if (
    !image.decorative &&
    (typeof image.alt !== 'string' || image.alt.trim() === '')
  ) {
    throw new MissingContentError(
      `Missing required editorial image: ${field}.alt`,
    )
  }
  if (image.decorative && typeof image.alt === 'string' && image.alt.trim()) {
    throw new MissingContentError(
      `Decorative editorial image must have empty alt text: ${field}.alt`,
    )
  }
  return value as ContentImage
}

export function hasUniqueStrings(values: string[]) {
  const normalized = values.map((value) => value.trim().toLowerCase())
  return normalized.every(Boolean) && new Set(normalized).size === values.length
}

export function cleanDocumentId(id: string) {
  return id.replace(/^drafts\./, '')
}

export function requireClientLogos(
  value: unknown,
  {
    scope,
    count,
    countLabel,
  }: { scope: string; count: number; countLabel: string },
): ClientLogo[] {
  if (!Array.isArray(value) || value.length !== count) {
    throw new MissingContentError(
      `${scope} requires exactly ${countLabel} Client Logo references.`,
    )
  }

  const ids = value.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new MissingContentError(
        `${scope} is missing clientLogos[${index}].`,
      )
    }
    const logo = item as Record<string, unknown>
    requireString(logo, '_id', `${scope} clientLogos[${index}]`)
    requireString(logo, 'clientName', `${scope} clientLogos[${index}]`)
    requireString(logo, 'url', `${scope} clientLogos[${index}]`)
    if (logo.mimeType !== null && typeof logo.mimeType !== 'string') {
      throw new MissingContentError(
        `${scope} clientLogos[${index}] is missing required content: mimeType`,
      )
    }
    return cleanDocumentId(String(logo._id))
  })

  if (new Set(ids).size !== value.length) {
    throw new MissingContentError(
      `${scope} requires ${countLabel} unique Client Logo references.`,
    )
  }

  return value as ClientLogo[]
}
