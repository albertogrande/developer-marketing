// Where the site lives, in one place.
//
// The site's home is Vercel (https://developer-marketing.vercel.app), serving
// at the root. Several things need to agree about that — the Astro build, the
// link gates, the IndexNow ping, and every URL the newsletter puts in an
// email — so the values are here rather than hard-coded in each.
//
// Moving the site (e.g. to a custom domain) is two environment variables at
// build time — or just edit the defaults:
//
//   SITE_ORIGIN=https://devmarketing.example  SITE_BASE=/  npm run build
//
// The old GitHub Pages deployment (albertogrande.github.io/developer-marketing)
// is a redirect layer now — .github/workflows/deploy.yml publishes stubs that
// send readers and crawlers here, built by scripts/build-redirects.mjs.
//
// Content markdown writes internal links base-less (/guide/…); the build adds
// SITE_BASE via scripts/remark-base-paths.mjs, so content never encodes where
// the site is deployed.

export const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://developer-marketing.vercel.app';

// Astro wants '/' for "served at the root", not an empty string.
export const SITE_BASE = process.env.SITE_BASE || '/';

/** The full public URL of the site's home page, no trailing slash. */
export const SITE_URL = (SITE_ORIGIN.replace(/\/+$/, '') + (SITE_BASE === '/' ? '' : SITE_BASE)).replace(
  /\/+$/,
  ''
);
