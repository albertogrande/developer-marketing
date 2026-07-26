# Apex shim — superseded

This kit existed because a GitHub Pages *project* site can't serve the
root-convention files crawlers actually fetch (`/robots.txt`, `/llms.txt` at
the domain root).

**It's no longer needed.** The site now lives at
https://developer-marketing.vercel.app/ and serves at the domain root, so
`robots.txt` (generated, with the correct Sitemap line) and `llms.txt` are
natively at their conventional paths. The old GitHub Pages deployment is a
redirect layer (`scripts/build-redirects.mjs`, published by
`.github/workflows/deploy.yml`) that keeps every previously served URL
resolving to its new home.

If the site ever returns to sub-path hosting, recover the two stub files from
git history (`docs/apex-shim/` before this commit).
