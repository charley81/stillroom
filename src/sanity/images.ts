import { createImageUrlBuilder } from '@sanity/image-url'
import type {
  ContentImageCrop,
  ContentImageHotspot,
} from './content/validation'

/**
 * Editorial photographs use a high-but-compressed quality of 82. Sanity crops
 * each responsive source, then Netlify Image CDN serves it from the site's
 * origin and negotiates the final browser format.
 */
export const EDITORIAL_IMAGE_QUALITY = 82

const RESPONSIVE_WIDTHS = [320, 480, 640, 768, 960, 1200, 1440, 1920, 2400]
const SANITY_ASSET_HOSTNAME = 'cdn.sanity.io'
const NETLIFY_IMAGE_ENDPOINT = '/.netlify/images'

export interface ResponsiveImageSource {
  url: string
  crop?: ContentImageCrop | null
  hotspot?: ContentImageHotspot | null
}

interface SanityImageLocation {
  projectId: string
  dataset: string
  intrinsicWidth: number | null
}

function parseSanityImageLocation(url: string): SanityImageLocation | null {
  try {
    const parsed = new URL(url)
    const [, resource, projectId, dataset, filename] =
      parsed.pathname.split('/')
    if (
      parsed.hostname !== SANITY_ASSET_HOSTNAME ||
      resource !== 'images' ||
      !projectId ||
      !dataset ||
      !filename
    ) {
      return null
    }

    const dimensions = filename.match(/-(\d+)x(\d+)\.[^.]+$/)
    return {
      projectId,
      dataset,
      intrinsicWidth: dimensions ? Number(dimensions[1]) : null,
    }
  } catch {
    return null
  }
}

export function createFirstPartySanityAssetUrl(url: string) {
  try {
    const parsed = new URL(url)
    if (parsed.hostname !== SANITY_ASSET_HOSTNAME) return url

    const query = new URLSearchParams({ url: parsed.href })
    return `${NETLIFY_IMAGE_ENDPOINT}?${query}`
  } catch {
    return url
  }
}

function responsiveWidths(maxWidth: number, intrinsicWidth: number | null) {
  const effectiveMaxWidth = Math.max(
    1,
    Math.min(maxWidth, intrinsicWidth ?? maxWidth),
  )
  return [
    ...new Set([
      ...RESPONSIVE_WIDTHS.filter((width) => width < effectiveMaxWidth),
      effectiveMaxWidth,
    ]),
  ].sort((left, right) => left - right)
}

function transformedUrl({
  source,
  width,
  height,
  fit,
  location,
}: {
  source: ResponsiveImageSource
  width: number
  height: number
  fit: 'crop' | 'max'
  location: SanityImageLocation
}) {
  let image = createImageUrlBuilder({
    projectId: location.projectId,
    dataset: location.dataset,
  })
    .image({
      asset: { url: source.url },
      ...(source.crop ? { crop: source.crop } : {}),
      ...(source.hotspot ? { hotspot: source.hotspot } : {}),
    })
    .width(width)
    .quality(EDITORIAL_IMAGE_QUALITY)
    .auto('format')

  image = fit === 'crop' ? image.height(height).fit('crop') : image.fit('max')

  return createFirstPartySanityAssetUrl(image.url())
}

export function createResponsiveSanityImage({
  source,
  width,
  height,
  fit = 'crop',
}: {
  source: ResponsiveImageSource
  width: number
  height: number
  fit?: 'crop' | 'max'
}) {
  const location = parseSanityImageLocation(source.url)
  if (!location) {
    const url = createFirstPartySanityAssetUrl(source.url)
    return { src: url, srcset: url }
  }

  const widths = responsiveWidths(width, location.intrinsicWidth)
  const urls = widths.map((candidateWidth) => ({
    width: candidateWidth,
    url: transformedUrl({
      source,
      width: candidateWidth,
      height: Math.max(1, Math.round((candidateWidth * height) / width)),
      fit,
      location,
    }),
  }))

  return {
    src: urls.at(-1)?.url ?? source.url,
    srcset: urls.map(({ url, width }) => `${url} ${width}w`).join(', '),
  }
}
