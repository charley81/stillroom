import { defineArrayMember, defineField, defineType } from 'sanity'
import { exactCount, uniqueReferences } from '../validation'

const requiredText = (name: string, title: string, rows = 3) =>
  defineField({
    name,
    title,
    type: 'text',
    rows,
    validation: (rule) => rule.required(),
  })

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About',
  type: 'document',
  groups: [
    { name: 'introduction', title: 'Introduction', default: true },
    { name: 'founder', title: 'Founder story' },
    { name: 'team', title: 'Team' },
    { name: 'principles', title: 'Working principles' },
    { name: 'proof', title: 'Client proof' },
    { name: 'final', title: 'Final invitation' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    { ...requiredText('heading', 'Heading', 2), group: 'introduction' },
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'editorialImage',
      group: 'introduction',
      validation: (rule) => rule.required(),
    }),
    {
      ...requiredText('founderHeading', 'Founder heading', 2),
      group: 'founder',
    },
    defineField({
      name: 'founderStory',
      title: 'Founder story',
      type: 'constrainedRichText',
      group: 'founder',
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'founderName',
      title: 'Founder name',
      type: 'string',
      group: 'founder',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'founderRole',
      title: 'Founder role',
      type: 'string',
      group: 'founder',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'founderImage',
      title: 'Founder image',
      type: 'editorialImage',
      group: 'founder',
      validation: (rule) => rule.required(),
    }),
    {
      ...requiredText('teamHeading', 'Team heading', 2),
      group: 'team',
      validation: (rule) => [
        rule.required(),
        rule.max(100).warning('Long headings may not fit the team layout.'),
      ],
    },
    { ...requiredText('teamIntroduction', 'Team introduction'), group: 'team' },
    defineField({
      name: 'teamMembers',
      title: 'Team members',
      type: 'array',
      group: 'team',
      of: [{ type: 'teamProfile' }],
      validation: (rule) => [
        rule.required(),
        rule.custom((value) => exactCount(value, 3, 'Team members')),
      ],
    }),
    {
      ...requiredText('principlesHeading', 'Principles heading', 2),
      group: 'principles',
    },
    defineField({
      name: 'principles',
      title: 'Working principles',
      type: 'array',
      group: 'principles',
      of: [
        defineArrayMember({
          name: 'workingPrinciple',
          title: 'Working principle',
          type: 'object',
          fields: [
            defineField({
              name: 'title',
              title: 'Title',
              type: 'text',
              rows: 2,
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 3,
              validation: (rule) => rule.required(),
            }),
          ],
          preview: { select: { title: 'title', subtitle: 'description' } },
        }),
      ],
      validation: (rule) => [
        rule.required(),
        rule.custom((value) => exactCount(value, 3, 'Working principles')),
      ],
    }),
    {
      ...requiredText('clientProofHeading', 'Client proof heading', 2),
      group: 'proof',
    },
    { ...requiredText('clientProofCopy', 'Client proof copy'), group: 'proof' },
    defineField({
      name: 'clientLogos',
      title: 'Client Logos',
      type: 'array',
      group: 'proof',
      of: [{ type: 'reference', to: [{ type: 'clientLogo' }] }],
      validation: (rule) => [
        rule.required(),
        rule.custom((value) => exactCount(value, 5, 'Client Logos')),
        rule.custom((value) => uniqueReferences(value)),
      ],
    }),
    defineField({
      name: 'clientProofCtaLabel',
      title: 'Client proof link label',
      description: 'The destination is fixed to Work.',
      type: 'string',
      group: 'proof',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'finalCtaEyebrow',
      title: 'Final invitation eyebrow',
      type: 'string',
      group: 'final',
      validation: (rule) => rule.required(),
    }),
    {
      ...requiredText('finalCtaHeading', 'Final invitation heading', 2),
      group: 'final',
    },
    defineField({
      name: 'finalCtaLabel',
      title: 'Final invitation button label',
      description: 'The destination is fixed to Contact.',
      type: 'string',
      group: 'final',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'seo',
      title: 'SEO overrides',
      type: 'seoFields',
      group: 'seo',
    }),
  ],
  preview: {
    prepare() {
      return { title: 'About' }
    },
  },
})
