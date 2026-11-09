export interface PortableTextSpan {
  _type: 'span'
  text?: string
  marks?: string[]
}

export interface PortableTextMarkDefinition {
  _key: string
  _type: 'link'
  href: string
}

export interface PortableTextBlock {
  _type: 'block'
  style?: 'normal'
  children?: PortableTextSpan[]
  markDefs?: PortableTextMarkDefinition[]
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function safeHref(href: string) {
  const safeAbsolute = /^(https?:\/\/|mailto:)/i.test(href)
  const safeRelative =
    (href.startsWith('/') && !href.startsWith('//')) || href.startsWith('#')
  return safeAbsolute || safeRelative ? href : '#'
}

function renderSpan(
  span: PortableTextSpan,
  definitions: Map<string, PortableTextMarkDefinition>,
) {
  let html = escapeHtml(span.text ?? '')
  for (const mark of span.marks ?? []) {
    if (mark === 'strong') html = `<strong>${html}</strong>`
    else if (mark === 'em') html = `<em>${html}</em>`
    else {
      const definition = definitions.get(mark)
      if (definition?._type === 'link') {
        const href = escapeHtml(safeHref(definition.href))
        const external = /^https?:\/\//i.test(definition.href)
          ? ' rel="noreferrer"'
          : ''
        html = `<a href="${href}"${external}>${html}</a>`
      }
    }
  }
  return html
}

export function renderPortableText(
  value: PortableTextBlock[],
  paragraphClass: string,
) {
  return value
    .map((block) => {
      if (
        block._type !== 'block' ||
        (block.style && block.style !== 'normal')
      ) {
        throw new Error(`Unsupported Portable Text block: ${block._type}`)
      }
      const definitions = new Map(
        (block.markDefs ?? []).map((definition) => [
          definition._key,
          definition,
        ]),
      )
      const content = (block.children ?? [])
        .map((span) => renderSpan(span, definitions))
        .join('')
      return `<p class="${paragraphClass}">${content}</p>`
    })
    .join('')
}
