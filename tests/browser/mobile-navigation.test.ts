import puppeteer, { type Browser, type Page } from 'puppeteer-core'
import {
  MOBILE_VIEWPORT,
  resolveChromeExecutablePath,
} from '../../scripts/browser-configuration'
import { LOCAL_DEVELOPMENT_ORIGIN } from '../../src/site-origin'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'

const baseUrl = process.env.SITE_URL ?? LOCAL_DEVELOPMENT_ORIGIN
const selectors = {
  trigger: '[data-menu-open]',
  closeControl: '[data-menu-close]',
  dialog: '[data-mobile-menu]',
  main: '#main-content',
  desktopNavigation: 'nav[aria-label="Primary navigation"]',
  focusable:
    '[data-mobile-menu] a[href], [data-mobile-menu] button:not([disabled])',
  aboutLink: '[data-mobile-menu] a[href="/about"]',
} as const

let browser: Browser
let page: Page

async function waitForOpenMenu() {
  await page.waitForFunction(
    (dialogSelector) =>
      document.querySelector<HTMLElement>(dialogSelector)?.hidden === false,
    {},
    selectors.dialog,
  )
}

async function openMenu() {
  await page.click(selectors.trigger)
  await waitForOpenMenu()
}

async function openMenuWithoutScrollingTheTriggerIntoView() {
  await page.evaluate((triggerSelector) => {
    document.querySelector<HTMLButtonElement>(triggerSelector)!.click()
  }, selectors.trigger)
  await waitForOpenMenu()
}

async function activeElementIsInsideMenu() {
  return page.evaluate((dialogSelector) => {
    const dialog = document.querySelector<HTMLElement>(dialogSelector)
    return Boolean(dialog?.contains(document.activeElement))
  }, selectors.dialog)
}

async function readMobileNavigationState() {
  return page.evaluate((selectors) => {
    const trigger = document.querySelector<HTMLElement>(selectors.trigger)!
    const dialog = document.querySelector<HTMLElement>(selectors.dialog)!
    const main = document.querySelector<HTMLElement>(selectors.main)!
    const desktopNavigation = document.querySelector<HTMLElement>(
      selectors.desktopNavigation,
    )!

    return {
      path: location.pathname,
      role: dialog.getAttribute('role'),
      modal: dialog.getAttribute('aria-modal'),
      label: dialog.getAttribute('aria-label'),
      hidden: dialog.hidden,
      expanded: trigger.getAttribute('aria-expanded'),
      triggerLabel: trigger.getAttribute('aria-label'),
      triggerHasFocus: document.activeElement === trigger,
      triggerDisplay: getComputedStyle(trigger).display,
      desktopNavigationDisplay: getComputedStyle(desktopNavigation).display,
      mainInert: main.inert,
      bodyPosition: document.body.style.position,
      bodyOverflow: document.body.style.overflow,
      rootOverflow: document.documentElement.style.overflow,
      scrollPosition: window.scrollY,
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      activeIsClose: document.activeElement?.matches(selectors.closeControl),
    }
  }, selectors)
}

