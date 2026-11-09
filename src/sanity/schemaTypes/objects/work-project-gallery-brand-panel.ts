import { defineField, defineType } from 'sanity'

export const workProjectGalleryBrandPanel = defineType({
  name: 'workProjectGalleryBrandPanel',
  title: 'Brand panel and image',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Brand title',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'statement',
      title: 'Brand statement',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'label',
      title: 'Brand label',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'editorialImage',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'label', media: 'image.asset' },
  },
})
