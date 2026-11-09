// @ts-check
import netlify from '@astrojs/netlify'
import react from '@astrojs/react'
import sanity from '@sanity/astro'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, fontProviders } from 'astro/config'
import { loadEnv } from 'vite'
import { SANITY_API_VERSION } from './src/sanity/constants.ts'
import { resolveSanityEnvironment } from './src/sanity/environment.ts'

const mode =
  process.env.NODE_ENV === 'production' ? 'production' : 'development'
const env = loadEnv(mode, process.cwd(), '')
const { projectId, dataset } = resolveSanityEnvironment({
  ...env,
  CONTEXT: process.env.CONTEXT,
})

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: netlify(),
  session: false,
  integrations: [
    sanity({
      projectId,
      dataset,
      apiVersion: SANITY_API_VERSION,
      useCdn: true,
      studioBasePath: '/studio',
      stega: { studioUrl: '/studio' },
      injectTypes: true,
    }),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      // Visual Editing is client-only, so Vite's startup scan misses these
      // CommonJS and Studio dependencies and serves them as invalid ESM.
      include: [
        '@sanity/astro > @sanity/visual-editing > @sanity/mutate',
        '@sanity/astro > @sanity/visual-editing > @sanity/mutate/_unstable_machine',
        '@sanity/astro > @sanity/visual-editing > @sanity/mutate/_unstable_store',
        'react/compiler-runtime',
        'sanity',
        'sanity/presentation',
        'sanity/structure',
      ],
    },
  },
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Anton',
      cssVariable: '--font-anton',
      weights: [400],
      styles: ['normal'],
      subsets: ['latin'],
      formats: ['woff2'],
      fallbacks: ['sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'DM Sans',
      cssVariable: '--font-dm-sans',
      weights: [400, 500, 700, 900],
      styles: ['normal'],
      subsets: ['latin'],
      formats: ['woff2'],
      fallbacks: ['sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Bodoni Moda',
      cssVariable: '--font-bodoni-moda',
      weights: [400],
      styles: ['normal'],
      subsets: ['latin'],
      formats: ['woff2'],
      fallbacks: ['serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Cormorant Garamond',
      cssVariable: '--font-cormorant-garamond',
      weights: [600],
      styles: ['normal'],
      subsets: ['latin'],
      formats: ['woff2'],
      fallbacks: ['serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Libre Baskerville',
      cssVariable: '--font-libre-baskerville',
      weights: [400],
      styles: ['italic'],
      subsets: ['latin'],
      formats: ['woff2'],
      fallbacks: ['serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Space Grotesk',
      cssVariable: '--font-space-grotesk',
      weights: [700],
      styles: ['normal'],
      subsets: ['latin'],
      formats: ['woff2'],
      fallbacks: ['sans-serif'],
    },
  ],
})
