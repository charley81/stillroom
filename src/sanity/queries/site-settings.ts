import { defineQuery } from 'groq'

export const SITE_SETTINGS_QUERY = defineQuery(`
  *[_type == "siteSettings" && _id == "siteSettings"][0]{
    _id,
    studioName,
    registeredMarkText,
    homeLabel,
    workLabel,
    servicesLabel,
    aboutLabel,
    journalLabel,
    contactLabel,
    headerCtaLabel,
    emailAddress,
    socialLinks[]{
      _key,
      platform,
      url
    },
    newsletterHeading,
    newsletterDescription,
    footerTagline,
    defaultSeoTitle,
    defaultSeoDescription,
    defaultSocialImage{
      decorative,
      alt,
      "url": asset.asset->url
    }
  }
`)
