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
    expect(html).toContain(
      'src="/.netlify/images?url=https%3A%2F%2Fcdn.sanity.io',
    )
    expect(html).toContain('rect%3D240%2C80%2C1920%2C1440')
    expect(html).toContain(
      'w%3D320%26h%3D240%26q%3D82%26fit%3Dcrop%26auto%3Dformat 320w',
    )
    expect(html).toContain(
      'w%3D800%26h%3D600%26q%3D82%26fit%3Dcrop%26auto%3Dformat 800w',
    )
    expect(html).not.toContain('src="https://cdn.sanity.io')
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
    expect(html).toContain('rect%3D0%2C160%2C1200%2C900')
    expect(html).toContain('auto%3Dformat')
    expect(html).not.toContain('src="https://cdn.sanity.io')
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
  it('serves SVG Client Logos through the first-party image CDN without explicit raster transformations', async () => {
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
      'src="/.netlify/images?url=https%3A%2F%2Fcdn.sanity.io%2Ffiles%2Fh2h3psnm%2Fdevelopment%2Flogo.svg"',
    )
    expect(html).not.toContain('src="https://cdn.sanity.io')
    expect(html).toContain('alt="Client One"')
    expect(html).not.toContain('srcset=')
    expect(html).not.toContain('auto=format')
    expect(html).not.toContain('?w=')
  })
})
