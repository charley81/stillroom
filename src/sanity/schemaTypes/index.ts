import { contactPage } from './documents/contact-page'
import { service } from './documents/service'
import { servicesPage } from './documents/services-page'
import { siteSettings } from './documents/site-settings'
import { workPage } from './documents/work-page'
import { workProject } from './documents/work-project'
import { editorialImage } from './objects/editorial-image'
import { narrativeSection } from './objects/narrative-section'
import { processStep } from './objects/process-step'
import { seoFields } from './objects/seo-fields'
import { socialLink } from './objects/social-link'
import { workProjectGalleryBrandPanel } from './objects/work-project-gallery-brand-panel'
import { workProjectGalleryImage } from './objects/work-project-gallery-image'

export const schemaTypes = [
  siteSettings,
  workPage,
  servicesPage,
  contactPage,
  workProject,
  service,
  editorialImage,
  narrativeSection,
  workProjectGalleryImage,
  workProjectGalleryBrandPanel,
  processStep,
  seoFields,
  socialLink,
]