describe('mobile navigation', () => {
  beforeAll(async () => {
    const response = await fetch(baseUrl).catch(() => undefined)
    if (!response?.ok) {
      throw new Error(
        `The browser tests require the background Astro dev server at ${baseUrl}. Start it with "pnpm astro dev --background".`,
      )
    }

    browser = await puppeteer.launch({
      executablePath: resolveChromeExecutablePath(),
      headless: true,
    })
  })

  beforeEach(async () => {
    page = await browser.newPage()
    await page.setViewport(MOBILE_VIEWPORT)
    await page.goto(new URL('/', baseUrl).href, {
      waitUntil: 'networkidle0',
    })
  })

  afterEach(async () => {
    await page?.close()
  })

  afterAll(async () => {
    await browser?.close()
  })

  it('opens as a named modal, moves focus inside, and makes the background inert', async () => {
    await openMenu()
    const lockedScrollPosition = await page.evaluate(() => window.scrollY)

    expect(await readMobileNavigationState()).toMatchObject({
      role: 'dialog',
      modal: 'true',
      label: 'Site navigation',
      hidden: false,
      expanded: 'true',
      triggerLabel: 'Close menu',
      mainInert: true,
      bodyPosition: 'fixed',
      bodyOverflow: 'hidden',
      rootOverflow: 'hidden',
      activeIsClose: true,
    })

    await page.mouse.wheel({ deltaY: 600 })
    expect(await page.evaluate(() => window.scrollY)).toBe(lockedScrollPosition)

    await page.focus(`${selectors.main} a`)
    expect(await activeElementIsInsideMenu()).toBe(true)
  })

  it('keeps forward and backward keyboard traversal inside the open menu', async () => {
    await openMenu()

    const focusableCount = await page.$$eval(
      selectors.focusable,
      (elements) => elements.length,
    )
    const activeFocusableIndex = () =>
      page.evaluate((focusableSelector) => {
        const focusableElements = [
          ...document.querySelectorAll<HTMLElement>(focusableSelector),
        ]
        return focusableElements.indexOf(document.activeElement as HTMLElement)
      }, selectors.focusable)

    const forwardTraversal = new Set<number>()
    for (let index = 0; index < focusableCount; index += 1) {
      await page.keyboard.press('Tab')
      expect(await activeElementIsInsideMenu()).toBe(true)
      forwardTraversal.add(await activeFocusableIndex())
    }
    expect(forwardTraversal.size).toBe(focusableCount)

    const backwardTraversal = new Set<number>()
    await page.keyboard.down('Shift')
    for (let index = 0; index < focusableCount; index += 1) {
      await page.keyboard.press('Tab')
      expect(await activeElementIsInsideMenu()).toBe(true)
      backwardTraversal.add(await activeFocusableIndex())
    }
    await page.keyboard.up('Shift')
    expect(backwardTraversal.size).toBe(focusableCount)
  })

  it('closes with Escape and restores focus, scrolling, and synchronized trigger state', async () => {
    await page.evaluate(() => window.scrollTo(0, 300))
    const scrollPosition = await page.evaluate(() => window.scrollY)
    await openMenuWithoutScrollingTheTriggerIntoView()

    await page.keyboard.press('Escape')
    await page.waitForFunction(
      (expectedScrollPosition) => window.scrollY === expectedScrollPosition,
      {},
      scrollPosition,
    )

    expect(await readMobileNavigationState()).toMatchObject({
      hidden: true,
      expanded: 'false',
      triggerLabel: 'Open menu',
      triggerHasFocus: true,
      mainInert: false,
      bodyPosition: '',
      rootOverflow: '',
      scrollPosition,
    })
  })

  it('closes from the explicit control and returns focus to the trigger', async () => {
    await openMenu()
    await page.click(selectors.closeControl)

    expect(await readMobileNavigationState()).toMatchObject({
      hidden: true,
      triggerHasFocus: true,
    })
  })

  it('releases modal state when the viewport crosses into desktop navigation', async () => {
    await openMenu()

    await page.setViewport({ width: 1024, height: 768, deviceScaleFactor: 1 })
    await page.waitForFunction(
      (dialogSelector) =>
        document.querySelector<HTMLElement>(dialogSelector)?.hidden === true,
      {},
      selectors.dialog,
    )

    expect(await readMobileNavigationState()).toMatchObject({
      hidden: true,
      expanded: 'false',
      triggerLabel: 'Open menu',
      triggerDisplay: 'none',
      desktopNavigationDisplay: 'flex',
      mainInert: false,
      bodyPosition: '',
      rootOverflow: '',
    })
  })

  it('remains operable when reduced motion is requested', async () => {
    await page.emulateMediaFeatures([
      { name: 'prefers-reduced-motion', value: 'reduce' },
    ])
    await page.reload({ waitUntil: 'networkidle0' })

    await openMenu()
    await page.keyboard.press('Escape')

    expect(await readMobileNavigationState()).toMatchObject({
      hidden: true,
      scrollBehavior: 'auto',
    })
  })

  it('returns focus when a destination click is cancelled on the current page', async () => {
    await openMenu()

    await page.evaluate((aboutLinkSelector) => {
      const link = document.querySelector<HTMLAnchorElement>(aboutLinkSelector)!
      link.addEventListener('click', (event) => event.preventDefault(), {
        once: true,
      })
      link.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        }),
      )
    }, selectors.aboutLink)

    expect(await readMobileNavigationState()).toMatchObject({
      path: '/',
      hidden: true,
      triggerHasFocus: true,
    })
  })

  it('follows a navigation destination without carrying modal state to the next page', async () => {
    await openMenu()

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click(selectors.aboutLink),
    ])

    expect(await readMobileNavigationState()).toMatchObject({
      path: '/about',
      hidden: true,
      expanded: 'false',
      mainInert: false,
      bodyPosition: '',
    })
  })
})
