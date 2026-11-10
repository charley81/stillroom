import { pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  runMigrationCommand,
  runProductionLaunchCommand,
} from './migration-runtime'

const commandPath = '/tmp/stillroom-migration-command.ts'
const commandUrl = pathToFileURL(commandPath).href
const environmentKeys = [
  'PUBLIC_SANITY_PROJECT_ID',
  'SANITY_API_WRITE_TOKEN',
  'SANITY_API_READ_TOKEN',
  'SANITY_AUTH_TOKEN',
  'SANITY_MIGRATION_DATASET',
  'ALLOW_PRODUCTION_MIGRATION',
  'ALLOW_PRODUCTION_LAUNCH',
] as const
const originalArgv = [...process.argv]
const originalEnvironment = Object.fromEntries(
  environmentKeys.map((key) => [key, process.env[key]]),
)

afterEach(() => {
  process.argv = [...originalArgv]
  for (const key of environmentKeys) {
    const value = originalEnvironment[key]
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  vi.restoreAllMocks()
})

describe('migration command environment', () => {
  it('only runs direct commands and resolves dataset, credentials, client, and publish flags', async () => {
    process.argv = ['node', commandPath, '--publish']
    vi.spyOn(process, 'loadEnvFile').mockImplementation(() => {})
    process.env.PUBLIC_SANITY_PROJECT_ID = 'h2h3psnm'
    process.env.SANITY_AUTH_TOKEN = 'fallback-write-token'
    delete process.env.SANITY_API_WRITE_TOKEN
    process.env.SANITY_MIGRATION_DATASET = 'development'
    const migrate = vi.fn(async ({ client, dataset, publish }) => {
      expect(client.config()).toEqual(
        expect.objectContaining({
          projectId: 'h2h3psnm',
          dataset: 'development',
          token: 'fallback-write-token',
          useCdn: false,
        }),
      )
      expect(dataset).toBe('development')
      expect(publish).toBe(true)
    })

    await runMigrationCommand({
      moduleUrl: commandUrl,
      migrate,
      successMessage: () => 'Migration complete.',
    })

    expect(migrate).toHaveBeenCalledOnce()
  })

  it('blocks production migration before running the command', async () => {
    process.argv = ['node', commandPath]
    vi.spyOn(process, 'loadEnvFile').mockImplementation(() => {})
    process.env.PUBLIC_SANITY_PROJECT_ID = 'h2h3psnm'
    process.env.SANITY_API_WRITE_TOKEN = 'write-token'
    process.env.SANITY_MIGRATION_DATASET = 'production'
    delete process.env.ALLOW_PRODUCTION_MIGRATION
    const migrate = vi.fn()

    await expect(
      runMigrationCommand({
        moduleUrl: commandUrl,
        migrate,
        successMessage: () => 'Migration complete.',
      }),
    ).rejects.toThrow(
      'Production migration is blocked. Set ALLOW_PRODUCTION_MIGRATION=true explicitly.',
    )
    expect(migrate).not.toHaveBeenCalled()
  })

  it('does nothing when the module was imported instead of executed directly', async () => {
    process.argv = ['node', commandPath]
    const migrate = vi.fn()

    await runMigrationCommand({
      moduleUrl: pathToFileURL('/tmp/imported-migration.ts').href,
      migrate,
      successMessage: () => 'Migration complete.',
    })

    expect(migrate).not.toHaveBeenCalled()
  })
})

describe('production launch command environment', () => {
  it('blocks launch before constructing or running production work', async () => {
    process.argv = ['node', commandPath]
    vi.spyOn(process, 'loadEnvFile').mockImplementation(() => {})
    process.env.PUBLIC_SANITY_PROJECT_ID = 'h2h3psnm'
    process.env.SANITY_API_WRITE_TOKEN = 'write-token'
    process.env.SANITY_API_READ_TOKEN = 'read-token'
    delete process.env.ALLOW_PRODUCTION_LAUNCH
    const launch = vi.fn()

    await expect(
      runProductionLaunchCommand({ moduleUrl: commandUrl, launch }),
    ).rejects.toThrow(
      'Production launch is blocked. Set ALLOW_PRODUCTION_LAUNCH=true explicitly.',
    )
    expect(launch).not.toHaveBeenCalled()
  })
})
