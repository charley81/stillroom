import { mkdir } from 'node:fs/promises'
import puppeteer from 'puppeteer-core'
import { JOURNAL_ARTICLE_SLUGS } from './sanity/migrate-journal'
import { WORK_PROJECT_SLUGS } from './sanity/migrate-work'
import { validatePublicPage, validateStudioResponse } from './site-verification'

const baseUrl = process.env.SITE_URL ?? 'http://localhost:4321'
const canonicalOrigin =
  process.env.CANONICAL_ORIGIN ?? 'https://stillroom-app.netlify.app'
const screenshotDirectory =
  process.env.SCREENSHOT_DIRECTORY ?? '.sanity/screenshots'
const routes = [
  '/',
  '/services',
  '/work',
  ...WORK_PROJECT_SLUGS.map((slug) => `/work/${slug}`),
  '/about',
  '/journal',
  ...JOURNAL_ARTICLE_SLUGS.map((slug) => `/journal/${slug}`),
  '/contact',
  '/cutover-404-check',
  '/work/cutover-404-check',
  '/journal/cutover-404-check',
]
const notFoundRoutes = new Set([
  '/cutover-404-check',
  '/work/cutover-404-check',
  '/journal/cutover-404-check',
])
const viewports = [
  { name: 'desktop', width: 1440, height: 900, deviceScaleFactor: 1 },
  {
    name: 'mobile',
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  },
]

await mkdir(screenshotDirectory, { recursive: true })

const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH ??
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
})

const errors: string[] = []
const internalLinks = new Set<string>()
const imageSources = new Set<string>()

try {
  const page = await browser.newPage()
  page.on('pageerror', (error) =>
    errors.push(
      `Page error: ${error instanceof Error ? error.message : String(error)}`,
    ),
  )

  for (const viewport of viewports) {
    await page.setViewport(viewport)

    for (const route of routes) {
      const response = await page.goto(new URL(route, baseUrl).href, {
        waitUntil: 'networkidle0',
        timeout: 60_000,
      })
      await page.evaluate(async () => {
        for (
          let top = 0;
          top < document.documentElement.scrollHeight;
          top += 700
        ) {
          window.scrollTo(0, top)
          await new Promise((resolve) => setTimeout(resolve, 25))
        }
        window.scrollTo(0, 0)
        await new Promise((resolve) => setTimeout(resolve, 100))
      })

      const result = await page.evaluate(() => {
        const images = [...document.images].map(
          (image) => image.currentSrc || image.src,
        )
        const canonical = document.querySelector<HTMLLinkElement>(
          'link[rel="canonical"]',
        )?.href
        const links = [
          ...document.querySelectorAll<HTMLAnchorElement>('a[href]'),
        ]
          .map((link) => link.href)
          .filter((href) => href.startsWith(location.origin))
        const controls = [
          ...document.querySelectorAll<HTMLElement>(
            'input:not([type="hidden"]), textarea, select',
          ),
        ]
        const unlabeledControlCount = controls.filter((control) => {
          if (
            control.getAttribute('aria-label')?.trim() ||
            control.getAttribute('aria-labelledby')?.trim() ||
            control.closest('label')
          ) {
            return false
          }
          const id = control.id
          return (
            !id || !document.querySelector(`label[for="${CSS.escape(id)}"]`)
          )
        }).length
        return {
          canonical,
          links,
          images,
          title: document.title,
          description:
            document
              .querySelector<HTMLMetaElement>('meta[name="description"]')
              ?.content.trim() || undefined,
          h1Count: document.querySelectorAll('h1').length,
          missingAltCount: [...document.images].filter(
            (image) => !image.hasAttribute('alt'),
          ).length,
          unlabeledControlCount,
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
        }
      })

      result.links.forEach((link) => internalLinks.add(link))
      result.images.forEach((source) => imageSources.add(source))
      errors.push(
        ...validatePublicPage({
          route,
          viewport: viewport.name,
          status: response?.status(),
          expectedStatus: notFoundRoutes.has(route) ? 404 : 200,
          canonical: result.canonical,
          expectedCanonical: notFoundRoutes.has(route)
            ? undefined
            : new URL(route, canonicalOrigin).href,
          title: result.title,
          description: result.description,
          h1Count: result.h1Count,
          missingAltCount: result.missingAltCount,
          unlabeledControlCount: result.unlabeledControlCount,
          documentWidth: result.documentWidth,
          viewportWidth: result.viewportWidth,
          links: result.links,
        }),
      )

      const name = route === '/' ? 'home' : route.slice(1).replaceAll('/', '--')
      await page.screenshot({
        path: `${screenshotDirectory}/${name}-${viewport.name}.png`,
        fullPage: true,
      })
      console.log(
        `${viewport.name} ${route}: ${response?.status()} (${result.documentWidth}px/${result.viewportWidth}px)`,
      )
    }
  }

  const studioResponse = await fetch(new URL('/studio', baseUrl))
  errors.push(
    ...validateStudioResponse({
      status: studioResponse.status,
      robots: studioResponse.headers.get('x-robots-tag') ?? undefined,
    }),
  )

  for (const link of internalLinks) {
    const response = await fetch(link, { redirect: 'manual' })
    if (response.status >= 400) {
      errors.push(`Internal link ${link} returned ${response.status}`)
    }
  }
  for (const source of imageSources) {
    const response = await fetch(source)
    if (!response.ok) errors.push(`Image ${source} returned ${response.status}`)
  }
} finally {
  await browser.close()
}

if (errors.length > 0) throw new Error(errors.join('\n'))

console.log(
  `Verified ${routes.length} routes at ${viewports.length} responsive viewports, ${internalLinks.size} internal links, and ${imageSources.size} images.`,
)
