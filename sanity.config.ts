import { defineConfig } from 'sanity'
import { presentationTool } from 'sanity/presentation'
import { structureTool } from 'sanity/structure'
import { resolveRuntimeSanityEnvironment } from './src/sanity/environment'
import { PRESENTATION_OPTIONS } from './src/sanity/presentation'
import { schemaTypes } from './src/sanity/schemaTypes'
import {
  filterSingletonActions,
  filterSingletonTemplates,
  structure,
} from './src/sanity/singletons'

const { projectId, dataset } = resolveRuntimeSanityEnvironment(import.meta.env)

export default defineConfig({
  name: 'stillroom',
  title: 'Stillroom',
  projectId,
  dataset,
  plugins: [
    structureTool({ structure }),
    presentationTool(PRESENTATION_OPTIONS),
  ],
  schema: { types: schemaTypes },
  document: {
    actions: (previousActions, context) =>
      filterSingletonActions(previousActions, context),
    newDocumentOptions: (previousTemplates) =>
      filterSingletonTemplates(previousTemplates),
  },
})
