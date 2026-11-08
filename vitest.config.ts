import { getViteConfig } from 'astro/config'

export default getViteConfig({
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
} as Parameters<typeof getViteConfig>[0])
