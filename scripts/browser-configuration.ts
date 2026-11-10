import type { Viewport } from 'puppeteer-core'

export const MOBILE_VIEWPORT: Viewport = {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
}

const DEFAULT_CHROME_EXECUTABLE_PATH =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

export function resolveChromeExecutablePath(
  environment: NodeJS.ProcessEnv = process.env,
) {
  return environment.CHROME_PATH ?? DEFAULT_CHROME_EXECUTABLE_PATH
}
