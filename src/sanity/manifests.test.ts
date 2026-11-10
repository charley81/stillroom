import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.doUnmock('@sanity/client')
  vi.doUnmock('node:child_process')
  vi.doUnmock('node:fs')
  vi.doUnmock('../../scripts/sanity/migrate-about')
  vi.doUnmock('../../scripts/sanity/migrate-journal')
  vi.doUnmock('../../scripts/sanity/migrate-services-contact')
  vi.doUnmock('../../scripts/sanity/migrate-work')
  vi.restoreAllMocks()
  vi.resetModules()
})

describe('Stillroom content manifests', () => {
  it('imports without filesystem, client, environment, logging, or command side effects', async () => {
    const readFileSync = vi.fn(() => {
      throw new Error('manifest attempted a filesystem read')
    })
    const createClient = vi.fn(() => {
      throw new Error('manifest attempted to create a Sanity client')
    })
    const execFile = vi.fn(() => {
      throw new Error('manifest attempted to execute a command')
    })

    vi.doMock('node:fs', async (importOriginal) => ({
      ...(await importOriginal<typeof import('node:fs')>()),
      readFileSync,
    }))
    vi.doMock('@sanity/client', () => ({ createClient }))
    vi.doMock('node:child_process', async (importOriginal) => ({
      ...(await importOriginal<typeof import('node:child_process')>()),
      execFile,
    }))

    const loadEnvFile = vi.spyOn(process, 'loadEnvFile')
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await import('./manifests')

    expect(readFileSync).not.toHaveBeenCalled()
    expect(createClient).not.toHaveBeenCalled()
    expect(loadEnvFile).not.toHaveBeenCalled()
    expect(log).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
    expect(execFile).not.toHaveBeenCalled()
  })

  it('keeps manifest consumers independent from executable migration modules', async () => {
    const executableMigrationImported = () => {
      throw new Error('consumer imported an executable migration module')
    }

    vi.doMock('../../scripts/sanity/migrate-about', executableMigrationImported)
    vi.doMock(
      '../../scripts/sanity/migrate-journal',
      executableMigrationImported,
    )
    vi.doMock(
      '../../scripts/sanity/migrate-services-contact',
      executableMigrationImported,
    )
    vi.doMock('../../scripts/sanity/migrate-work', executableMigrationImported)

    await Promise.all([
      import('../../scripts/sanity/compare-datasets'),
      import('../../scripts/sanity/migrate-home'),
      import('../../scripts/sanity/production-launch'),
      import('../../scripts/sanity/validate-cutover'),
    ])
  })

  it('defines the complete stable identity and route inventory', async () => {
    const {
      CONTENT_DOCUMENTS,
      JOURNAL_ARTICLE_SLUGS,
      PUBLIC_ROUTES,
      SINGLETON_DEFINITIONS,
      WORK_PROJECT_SLUGS,
    } = await import('./manifests')

    expect(SINGLETON_DEFINITIONS).toEqual([
      { id: 'siteSettings', type: 'siteSettings', title: 'Site Settings' },
      { id: 'homePage', type: 'homePage', title: 'Home' },
      { id: 'workPage', type: 'workPage', title: 'Work' },
      { id: 'servicesPage', type: 'servicesPage', title: 'Services' },
      { id: 'aboutPage', type: 'aboutPage', title: 'About' },
      { id: 'journalPage', type: 'journalPage', title: 'Journal' },
      { id: 'contactPage', type: 'contactPage', title: 'Contact' },
    ])
    expect(WORK_PROJECT_SLUGS).toEqual([
      'the-good-table',
      'orlo-house',
      'juniper',
      'fieldwork',
      'the-long-table',
      'morrow',
    ])
    expect(JOURNAL_ARTICLE_SLUGS).toEqual([
      'what-makes-a-place-stay-with-us',
      'the-quiet-power-of-a-good-menu',
      'the-everyday-ritual-reconsidered',
      'a-welcome-begins-before-the-door',
      'good-brands-have-good-ingredients',
      'a-little-more-personality-please',
      'made-for-good-company',
    ])
    expect(CONTENT_DOCUMENTS).toEqual([
      { id: 'siteSettings', type: 'siteSettings' },
      { id: 'homePage', type: 'homePage' },
      { id: 'workPage', type: 'workPage' },
      { id: 'servicesPage', type: 'servicesPage' },
      { id: 'aboutPage', type: 'aboutPage' },
      { id: 'journalPage', type: 'journalPage' },
      { id: 'contactPage', type: 'contactPage' },
      { id: 'service-brand-strategy', type: 'service' },
      { id: 'service-visual-identity', type: 'service' },
      { id: 'service-digital-design-development', type: 'service' },
      { id: 'service-campaign-content-direction', type: 'service' },
      { id: 'client-logo-orlo-house', type: 'clientLogo' },
      { id: 'client-logo-juniper', type: 'clientLogo' },
      { id: 'client-logo-fieldwork', type: 'clientLogo' },
      { id: 'client-logo-the-long-table', type: 'clientLogo' },
      { id: 'client-logo-morrow', type: 'clientLogo' },
      { id: 'work-project-the-good-table', type: 'workProject' },
      { id: 'work-project-orlo-house', type: 'workProject' },
      { id: 'work-project-juniper', type: 'workProject' },
      { id: 'work-project-fieldwork', type: 'workProject' },
      { id: 'work-project-the-long-table', type: 'workProject' },
      { id: 'work-project-morrow', type: 'workProject' },
      { id: 'author-stillroom', type: 'author' },
      { id: 'journal-category-culture', type: 'journalCategory' },
      { id: 'journal-category-design', type: 'journalCategory' },
      { id: 'journal-category-perspective', type: 'journalCategory' },
      { id: 'journal-category-process', type: 'journalCategory' },
      { id: 'journal-category-studio-notes', type: 'journalCategory' },
      {
        id: 'journal-article-what-makes-a-place-stay-with-us',
        type: 'journalArticle',
      },
      {
        id: 'journal-article-the-quiet-power-of-a-good-menu',
        type: 'journalArticle',
      },
      {
        id: 'journal-article-the-everyday-ritual-reconsidered',
        type: 'journalArticle',
      },
      {
        id: 'journal-article-a-welcome-begins-before-the-door',
        type: 'journalArticle',
      },
      {
        id: 'journal-article-good-brands-have-good-ingredients',
        type: 'journalArticle',
      },
      {
        id: 'journal-article-a-little-more-personality-please',
        type: 'journalArticle',
      },
      { id: 'journal-article-made-for-good-company', type: 'journalArticle' },
    ])
    expect(PUBLIC_ROUTES).toEqual([
      '/',
      '/services',
      '/work',
      '/work/the-good-table',
      '/work/orlo-house',
      '/work/juniper',
      '/work/fieldwork',
      '/work/the-long-table',
      '/work/morrow',
      '/about',
      '/journal',
      '/journal/what-makes-a-place-stay-with-us',
      '/journal/the-quiet-power-of-a-good-menu',
      '/journal/the-everyday-ritual-reconsidered',
      '/journal/a-welcome-begins-before-the-door',
      '/journal/good-brands-have-good-ingredients',
      '/journal/a-little-more-personality-please',
      '/journal/made-for-good-company',
      '/contact',
    ])
  })

  it('preserves dependency-ordered publication groups', async () => {
    const { PUBLICATION_GROUPS } = await import('./manifests')

    expect(PUBLICATION_GROUPS).toEqual([
      {
        name: 'reusable referenced documents',
        ids: [
          'service-brand-strategy',
          'service-visual-identity',
          'service-digital-design-development',
          'service-campaign-content-direction',
          'author-stillroom',
          'journal-category-culture',
          'journal-category-design',
          'journal-category-perspective',
          'journal-category-process',
          'journal-category-studio-notes',
          'client-logo-orlo-house',
          'client-logo-juniper',
          'client-logo-fieldwork',
          'client-logo-the-long-table',
          'client-logo-morrow',
        ],
      },
      {
        name: 'Work Projects and Journal Articles',
        ids: [
          'work-project-the-good-table',
          'work-project-orlo-house',
          'work-project-juniper',
          'work-project-fieldwork',
          'work-project-the-long-table',
          'work-project-morrow',
          'journal-article-what-makes-a-place-stay-with-us',
          'journal-article-the-quiet-power-of-a-good-menu',
          'journal-article-the-everyday-ritual-reconsidered',
          'journal-article-a-welcome-begins-before-the-door',
          'journal-article-good-brands-have-good-ingredients',
          'journal-article-a-little-more-personality-please',
          'journal-article-made-for-good-company',
        ],
      },
      {
        name: 'page singletons and Site Settings',
        ids: [
          'homePage',
          'workPage',
          'servicesPage',
          'aboutPage',
          'journalPage',
          'contactPage',
          'siteSettings',
        ],
      },
    ])
  })
})
