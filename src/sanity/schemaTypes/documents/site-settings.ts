import { defineField, defineType } from 'sanity'

const requiredString = (title: string, name: string) =>
  defineField({
    name,
    title,
    type: 'string',
    validation: (rule) => rule.required(),
  })

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  groups: [
    { name: 'identity', title: 'Identity', default: true },
    { name: 'navigation', title: 'Navigation' },
    { name: 'contact', title: 'Contact and social' },
    { name: 'newsletter', title: 'Newsletter' },
    { name: 'footer', title: 'Footer' },
    { name: 'seo', title: 'Default SEO' },
  ],
  fields: [
    { ...requiredString('Studio name', 'studioName'), group: 'identity' },
    {
      ...requiredString('Registered wordmark text', 'registeredMarkText'),
      group: 'identity',
    },
    { ...requiredString('Home label', 'homeLabel'), group: 'navigation' },
    { ...requiredString('Work label', 'workLabel'), group: 'navigation' },
    {
      ...requiredString('Services label', 'servicesLabel'),
      group: 'navigation',
    },
    { ...requiredString('About label', 'aboutLabel'), group: 'navigation' },
    {
      ...requiredString('Journal label', 'journalLabel'),
      group: 'navigation',
    },
    {
      ...requiredString('Contact label', 'contactLabel'),
      group: 'navigation',
    },
    {
      ...requiredString('Header call-to-action label', 'headerCtaLabel'),
      group: 'navigation',
    },
    defineField({
      name: 'emailAddress',
      title: 'Email address',
      type: 'email',
      group: 'contact',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social links',
      type: 'array',
      group: 'contact',
      of: [{ type: 'socialLink' }],
      validation: (rule) =>
        rule.unique().custom((links) => {
          if (!links) return true
          const platforms = links.flatMap((link) => {
            const platform = (link as { platform?: unknown })?.platform
            return typeof platform === 'string'
              ? [platform.trim().toLowerCase()]
              : []
          })
          return new Set(platforms).size === platforms.length
            ? true
            : 'Each social platform can appear only once.'
        }),
    }),
    {
      ...requiredString('Newsletter heading', 'newsletterHeading'),
      group: 'newsletter',
    },
    defineField({
      name: 'newsletterDescription',
      title: 'Newsletter description',
      type: 'text',
      rows: 3,
      group: 'newsletter',
      validation: (rule) => rule.required(),
    }),
    {
      ...requiredString('Footer tagline', 'footerTagline'),
      group: 'footer',
    },
    defineField({
      name: 'defaultSeoTitle',
      title: 'Default SEO title',
      type: 'string',
      group: 'seo',
      validation: (rule) => [
        rule.required(),
        rule
          .min(30)
          .max(65)
          .warning(
            'SEO titles usually work best between 30 and 65 characters.',
          ),
      ],
    }),
    defineField({
      name: 'defaultSeoDescription',
      title: 'Default SEO description',
      type: 'text',
      rows: 3,
      group: 'seo',
      validation: (rule) => [
        rule.required(),
        rule
          .min(80)
          .max(170)
          .warning(
            'SEO descriptions usually work best between 80 and 170 characters.',
          ),
      ],
    }),
    defineField({
      name: 'defaultSocialImage',
      title: 'Default social image',
      type: 'editorialImage',
      group: 'seo',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Site Settings' }
    },
  },
})
