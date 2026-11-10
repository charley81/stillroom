export interface PublicPageSnapshot {
  route: string
  viewport: string
  status: number | undefined
  expectedStatus: number
  canonical: string | undefined
  expectedCanonical: string | undefined
  title: string
  description: string | undefined
  h1Count: number
  missingAltCount: number
  unlabeledControlCount: number
  documentWidth: number
  viewportWidth: number
  links: string[]
}

function pageLabel(snapshot: PublicPageSnapshot) {
  return `${snapshot.viewport} ${snapshot.route}`
}

export function validatePublicPage(snapshot: PublicPageSnapshot) {
  const errors: string[] = []
  const label = pageLabel(snapshot)
  const expectedStatus = snapshot.expectedStatus

  if (snapshot.status !== expectedStatus) {
    errors.push(
      `${label}: expected ${expectedStatus}, received ${snapshot.status ?? 'no response'}`,
    )
  }
  if (
    expectedStatus === 200 &&
    snapshot.canonical !== snapshot.expectedCanonical
  ) {
    errors.push(
      `${label}: canonical ${snapshot.canonical ?? 'missing'}; expected ${snapshot.expectedCanonical}`,
    )
  }
  if (expectedStatus === 404 && snapshot.canonical) {
    errors.push(`${label}: 404 route has a canonical URL`)
  }
  if (!snapshot.title.trim()) errors.push(`${label}: document title is missing`)
  if (!snapshot.description?.trim()) {
    errors.push(`${label}: meta description is missing`)
  }
  if (snapshot.h1Count !== 1) {
    errors.push(`${label}: found ${snapshot.h1Count} h1 elements; expected 1`)
  }
  if (snapshot.missingAltCount > 0) {
    errors.push(
      `${label}: ${snapshot.missingAltCount} image without alt attributes`,
    )
  }
  if (snapshot.unlabeledControlCount > 0) {
    errors.push(
      `${label}: ${snapshot.unlabeledControlCount} unlabeled form control`,
    )
  }
  if (snapshot.documentWidth > snapshot.viewportWidth) {
    errors.push(
      `${label}: horizontal overflow (${snapshot.documentWidth}px document in ${snapshot.viewportWidth}px viewport)`,
    )
  }
  if (
    snapshot.links.some((href) => {
      try {
        return new URL(href).pathname.startsWith('/studio')
      } catch {
        return false
      }
    })
  ) {
    errors.push(`${label}: public navigation exposes /studio`)
  }

  return errors
}

export function validateStudioResponse({
  status,
  robots,
}: {
  status: number
  robots: string | undefined
}) {
  const errors: string[] = []
  if (status !== 200) errors.push(`Studio returned ${status}; expected 200.`)
  const directives = new Set(
    (robots ?? '')
      .toLowerCase()
      .split(',')
      .map((directive) => directive.trim()),
  )
  if (!directives.has('noindex') || !directives.has('nofollow')) {
    errors.push('Studio response is missing noindex, nofollow.')
  }
  return errors
}
