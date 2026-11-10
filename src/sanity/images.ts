import { createImageUrlBuilder } from '@sanity/image-url'
import type {
  ContentImageCrop,
  ContentImageHotspot,
} from './content/validation'

/**
 * Editorial photographs use a high-but-compressed quality of 82. Sanity's
 * `auto=format` then selects AVIF or WebP when the requesting browser supports
 * them while retaining the source format as a fallback.
 */
export const EDITORIAL_IMAGE_QUALITY = 82

const RESPONSIVE_WIDTHS = [320, 480, 640, 768, 960, 1200, 1440, 1920, 2400]

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
      parsed.hostname !== 'cdn.sanity.io' ||
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

  return image.url()
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
    return { src: source.url, srcset: source.url }
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
