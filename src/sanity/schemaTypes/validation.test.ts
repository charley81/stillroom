import { describe, expect, it } from 'vitest'
import {
  exactCount,
  uniqueReferences,
  uniqueTrimmedStrings,
  validateEditorialImageAccessibility,
} from './validation'

describe('Sanity content validation', () => {
  it('requires exactly four items for fixed Services layouts', () => {
    expect(exactCount(undefined, 4, 'Services')).toBe(
      'Services requires exactly 4 items.',
    )
    expect(exactCount([1, 2, 3], 4, 'Services')).toBe(
      'Services requires exactly 4 items.',
    )
    expect(exactCount([1, 2, 3, 4], 4, 'Services')).toBe(true)
    expect(exactCount([1, 2, 3, 4, 5], 4, 'Services')).toBe(
      'Services requires exactly 4 items.',
    )
  })

  it('rejects duplicate references and deliverables', () => {
    expect(
      uniqueReferences([
        { _ref: 'service.brand-strategy' },
        { _ref: 'service.brand-strategy' },
      ]),
    ).toBe('References must be unique.')
    expect(
      uniqueReferences([
        { _ref: 'service.brand-strategy' },
        { _ref: 'service.visual-identity' },
      ]),
    ).toBe(true)

    expect(uniqueTrimmedStrings(['Research', ' research '])).toBe(
      'Items must be non-empty and unique.',
    )
    expect(uniqueTrimmedStrings(['Research', 'Positioning'])).toBe(true)
  })

  it('requires useful alt text for editorial images', () => {
    expect(
      validateEditorialImageAccessibility({ decorative: false, alt: '' }),
    ).toBe('Alternative text is required unless the image is decorative.')
    expect(
      validateEditorialImageAccessibility({
        decorative: false,
        alt: 'service-brand.jpg',
      }),
    ).toBe('Alternative text must describe the image, not repeat a filename.')
    expect(
      validateEditorialImageAccessibility({
        decorative: true,
        alt: 'Decorative flourish',
      }),
    ).toBe('Decorative images must have empty alternative text.')
    expect(
      validateEditorialImageAccessibility({
        decorative: false,
        alt: 'Hands arranging hospitality brand materials',
      }),
    ).toBe(true)
  })
})
