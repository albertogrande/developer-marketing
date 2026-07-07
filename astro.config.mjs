// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

// A GitHub Pages project site: a living field guide to the state of the art in
// developer marketing. Content is frontmatter-driven (see src/content.config.ts)
// so the autonomous radar agent can append dated entries reliably.
export default defineConfig({
  site: 'https://albertogrande.github.io',
  base: '/developer-marketing',
  trailingSlash: 'ignore',
  integrations: [mdx(), sitemap()],
});
