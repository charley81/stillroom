import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { resolveSanityEnvironment } from './src/sanity/environment'
import { schemaTypes } from './src/sanity/schemaTypes'
import {
  filterSingletonActions,
  filterSingletonTemplates,
  structure,
} from './src/sanity/singletons'

const { projectId, dataset } = resolveSanityEnvironment(process.env)

export default defineConfig({
  name: 'stillroom',
  title: 'Stillroom',
  projectId,
  dataset,
  plugins: [structureTool({ structure })],
  schema: { types: schemaTypes },
  document: {
    actions: (previousActions, context) =>
      filterSingletonActions(previousActions, context),
    newDocumentOptions: (previousTemplates) =>
      filterSingletonTemplates(previousTemplates),
  },
})
