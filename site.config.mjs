// Where the site lives, in one place.
//
// GitHub Pages serves a project site under a sub-path (/developer-marketing);
// Vercel and a custom domain serve at the root. Three things need to agree about
// that — the Astro build, the link-integrity gate, and every URL the newsletter
// puts in an email — so the values are here rather than hard-coded in each.
//
// Moving the site is then two environment variables at build time:
//
//   SITE_ORIGIN=https://devmarketing.example  SITE_BASE=/  npm run build
//
// Defaults are the current GitHub Pages deployment, so an unconfigured build
// produces exactly what it produces today.
//
// One catch, and the link gate will tell you about it: some published content
// hard-codes the current base in its markdown links ("/developer-marketing/guide
// /…"), because that is what works on Pages and what check-refs has always
// required. Building with SITE_BASE=/ fails the gate on those links rather than
// shipping them broken. Migrating them is a separate, deliberate change — see
// "Serving at the root" in newsletter/LAUNCH.md.

export const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://albertogrande.github.io';

// Astro wants '/' for "served at the root", not an empty string.
export const SITE_BASE = process.env.SITE_BASE || '/developer-marketing';

/** The full public URL of the site's home page, no trailing slash. */
export const SITE_URL = (SITE_ORIGIN.replace(/\/+$/, '') + (SITE_BASE === '/' ? '' : SITE_BASE)).replace(
  /\/+$/,
  ''
);
