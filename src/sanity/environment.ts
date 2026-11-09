export interface SanityEnvironmentConfig {
  projectId: string
  dataset: string
}

interface SanityEnvironmentValues {
  PUBLIC_SANITY_PROJECT_ID?: string
  PUBLIC_SANITY_DATASET?: string
  CONTEXT?: string
}

export function resolveSanityEnvironment(
  environment: SanityEnvironmentValues,
): SanityEnvironmentConfig {
  const projectId = environment.PUBLIC_SANITY_PROJECT_ID
  const dataset = environment.CONTEXT
    ? environment.CONTEXT === 'production'
      ? 'production'
      : 'development'
    : environment.PUBLIC_SANITY_DATASET

  if (!projectId || !dataset) {
    throw new Error(
      'PUBLIC_SANITY_PROJECT_ID and PUBLIC_SANITY_DATASET are required.',
    )
  }

  return { projectId, dataset }
}
