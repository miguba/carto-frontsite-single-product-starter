import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const blocks = defineCollection({
  loader: glob({
    base: './src/content/blocks',
    pattern: '**/*.{md,mdx}',
  }),
});

export const collections = { blocks };
