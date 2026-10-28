import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const workProjects = defineCollection({
	loader: glob({ base: './src/content/work-projects', pattern: '**/*.json' }),
	schema: z.object({
		title: z.string(),
		sector: z.string(),
		summary: z.string(),
		services: z.array(z.string()),
		cardImage: z.string(),
		order: z.number(),
		detailAvailable: z.boolean().default(false),
		tagline: z.string().optional(),
		introduction: z.string().optional(),
	}),
});

const journalArticles = defineCollection({
	loader: glob({ base: './src/content/journal-articles', pattern: '**/*.json' }),
	schema: z.object({
		title: z.string(),
		category: z.string(),
		readTime: z.string(),
		date: z.coerce.date(),
		excerpt: z.string(),
		image: z.string(),
		order: z.number(),
		featured: z.boolean().default(false),
		detailAvailable: z.boolean().default(false),
		author: z.string().default('Stillroom'),
	}),
});

export const collections = { workProjects, journalArticles };
