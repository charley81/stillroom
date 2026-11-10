import { describe, expect, it, vi } from 'vitest'
import { runMigrationPlan, type MigrationStep } from './migrate-all'

describe('complete Sanity migration', () => {
  it('runs every migration in dependency order and waits for each one', async () => {
    const events: string[] = []
    const names = [
      'Site Settings',
      'Services and Contact',
      'About and Client Logos',
      'Work',
      'Journal',
      'Home',
    ]
    const steps: MigrationStep[] = names.map((name) => ({
      name,
      run: vi.fn(async () => {
        events.push(`start:${name}`)
        await Promise.resolve()
        events.push(`finish:${name}`)
      }),
    }))

    await runMigrationPlan(steps)

    expect(events).toEqual(
      names.flatMap((name) => [`start:${name}`, `finish:${name}`]),
    )
  })

  it('stops immediately when one migration fails', async () => {
    const laterStep = vi.fn()
    const steps: MigrationStep[] = [
      { name: 'first', run: vi.fn(async () => undefined) },
      {
        name: 'broken',
        run: vi.fn(async () => {
          throw new Error('migration failed')
        }),
      },
      { name: 'later', run: laterStep },
    ]

    await expect(runMigrationPlan(steps)).rejects.toThrow('migration failed')
    expect(laterStep).not.toHaveBeenCalled()
  })
})
