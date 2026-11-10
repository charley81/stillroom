import { defineField, defineType } from 'sanity'

export const clientLogo = defineType({
  name: 'clientLogo',
  title: 'Client Logo',
  type: 'document',
  fields: [
    defineField({
      name: 'clientName',
      title: 'Client name',
      description: 'Used as the accessible name wherever the logo appears.',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Approved logo lockup',
      description:
        'Upload one complete approved lockup. SVG assets are supported and are rendered without raster transformations.',
      type: 'image',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: 'clientName', media: 'logo' },
  },
})
