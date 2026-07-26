# Moving to a custom domain

A custom domain makes this site the domain root, which unlocks the two
root-convention surfaces a project site can't serve (see
`apex-shim/README.md` for the interim fix): a crawler-visible
`/robots.txt` (with sitemap autodiscovery) and the root `/llms.txt` probe
path. Everything else on this site is already base-agnostic — the switch is
deliberately one config change plus DNS.

## Steps

1. **DNS**: add a `CNAME` record for your domain (e.g. `devmarketing.example`)
   pointing to `albertogrande.github.io`, or A/AAAA records to GitHub Pages'
   IPs for an apex domain.
2. **Repo**: create `public/CNAME` containing exactly the domain:

   ```
   devmarketing.example
   ```

3. **Config** (`astro.config.mjs`): set

   ```js
   const SITE = 'https://devmarketing.example';
   const BASE = '';
   ```

   Those two constants are the only URL configuration in the repo — every
   canonical, sitemap entry, feed id, JSON-LD node, llms link, and .md
   sibling derives from them via `src/lib/site.ts` and rebuilds correctly.
4. **GitHub**: Settings → Pages → Custom domain → enter the domain, keep
   "Enforce HTTPS" on.
5. **Re-verify and re-point** (see `search-engines.md`):
   - Add the new domain as a property in Google Search Console and Bing
     Webmaster Tools; resubmit the sitemap.
   - The IndexNow key file moves to the domain root automatically (it lives
     in `public/`); the ping script derives host and keyLocation from
     `astro.config.mjs`, so no change there.
6. **Old URLs**: GitHub redirects `albertogrande.github.io/developer-marketing/*`
   to the custom domain automatically once the CNAME is set.

## What changes for AEO

- `robots.txt` (already written with explicit AI-crawler stanzas) becomes
  live at the root.
- `llms.txt` becomes discoverable at the conventional root path.
- The canonical identity consolidates on one clean host — the form answer
  engines cite.
