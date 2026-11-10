import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { createBackupPaths, exportDatasetBackup } from './export-dataset'

describe('Sanity dataset backups', () => {
  it('creates distinct timestamped archive and manifest paths', () => {
    expect(
      createBackupPaths({
        directory: '.sanity/backups',
        dataset: 'production',
        label: 'pre-migration',
        now: new Date('2026-11-10T15:20:30.000Z'),
      }),
    ).toEqual({
      archivePath:
        '.sanity/backups/production-pre-migration-2026-11-10T15-20-30-000Z.tar.gz',
      manifestPath:
        '.sanity/backups/production-pre-migration-2026-11-10T15-20-30-000Z.json',
    })
  })

  it('exports assets and drafts and records an integrity manifest', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'stillroom-backup-'))
    const exporter = vi.fn(async ({ outputPath }: { outputPath: string }) => {
      await writeFile(outputPath, 'restorable archive')
      return { documentCount: 35, assetCount: 61 }
    })

    const result = await exportDatasetBackup({
      client: {} as never,
      dataset: 'production',
      label: 'post-migration',
      directory,
      now: new Date('2026-11-10T15:30:00.000Z'),
      exporter,
    })

    expect(exporter).toHaveBeenCalledWith(
      expect.objectContaining({
        dataset: 'production',
        assets: true,
        drafts: true,
        mode: 'stream',
      }),
    )
    const manifest = JSON.parse(await readFile(result.manifestPath, 'utf8'))
    expect(manifest).toEqual(
      expect.objectContaining({
        dataset: 'production',
        label: 'post-migration',
        documentCount: 35,
        assetCount: 61,
        sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    )
  })
})
