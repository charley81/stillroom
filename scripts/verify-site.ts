import { mkdir } from 'node:fs/promises'
import puppeteer from 'puppeteer-core'
import { JOURNAL_ARTICLE_SLUGS } from './sanity/migrate-journal'
import { WORK_PROJECT_SLUGS } from './sanity/migrate-work'

const baseUrl = process.env.SITE_URL ?? 'http://localhost:4321'
const productionOrigin = 'https://stillroom-app.netlify.app'
const screenshotDirectory = '.sanity/screenshots'
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
]
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
      const expectedStatus = route === '/cutover-404-check' ? 404 : 200
      if (response?.status() !== expectedStatus) {
        errors.push(
          `${viewport.name} ${route}: expected ${expectedStatus}, received ${response?.status() ?? 'no response'}`,
        )
      }

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
        return {
          canonical,
          links,
          images,
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
        }
      })

      result.links.forEach((link) => internalLinks.add(link))
      result.images.forEach((source) => imageSources.add(source))
      if (result.documentWidth > result.viewportWidth) {
        errors.push(
          `${viewport.name} ${route}: horizontal overflow (${result.documentWidth}px document in ${result.viewportWidth}px viewport)`,
        )
      }
      if (expectedStatus === 200) {
        const expectedCanonical = new URL(route, productionOrigin).href
        if (result.canonical !== expectedCanonical) {
          errors.push(
            `${viewport.name} ${route}: canonical ${result.canonical ?? 'missing'}; expected ${expectedCanonical}`,
          )
        }
      } else if (result.canonical) {
        errors.push(`${viewport.name} ${route}: 404 route has a canonical URL`)
      }

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
