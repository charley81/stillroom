import { defineField, defineType } from 'sanity'

export const seoFields = defineType({
  name: 'seoFields',
  title: 'SEO overrides',
  type: 'object',
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Meta title',
      type: 'string',
      validation: (rule) =>
        rule
          .min(30)
          .max(65)
          .warning(
            'SEO titles usually work best between 30 and 65 characters.',
          ),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      validation: (rule) =>
        rule
          .min(80)
          .max(170)
          .warning(
            'SEO descriptions usually work best between 80 and 170 characters.',
          ),
    }),
    defineField({
      name: 'socialImage',
      title: 'Social image',
      type: 'image',
      options: { hotspot: true },
    }),
  ],
})
