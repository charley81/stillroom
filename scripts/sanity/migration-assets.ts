import { fileURLToPath } from 'node:url'

const MIGRATION_ASSET_ROOT = new URL('./assets/', import.meta.url)

export function migrationAssetPath(path: string) {
  return fileURLToPath(new URL(path.replace(/^\//, ''), MIGRATION_ASSET_ROOT))
}
