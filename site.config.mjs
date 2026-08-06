// Where the site lives, in one place.
//
// The site's home is https://thebeat.dev, served from Vercel at the root.
// Several things need to agree about that — the Astro build, the link gates,
// the IndexNow ping, and every URL the newsletter puts in an email — so the
// values are here rather than hard-coded in each.
//
// Moving the site is two environment variables at build time — or just edit
// the defaults:
//
//   SITE_ORIGIN=https://devmarketing.example  SITE_BASE=/  npm run build
//
// Two earlier homes are redirect layers now, so no cited URL ever dies: the
// GitHub Pages deployment (albertogrande.github.io/developer-marketing) serves
// stubs published by .github/workflows/deploy.yml from
// scripts/build-redirects.mjs, and developer-marketing.vercel.app is set in
// the Vercel dashboard to 308 here (by hand — see docs/custom-domain.md).
//
// Content markdown writes internal links base-less (/guide/…); the build adds
// SITE_BASE via scripts/remark-base-paths.mjs, so content never encodes where
// the site is deployed.

export const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://thebeat.dev';

// Astro wants '/' for "served at the root", not an empty string.
export const SITE_BASE = process.env.SITE_BASE || '/';

/** The full public URL of the site's home page, no trailing slash. */
export const SITE_URL = (SITE_ORIGIN.replace(/\/+$/, '') + (SITE_BASE === '/' ? '' : SITE_BASE)).replace(
  /\/+$/,
  ''
);
