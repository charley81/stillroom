import { createClient, type SanityClient } from '@sanity/client'
import { pathToFileURL } from 'node:url'
import { SANITY_API_VERSION } from '../../src/sanity/constants'
import { ABOUT_ASSET_PATHS, migrateAbout } from './migrate-about'
import { HOME_ASSET_PATHS, migrateHome } from './migrate-home'
import { migrateJournal } from './migrate-journal'
import {
  migrateServicesContact,
  SERVICES_CONTACT_ASSET_PATHS,
} from './migrate-services-contact'
import {
  migrateSiteSettings,
  SITE_SETTINGS_SOCIAL_IMAGE_PATH,
} from './migrate-site-settings'
import { migrateWork } from './migrate-work'

export interface MigrationStep {
  name: string
  run: () => Promise<unknown>
}

type SiteSettingsMigrationClient = Parameters<
  typeof migrateSiteSettings
>[0]['client']
type ServicesContactMigrationClient = Parameters<
  typeof migrateServicesContact
>[0]['client']
type AboutMigrationClient = Parameters<typeof migrateAbout>[0]['client']
type WorkMigrationClient = Parameters<typeof migrateWork>[0]['client']
type JournalMigrationClient = Parameters<typeof migrateJournal>[0]['client']
type HomeMigrationClient = Parameters<typeof migrateHome>[0]['client']

export async function runMigrationPlan(steps: MigrationStep[]) {
  for (const step of steps) {
    await step.run()
    console.log(`Completed ${step.name} migration.`)
  }
}

export function buildMigrationPlan(client: SanityClient, publish: boolean) {
  return [
    {
      name: 'Site Settings',
      run: () =>
        migrateSiteSettings({
          client: client as unknown as SiteSettingsMigrationClient,
          publish,
          socialImagePath: SITE_SETTINGS_SOCIAL_IMAGE_PATH,
        }),
    },
    {
      name: 'Services and Contact',
      run: () =>
        migrateServicesContact({
          client: client as unknown as ServicesContactMigrationClient,
          publish,
          assetPaths: SERVICES_CONTACT_ASSET_PATHS,
        }),
    },
    {
      name: 'About and Client Logos',
      run: () =>
        migrateAbout({
          client: client as unknown as AboutMigrationClient,
          publish,
          assetPaths: ABOUT_ASSET_PATHS,
        }),
    },
    {
      name: 'Work',
      run: () =>
        migrateWork({
          client: client as unknown as WorkMigrationClient,
          publish,
        }),
    },
    {
      name: 'Journal',
      run: () =>
        migrateJournal({
          client: client as unknown as JournalMigrationClient,
          publish,
        }),
    },
    {
      name: 'Home',
      run: () =>
        migrateHome({
          client: client as unknown as HomeMigrationClient,
          publish,
          assetPaths: HOME_ASSET_PATHS,
        }),
    },
  ] satisfies MigrationStep[]
}

function loadLocalEnvironment() {
  try {
    process.loadEnvFile('.env')
  } catch {
    // CI and production commands provide environment variables directly.
  }
}

async function run() {
  loadLocalEnvironment()

  const projectId = process.env.PUBLIC_SANITY_PROJECT_ID
  const token =
    process.env.SANITY_API_WRITE_TOKEN ?? process.env.SANITY_AUTH_TOKEN
  const dataset = process.env.SANITY_MIGRATION_DATASET ?? 'development'
  const publish = process.argv.includes('--publish')

  if (!projectId || !token) {
    throw new Error(
      'PUBLIC_SANITY_PROJECT_ID and SANITY_API_WRITE_TOKEN are required.',
    )
  }
  if (
    dataset === 'production' &&
    process.env.ALLOW_PRODUCTION_MIGRATION !== 'true'
  ) {
    throw new Error(
      'Production migration is blocked. Set ALLOW_PRODUCTION_MIGRATION=true explicitly.',
    )
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion: SANITY_API_VERSION,
    token,
    useCdn: false,
  })

  await runMigrationPlan(buildMigrationPlan(client, publish))
  console.log(
    `${publish ? 'Published' : 'Migrated'} the complete Stillroom dataset in ${dataset}.`,
  )
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await run()
}
