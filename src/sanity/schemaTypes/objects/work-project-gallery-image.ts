import { defineField, defineType } from 'sanity'

export const workProjectGalleryImage = defineType({
  name: 'workProjectGalleryImage',
  title: 'Full-width image',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'editorialImage',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: 'image.alt', media: 'image.asset' },
    prepare({ title, media }) {
      return { title: title || 'Full-width image', media }
    },
  },
})
