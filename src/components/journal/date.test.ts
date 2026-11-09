import { describe, expect, it } from 'vitest'
import { formatJournalDate } from './date'

describe('Journal date formatting', () => {
  it('formats editorial dates consistently in UTC', () => {
    expect(formatJournalDate('2026-09-09', 'short')).toBe('09 SEPT 2026')
    expect(formatJournalDate('2026-10-21', 'long')).toBe('21 OCTOBER 2026')
  })
})
