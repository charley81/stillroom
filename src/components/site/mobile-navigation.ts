interface MobileNavigationElements {
  trigger: HTMLButtonElement
  closeControl: HTMLButtonElement
  dialog: HTMLElement
}

interface ScrollLockState {
  scrollPosition: number
  rootOverflow: string
  bodyStyles: Map<string, string>
}

interface CloseMenuOptions {
  restoreFocus?: boolean
}

export function setupMobileNavigation() {
  const trigger = document.querySelector<HTMLButtonElement>('[data-menu-open]')
  const closeControl =
    document.querySelector<HTMLButtonElement>('[data-menu-close]')
  const dialog = document.querySelector<HTMLElement>('[data-mobile-menu]')
  if (!trigger || !closeControl || !dialog) return

  initializeMobileNavigation({ trigger, closeControl, dialog })
}

function initializeMobileNavigation({
  trigger,
  closeControl,
  dialog,
}: MobileNavigationElements) {
  const backgroundState = new Map<HTMLElement, boolean>()
  let scrollLockState: ScrollLockState | undefined

  function getFocusableElements() {
    return [
      ...dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]',
      ),
    ].filter((element) => element.getClientRects().length > 0)
  }

  function setBackgroundInert(inert: boolean) {
    if (inert) {
      for (const child of document.body.children) {
        if (!(child instanceof HTMLElement) || child === dialog) continue
        backgroundState.set(child, child.inert)
        child.inert = true
      }
      return
    }

    for (const [element, wasInert] of backgroundState) {
      element.inert = wasInert
    }
    backgroundState.clear()
  }

  function lockBackgroundScroll() {
    const scrollPosition = window.scrollY
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth
    const lockedBodyStyles = new Map<string, string>([
      ['position', 'fixed'],
      ['top', `-${scrollPosition}px`],
      ['left', '0'],
      ['right', '0'],
      ['width', '100%'],
      ['overflow', 'hidden'],
    ])
    if (scrollbarWidth > 0) {
      lockedBodyStyles.set('padding-right', `${scrollbarWidth}px`)
    }

    const previousBodyStyles = new Map<string, string>()
    for (const [property, value] of lockedBodyStyles) {
      previousBodyStyles.set(
        property,
        document.body.style.getPropertyValue(property),
      )
      document.body.style.setProperty(property, value)
    }

    scrollLockState = {
      scrollPosition,
      rootOverflow: document.documentElement.style.overflow,
      bodyStyles: previousBodyStyles,
    }
    document.documentElement.style.overflow = 'hidden'
  }

  function unlockBackgroundScroll() {
    if (!scrollLockState) return

    document.documentElement.style.overflow = scrollLockState.rootOverflow
    for (const [property, value] of scrollLockState.bodyStyles) {
      if (value) document.body.style.setProperty(property, value)
      else document.body.style.removeProperty(property)
    }
    window.scrollTo(0, scrollLockState.scrollPosition)
    scrollLockState = undefined
  }

  function openMenu() {
    if (!dialog.hidden) return

    trigger.setAttribute('aria-expanded', 'true')
    trigger.setAttribute('aria-label', 'Close menu')
    dialog.hidden = false
    lockBackgroundScroll()
    setBackgroundInert(true)
    closeControl.focus()
  }

  function closeMenu({ restoreFocus = true }: CloseMenuOptions = {}) {
    if (dialog.hidden) return

    trigger.setAttribute('aria-expanded', 'false')
    trigger.setAttribute('aria-label', 'Open menu')
    dialog.hidden = true
    setBackgroundInert(false)
    unlockBackgroundScroll()
    if (restoreFocus) trigger.focus({ preventScroll: true })
  }

  trigger.addEventListener('click', openMenu)
  closeControl.addEventListener('click', () => closeMenu())
  dialog.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
    link.addEventListener('click', (event) => {
      queueMicrotask(() => {
        const leavesCurrentPage =
          !event.defaultPrevented &&
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey &&
          link.target !== '_blank'
        closeMenu({ restoreFocus: !leavesCurrentPage })
      })
    })
  })
  window.addEventListener('resize', () => {
    if (!dialog.hidden && getComputedStyle(trigger).display === 'none') {
      closeMenu({ restoreFocus: false })
    }
  })
  document.addEventListener('keydown', (event) => {
    if (dialog.hidden) return

    if (event.key === 'Escape') {
      event.preventDefault()
      closeMenu()
      return
    }
    if (event.key !== 'Tab') return

    const focusableElements = getFocusableElements()
    const firstElement = focusableElements.at(0)
    const lastElement = focusableElements.at(-1)
    if (!firstElement || !lastElement) {
      event.preventDefault()
      return
    }

    const focusIsOutside = !dialog.contains(document.activeElement)
    if (
      event.shiftKey &&
      (document.activeElement === firstElement || focusIsOutside)
    ) {
      event.preventDefault()
      lastElement.focus()
    } else if (
      !event.shiftKey &&
      (document.activeElement === lastElement || focusIsOutside)
    ) {
      event.preventDefault()
      firstElement.focus()
    }
  })
}
