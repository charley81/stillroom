import { mkdir } from 'node:fs/promises'
import puppeteer from 'puppeteer-core'
import { ROUTE_VERIFICATION_CASES } from '../src/sanity/manifests/routes'
import { validatePublicPage, validateStudioResponse } from './site-verification'

const baseUrl = process.env.SITE_URL ?? 'http://localhost:4321'
const canonicalOrigin =
  process.env.CANONICAL_ORIGIN ?? 'https://stillroom-app.netlify.app'
const screenshotDirectory =
  process.env.SCREENSHOT_DIRECTORY ?? '.sanity/screenshots'
const routes = ROUTE_VERIFICATION_CASES.map(({ route }) => route)
const expectedStatuses = new Map(
  ROUTE_VERIFICATION_CASES.map(({ route, expectedStatus }) => [
    route,
    expectedStatus,
  ]),
)
const scenarios = [
  {
    name: 'desktop',
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
  },
  {
    name: 'intermediate',
    viewport: { width: 1024, height: 768, deviceScaleFactor: 1 },
  },
  {
    name: 'mobile',
    viewport: {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    },
  },
  {
    name: 'desktop-text-125-stress',
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
    rootFontScale: 1.25,
    stressContent: true,
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

  for (const scenario of scenarios) {
    await page.setViewport(scenario.viewport)

    for (const route of routes) {
      const response = await page.goto(new URL(route, baseUrl).href, {
        waitUntil: 'networkidle0',
        timeout: 60_000,
      })
      await page.evaluate(
        async ({ rootFontScale = 1, stressContent = false }) => {
          document.documentElement.style.fontSize = `${rootFontScale * 100}%`
          if (stressContent) {
            document
              .querySelectorAll<HTMLElement>(
                'main h1, main h2, main h3, main p',
              )
              .forEach((element) => {
                const walker = document.createTreeWalker(
                  element,
                  NodeFilter.SHOW_TEXT,
                )
                const textNodes: Text[] = []
                while (walker.nextNode())
                  textNodes.push(walker.currentNode as Text)
                textNodes.forEach((node) => {
                  const text = node.textContent?.trim()
                  if (text) node.textContent = `${text} ${text}`
                })
              })
          }

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
        },
        scenario,
      )

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
        const clippedTextContainers = [
          ...document.querySelectorAll<HTMLElement>('body *'),
        ]
          .filter((element) => {
            if (
              !element.textContent?.trim() ||
              element.clientHeight === 0 ||
              element.classList.contains('sr-only')
            ) {
              return false
            }
            const style = getComputedStyle(element)
            const clipsVertically = ['hidden', 'clip'].includes(style.overflowY)
            const clipsHorizontally = ['hidden', 'clip'].includes(
              style.overflowX,
            )
            return (
              (clipsVertically &&
                element.scrollHeight > element.clientHeight + 1) ||
              (clipsHorizontally &&
                element.scrollWidth > element.clientWidth + 1)
            )
          })
          .map((element) =>
            [
              element.tagName.toLowerCase(),
              element.id && `#${element.id}`,
              ...element.classList,
            ]
              .filter(Boolean)
              .join('.'),
          )
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
          clippedTextContainers,
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
        }
      })

      result.links.forEach((link) => internalLinks.add(link))
      result.images.forEach((source) => imageSources.add(source))
      errors.push(
        ...validatePublicPage({
          route,
          viewport: scenario.name,
          status: response?.status(),
          expectedStatus: expectedStatuses.get(route)!,
          canonical: result.canonical,
          expectedCanonical:
            expectedStatuses.get(route) === 404
              ? undefined
              : new URL(route, canonicalOrigin).href,
          title: result.title,
          description: result.description,
          h1Count: result.h1Count,
          missingAltCount: result.missingAltCount,
          unlabeledControlCount: result.unlabeledControlCount,
          clippedTextCount: result.clippedTextContainers.length,
          documentWidth: result.documentWidth,
          viewportWidth: result.viewportWidth,
          links: result.links,
        }),
      )

      const name = route === '/' ? 'home' : route.slice(1).replaceAll('/', '--')
      await page.screenshot({
        path: `${screenshotDirectory}/${name}-${scenario.name}.png`,
        fullPage: true,
      })
      console.log(
        `${scenario.name} ${route}: ${response?.status()} (${result.documentWidth}px/${result.viewportWidth}px, ${result.clippedTextContainers.length} clipped text containers${result.clippedTextContainers.length ? `: ${result.clippedTextContainers.join(', ')}` : ''})`,
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
  `Verified ${routes.length} routes across ${scenarios.length} responsive and content-stress scenarios, ${internalLinks.size} internal links, and ${imageSources.size} images.`,
)
