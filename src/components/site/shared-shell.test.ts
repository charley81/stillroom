import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { describe, expect, it } from 'vitest'
import Footer from './Footer.astro'
import Header from './Header.astro'

const settings = {
  _id: 'siteSettings',
  studioName: 'Stillroom Studio',
  registeredMarkText: 'stillroom®',
  homeLabel: 'Welcome',
  workLabel: 'Projects',
  servicesLabel: 'What we do',
  aboutLabel: 'Our studio',
  journalLabel: 'Ideas',
  contactLabel: 'Say hello',
  headerCtaLabel: 'Make something',
  emailAddress: 'hello@stillroom.studio',
  socialLinks: [
    {
      _key: 'instagram',
      platform: 'Instagram',
      url: 'https://instagram.com/stillroom',
    },
    {
      _key: 'linkedin',
      platform: 'LinkedIn',
      url: 'https://linkedin.com/company/stillroom',
    },
  ],
  newsletterHeading: 'A useful note, occasionally.',
  newsletterDescription: 'Hospitality, culture, and thoughtful design.',
  footerTagline: 'Independent by nature.',
  defaultSeoTitle: 'Stillroom',
  defaultSeoDescription: 'Stillroom description',
  defaultSocialImage: {
    decorative: false,
    alt: 'Stillroom collage',
    url: 'https://cdn.sanity.io/social.jpg',
  },
}

describe('Sanity-backed shared shell', () => {
  it('renders CMS labels against fixed header destinations', async () => {
    const container = await AstroContainer.create()
    const html = await container.renderToString(Header, {
      props: { settings, pathname: '/work' },
    })

    expect(html).toContain('href="/work"')
    expect(html).toContain('Projects')
    expect(html).toContain('href="/services"')
    expect(html).toContain('What we do')
    expect(html).toContain('href="/contact"')
    expect(html).toContain('Make something')
    expect(html).not.toContain('href="/studio"')
  })

  it('renders contact, social, newsletter, tagline and generated year content', async () => {
    const container = await AstroContainer.create()
    const html = await container.renderToString(Footer, {
      props: { settings, currentYear: 2032, isHome: false },
    })

    expect(html).toContain('A useful note, occasionally.')
    expect(html).toContain('Hospitality, culture, and thoughtful design.')
    expect(html).toContain('mailto:hello@stillroom.studio')
    expect(html).toContain('https://instagram.com/stillroom')
    expect(html).toContain('https://linkedin.com/company/stillroom')
    expect(html).toContain('© Stillroom Studio 2032')
    expect(html).toContain('Independent by nature.')
    expect(html).toContain('min-h-[1118px]')
    expect(html).toContain('md:min-h-[591px]')
    expect(html).not.toContain('overflow-hidden')
  })

  it('keeps the shorter approved desktop footer on Home', async () => {
    const container = await AstroContainer.create()
    const html = await container.renderToString(Footer, {
      props: { settings, currentYear: 2032, isHome: true },
    })

    expect(html).toContain('md:min-h-[530px]')
    expect(html).not.toContain('md:min-h-[591px]')
  })
})
