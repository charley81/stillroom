import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { describe, expect, it } from 'vitest'
import ClientLogos from '../site/ClientLogos.astro'
import EditorialImage from './EditorialImage.astro'

const rasterImage = {
  decorative: false,
  alt: 'A carefully cropped dining room',
  caption: 'Dining room at dusk',
  url: 'https://cdn.sanity.io/images/h2h3psnm/development/abc123-2400x1600.jpg',
  crop: { left: 0.1, right: 0.1, top: 0.05, bottom: 0.05 },
  hotspot: { x: 0.4, y: 0.45, width: 0.5, height: 0.5 },
  mobileUrl:
    'https://cdn.sanity.io/images/h2h3psnm/development/mobile456-1200x1600.jpg',
  mobileCrop: { left: 0, right: 0, top: 0.1, bottom: 0.1 },
  mobileHotspot: { x: 0.5, y: 0.35, width: 0.6, height: 0.4 },
}

describe('EditorialImage', () => {
  it('renders responsive Sanity raster URLs with the approved crop, format, and quality policy', async () => {
    const container = await AstroContainer.create()
    const html = await container.renderToString(EditorialImage, {
      props: {
        image: { ...rasterImage, mobileUrl: null },
        width: 800,
        height: 600,
        sizes: '(min-width: 768px) 800px, 100vw',
        class: 'editorial-image',
        loading: 'eager',
        fetchpriority: 'high',
      },
    })

    expect(html).toContain('sizes="(min-width: 768px) 800px, 100vw"')
    expect(html).toContain('srcset="')
    expect(html).toContain('rect=240,80,1920,1440')
    expect(html).toContain(
      'w=320&amp;h=240&amp;q=82&amp;fit=crop&amp;auto=format 320w',
    )
    expect(html).toContain(
      'w=800&amp;h=600&amp;q=82&amp;fit=crop&amp;auto=format 800w',
    )
    expect(html).toContain('alt="A carefully cropped dining room"')
    expect(html).toContain('width="800"')
    expect(html).toContain('height="600"')
    expect(html).toContain('loading="eager"')
    expect(html).toContain('fetchpriority="high"')
    expect(html).toContain('decoding="async"')
  })

  it('renders an independent mobile source set at the existing breakpoint', async () => {
    const container = await AstroContainer.create()
    const html = await container.renderToString(EditorialImage, {
      props: {
        image: rasterImage,
        width: 800,
        height: 600,
        sizes: '100vw',
      },
    })

    expect(html).toContain('<source media="(max-width: 760px)"')
    expect(html).toContain('mobile456-1200x1600.jpg')
    expect(html).toContain('rect=0,160,1200,900')
    expect(html).toContain('auto=format')
    expect(html).toContain('sizes="100vw"')
  })

  it('keeps decorative images silent and below-the-fold images lazy', async () => {
    const container = await AstroContainer.create()
    const html = await container.renderToString(EditorialImage, {
      props: {
        image: {
          ...rasterImage,
          decorative: true,
          alt: null,
          mobileUrl: null,
        },
        width: 640,
        height: 480,
        sizes: '100vw',
      },
    })

    expect(html).toMatch(/<img[^>]*\salt(?:\s|>)/)
    expect(html).toContain('loading="lazy"')
    expect(html).not.toContain('fetchpriority=')
  })
})

describe('ClientLogos', () => {
  it('serves SVG Client Logos directly without raster transformations', async () => {
    const container = await AstroContainer.create()
    const html = await container.renderToString(ClientLogos, {
      props: {
        logos: [
          {
            _id: 'client-logo-one',
            clientName: 'Client One',
            url: 'https://cdn.sanity.io/files/h2h3psnm/development/logo.svg',
            mimeType: 'image/svg+xml',
          },
        ],
      },
    })

    expect(html).toContain(
      'src="https://cdn.sanity.io/files/h2h3psnm/development/logo.svg"',
    )
    expect(html).toContain('alt="Client One"')
    expect(html).not.toContain('srcset=')
    expect(html).not.toContain('auto=format')
    expect(html).not.toContain('?w=')
  })
})
