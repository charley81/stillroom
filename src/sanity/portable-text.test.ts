import { describe, expect, it } from 'vitest'
import { renderPortableText } from './portable-text'

describe('Work Project Portable Text rendering', () => {
  it('renders approved marks and escapes editorial text', () => {
    const html = renderPortableText(
      [
        {
          _type: 'block',
          style: 'normal',
          markDefs: [
            { _key: 'link', _type: 'link', href: 'https://stillroom.studio' },
          ],
          children: [
            { _type: 'span', text: '<Good>', marks: ['strong'] },
            { _type: 'span', text: ' company', marks: ['link'] },
          ],
        },
      ],
      'copy',
    )

    expect(html).toBe(
      '<p class="copy"><strong>&lt;Good&gt;</strong><a href="https://stillroom.studio" rel="noreferrer"> company</a></p>',
    )
  })

  it('does not render unsafe or protocol-relative links', () => {
    const html = renderPortableText(
      [
        {
          _type: 'block',
          markDefs: [{ _key: 'unsafe', _type: 'link', href: '//example.com' }],
          children: [{ _type: 'span', text: 'link', marks: ['unsafe'] }],
        },
      ],
      'copy',
    )

    expect(html).toContain('href="#"')
  })

  it('fails clearly for unsupported block styles', () => {
    expect(() =>
      renderPortableText(
        [
          {
            _type: 'block',
            style: 'normal',
            children: [],
          },
          { _type: 'callout' } as never,
        ],
        'copy',
      ),
    ).toThrow('Unsupported Portable Text block')
  })
})
