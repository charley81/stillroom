import { describe, expect, it, vi } from 'vitest'
import {
  SITE_SETTINGS_DRAFT_ID,
  SITE_SETTINGS_PUBLISHED_ID,
  migrateSiteSettings,
} from './migrate-site-settings'

describe('Site Settings migration', () => {
  it('creates the same draft and asset reference on every run', async () => {
    const upload = vi
      .fn()
      .mockResolvedValue({ _id: 'image-stable-1200x630-jpg' })
    const createOrReplace = vi.fn(async (document) => document)
    const client = {
      assets: { upload },
      createOrReplace,
      transaction: vi.fn(),
    }

    const first = await migrateSiteSettings({
      client,
      socialImagePath: '/tmp/social.jpg',
      readAsset: async () => Buffer.from('same image'),
    })
    const second = await migrateSiteSettings({
      client,
      socialImagePath: '/tmp/social.jpg',
      readAsset: async () => Buffer.from('same image'),
    })

    expect(first).toEqual(second)
    expect(first._id).toBe(SITE_SETTINGS_DRAFT_ID)
    expect(first.defaultSocialImage.asset.asset!._ref).toBe(
      'image-stable-1200x630-jpg',
    )
    expect(createOrReplace).toHaveBeenCalledTimes(2)
  })

  it('can publish the migrated draft to the stable singleton ID', async () => {
    const commit = vi.fn().mockResolvedValue(undefined)
    const transaction = {
      createOrReplace: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      commit,
    }
    const client = {
      assets: {
        upload: vi.fn().mockResolvedValue({ _id: 'image-stable' }),
      },
      createOrReplace: vi.fn(async (document) => document),
      transaction: vi.fn(() => transaction),
    }

    await migrateSiteSettings({
      client,
      socialImagePath: '/tmp/social.jpg',
      readAsset: async () => Buffer.from('same image'),
      publish: true,
    })

    expect(transaction.createOrReplace).toHaveBeenCalledWith(
      expect.objectContaining({ _id: SITE_SETTINGS_PUBLISHED_ID }),
    )
    expect(transaction.delete).toHaveBeenCalledWith(SITE_SETTINGS_DRAFT_ID)
    expect(commit).toHaveBeenCalledOnce()
  })
})
