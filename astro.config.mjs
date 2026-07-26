// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import { SITE_ORIGIN, SITE_BASE } from './site.config.mjs';
import remarkBasePaths from './scripts/remark-base-paths.mjs';

// A GitHub Pages project site: a living field guide to the state of the art in
// developer marketing. Content is frontmatter-driven (see src/content.config.ts)
// so the autonomous editorial agents (scout, weekly, deep-dive) can write
// entries reliably.
// `site` and `base` come from site.config.mjs, which defaults to the GitHub
// Pages deployment. Serving from a custom domain or Vercel is SITE_ORIGIN and
// SITE_BASE at build time — no source changes.
export default defineConfig({
  site: SITE_ORIGIN,
  base: SITE_BASE,
  trailingSlash: 'ignore',
  markdown: {
    // Markdown bodies write site links base-less, exactly like frontmatter
    // `related` hrefs; this adds the base at build time so the content does not
    // encode where the site is deployed.
    remarkPlugins: [[remarkBasePaths, { base: SITE_BASE }]],
  },
  integrations: [
    mdx(),
    sitemap({
      // Machine endpoints and the 404 aren't crawlable HTML pages.
      filter: (page) =>
        !/\.(json|txt|xml)$/.test(new URL(page).pathname) && !page.includes('/404'),
    }),
  ],
});
