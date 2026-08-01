// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import { SITE_ORIGIN, SITE_BASE } from './site.config.mjs';
import remarkBasePaths from './scripts/remark-base-paths.mjs';
import { routeLastmod } from './scripts/lib/routes.mjs';

// '/' means served at the root — as a URL prefix that's no prefix at all.
const BASE_PREFIX = SITE_BASE === '/' ? '' : SITE_BASE.replace(/\/+$/, '');

// Honest per-page lastmod from content frontmatter (never the build clock) —
// answer engines weigh freshness, so the sitemap must tell the truth about
// what changed when. Computed once at config load.
const LASTMOD = routeLastmod();

// A living field guide to the state of the art in developer marketing, served
// from Vercel (GitHub Pages carries only the redirect layer for the old
// project-site URLs). Content is frontmatter-driven (see src/content.config.ts)
// so the autonomous editorial agents (scout, newsroom, weekly, deep-dive) can
// write entries reliably.
// `site` and `base` come from site.config.mjs. Serving from anywhere else is
// SITE_ORIGIN and SITE_BASE at build time — no source changes.
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
      // Machine endpoints (.json/.txt/.xml and the raw .md siblings) and the
      // 404 aren't canonical HTML pages.
      filter: (page) =>
        !/\.(json|txt|xml|md)$/.test(new URL(page).pathname) && !page.includes('/404'),
      serialize(item) {
        // One URL form everywhere: the trailing-slash URL the host serves
        // (matches canonicals and internal links — see src/lib/site.ts).
        const url = item.url.endsWith('/') ? item.url : `${item.url}/`;
        const route =
          url.slice(SITE_ORIGIN.replace(/\/+$/, '').length + BASE_PREFIX.length).replace(/\/$/, '') || '/';
        const lastmod = LASTMOD.get(route);
        return { ...item, url, ...(lastmod ? { lastmod } : {}) };
      },
    }),
  ],
});
