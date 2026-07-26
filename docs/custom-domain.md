# Moving to a custom domain (on Vercel)

The site lives on Vercel at https://developer-marketing.vercel.app/, serving
at the domain root. Moving to a custom domain keeps that shape — it's a DNS
step plus one config value.

## Steps

1. **Vercel dashboard**: Project → Settings → Domains → add the domain.
   Vercel tells you the DNS records to set (CNAME for a subdomain, A/AAAA for
   an apex) and provisions HTTPS automatically.
2. **Config**: update the default in `site.config.mjs`:

   ```js
   export const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://devmarketing.example';
   ```

   (or set the `SITE_ORIGIN` env var in Vercel instead — the default just
   makes local builds and the link gates agree without configuration).
   `SITE_BASE` stays `/`. Every canonical, sitemap entry, feed id, JSON-LD
   node, llms link, robots.txt Sitemap line, `.md` sibling and the IndexNow
   key location derive from these two values and rebuild correctly.
3. **Redirect layer**: nothing to do — `scripts/build-redirects.mjs` reads
   the same config, so the old GitHub Pages URLs start pointing at the new
   domain on the next deploy. Vercel also 308-redirects the `*.vercel.app`
   URLs to the custom domain once it's set as primary.
4. **Re-verify** the new host in Google Search Console and Bing Webmaster
   Tools and resubmit the sitemap — see `search-engines.md`.

## Why it matters for AEO

One clean host is the citable identity: answer engines consolidate signals on
the canonical origin. A custom domain also survives any future hosting move
without breaking a single cited URL — the strongest durability property a
citation can have.
