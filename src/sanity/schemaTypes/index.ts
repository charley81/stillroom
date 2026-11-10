import { aboutPage } from './documents/about-page'
import { author } from './documents/author'
import { clientLogo } from './documents/client-logo'
import { contactPage } from './documents/contact-page'
import { homePage } from './documents/home-page'
import { journalArticle } from './documents/journal-article'
import { journalCategory } from './documents/journal-category'
import { journalPage } from './documents/journal-page'
import { service } from './documents/service'
import { servicesPage } from './documents/services-page'
import { siteSettings } from './documents/site-settings'
import { workPage } from './documents/work-page'
import { workProject } from './documents/work-project'
import { constrainedRichText } from './objects/constrained-rich-text'
import { editorialImage } from './objects/editorial-image'
import { journalArticlePullQuote } from './objects/journal-article-pull-quote'
import { journalArticleSection } from './objects/journal-article-section'
import { narrativeSection } from './objects/narrative-section'
import { processStep } from './objects/process-step'
import { seoFields } from './objects/seo-fields'
import { socialLink } from './objects/social-link'
import { teamProfile } from './objects/team-profile'
import { workProjectGalleryBrandPanel } from './objects/work-project-gallery-brand-panel'
import { workProjectGalleryImage } from './objects/work-project-gallery-image'

export const schemaTypes = [
  siteSettings,
  homePage,
  aboutPage,
  workPage,
  servicesPage,
  journalPage,
  contactPage,
  workProject,
  journalArticle,
  service,
  clientLogo,
  author,
  journalCategory,
  constrainedRichText,
  editorialImage,
  journalArticleSection,
  journalArticlePullQuote,
  narrativeSection,
  workProjectGalleryImage,
  workProjectGalleryBrandPanel,
  processStep,
  seoFields,
  socialLink,
  teamProfile,
]
