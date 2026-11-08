import { defineField, defineType } from 'sanity'

interface EditorialImageParent {
  decorative?: boolean
}

export const editorialImage = defineType({
  name: 'editorialImage',
  title: 'Editorial image',
  type: 'object',
  fields: [
    defineField({
      name: 'asset',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'decorative',
      title: 'Decorative image',
      type: 'boolean',
      initialValue: false,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'alt',
      title: 'Alternative text',
      type: 'string',
      validation: (rule) =>
        rule.custom((value, context) => {
          const { decorative } = context.parent as EditorialImageParent
          if (decorative && value) {
            return 'Decorative images must have empty alternative text.'
          }
          if (!decorative && !value?.trim()) {
            return 'Alternative text is required unless the image is decorative.'
          }
          return true
        }),
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'text',
      rows: 2,
      validation: (rule) =>
        rule
          .max(180)
          .warning('Long captions may not fit the approved layouts.'),
    }),
    defineField({
      name: 'mobileOverride',
      title: 'Mobile override',
      description:
        'Use only when mobile needs a genuinely different composition.',
      type: 'image',
      options: { hotspot: true },
    }),
  ],
  preview: {
    select: {
      title: 'alt',
      media: 'asset',
    },
    prepare({ title, media }) {
      return { title: title || 'Decorative image', media }
    },
  },
})
