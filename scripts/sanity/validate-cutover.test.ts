import { describe, expect, it } from 'vitest'
import {
  assertCutoverInventory,
  EXPECTED_CUTOVER_DOCUMENTS,
} from './validate-cutover'

describe('development cutover inventory', () => {
  it('accepts the exact published migration inventory', () => {
    expect(() =>
      assertCutoverInventory(
        EXPECTED_CUTOVER_DOCUMENTS.map(({ id, type }) => ({
          _id: id,
          _type: type,
        })),
      ),
    ).not.toThrow()
  })

  it('reports missing, unexpected, and leftover draft documents together', () => {
    const [missing, ...documents] = EXPECTED_CUTOVER_DOCUMENTS

    expect(() =>
      assertCutoverInventory([
        ...documents.map(({ id, type }) => ({ _id: id, _type: type })),
        { _id: `drafts.${documents[0].id}`, _type: documents[0].type },
        { _id: 'work-project-unexpected', _type: 'workProject' },
      ]),
    ).toThrow(
      [
        `Missing published document: ${missing.id}`,
        `Unexpected cutover document: work-project-unexpected`,
        `Leftover migration draft: drafts.${documents[0].id}`,
      ].join('\n'),
    )
  })
})
