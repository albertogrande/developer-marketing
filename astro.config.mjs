// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import { routeLastmod } from './scripts/lib/routes.mjs';

const SITE = 'https://albertogrande.github.io';
const BASE = '/developer-marketing';

// Honest per-page lastmod from content frontmatter (never the build clock) —
// answer engines weigh freshness, so the sitemap must tell the truth about
// what changed when. Computed once at config load.
const LASTMOD = routeLastmod();

// A GitHub Pages project site: a living field guide to the state of the art in
// developer marketing. Content is frontmatter-driven (see src/content.config.ts)
// so the autonomous editorial agents (scout, weekly, deep-dive) can write
// entries reliably.
export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'ignore',
  integrations: [
    mdx(),
    sitemap({
      // Machine endpoints (.json/.txt/.xml and the raw .md siblings) and the
      // 404 aren't canonical HTML pages.
      filter: (page) =>
        !/\.(json|txt|xml|md)$/.test(new URL(page).pathname) && !page.includes('/404'),
      serialize(item) {
        // One URL form everywhere: the trailing-slash URL GH Pages serves
        // (matches canonicals and internal links — see src/lib/site.ts).
        const url = item.url.endsWith('/') ? item.url : `${item.url}/`;
        const route = url.slice(SITE.length + BASE.length).replace(/\/$/, '') || '/';
        const lastmod = LASTMOD.get(route);
        return { ...item, url, ...(lastmod ? { lastmod } : {}) };
      },
    }),
  ],
});
