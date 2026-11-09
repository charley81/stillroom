import { defineField, defineType } from 'sanity'

export const contactPage = defineType({
  name: 'contactPage',
  title: 'Contact',
  type: 'document',
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'introduction',
      title: 'Introduction',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'supportingImage',
      title: 'Supporting image',
      type: 'editorialImage',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'supportingStatement',
      title: 'Supporting statement',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'seo',
      title: 'SEO overrides',
      type: 'seoFields',
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Contact' }
    },
  },
})
