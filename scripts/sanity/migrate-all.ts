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
import { runMigrationCommand, type MigrationClient } from './migration-runtime'

export interface MigrationStep {
  name: string
  run: () => Promise<unknown>
}

export async function runMigrationPlan(steps: MigrationStep[]) {
  for (const step of steps) {
    await step.run()
    console.log(`Completed ${step.name} migration.`)
  }
}

export function buildMigrationPlan(client: MigrationClient, publish: boolean) {
  return [
    {
      name: 'Site Settings',
      run: () =>
        migrateSiteSettings({
          client,
          publish,
          socialImagePath: SITE_SETTINGS_SOCIAL_IMAGE_PATH,
        }),
    },
    {
      name: 'Services and Contact',
      run: () =>
        migrateServicesContact({
          client,
          publish,
          assetPaths: SERVICES_CONTACT_ASSET_PATHS,
        }),
    },
    {
      name: 'About and Client Logos',
      run: () =>
        migrateAbout({
          client,
          publish,
          assetPaths: ABOUT_ASSET_PATHS,
        }),
    },
    {
      name: 'Work',
      run: () =>
        migrateWork({
          client,
          publish,
        }),
    },
    {
      name: 'Journal',
      run: () =>
        migrateJournal({
          client,
          publish,
        }),
    },
    {
      name: 'Home',
      run: () =>
        migrateHome({
          client,
          publish,
          assetPaths: HOME_ASSET_PATHS,
        }),
    },
  ] satisfies MigrationStep[]
}

await runMigrationCommand({
  moduleUrl: import.meta.url,
  migrate: ({ client, publish }) =>
    runMigrationPlan(buildMigrationPlan(client, publish)),
  successMessage: ({ dataset, publish }) =>
    `${publish ? 'Published' : 'Migrated'} the complete Stillroom dataset in ${dataset}.`,
})
