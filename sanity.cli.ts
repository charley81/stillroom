import { defineCliConfig } from 'sanity/cli'
import { resolveSanityEnvironment } from './src/sanity/environment'

const { projectId, dataset } = resolveSanityEnvironment(process.env)

export default defineCliConfig({
  api: { projectId, dataset },
  schemaExtraction: {
    enabled: true,
    path: './schema.json',
  },
  typegen: {
    enabled: true,
    path: './src/**/*.{ts,tsx,js,jsx}',
    generates: './sanity.types.ts',
  },
})
