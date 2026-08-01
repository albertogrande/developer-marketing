# Search-console setup (one-time, human-in-the-loop)

Being in the search indexes is what makes the site retrievable by answer
engines: ChatGPT Search retrieves overwhelmingly through **Bing's index**, and
Google's index feeds AI Overviews and Gemini grounding. The deploy pipeline
already pings IndexNow with changed URLs (`scripts/indexnow-ping.mjs`); these
two console verifications are the only steps that need a human with account
access. Budget ~15 minutes.

The property to verify is the live origin: **https://developer-marketing.vercel.app/**
(re-do this for the new host if a custom domain arrives — `custom-domain.md`).

## 1. Google Search Console

1. Open https://search.google.com/search-console → Add property →
   **URL prefix** → `https://developer-marketing.vercel.app/`.
2. Choose the **HTML tag** verification method and copy the token from
   `<meta name="google-site-verification" content="TOKEN">`.
3. Paste the token into `VERIFICATION.google` in `src/lib/site.ts`, commit,
   and wait for the Vercel deploy — the meta tag renders on every page.
4. Back in Search Console, click Verify.
5. Sitemaps → submit `sitemap-index.xml`.

## 2. Bing Webmaster Tools

1. Open https://www.bing.com/webmasters → Add site.
2. Easiest: **Import from Google Search Console** (reuses the verification
   you just did). Otherwise use the meta-tag method and paste the
   `msvalidate.01` token into `VERIFICATION.bing` in `src/lib/site.ts`,
   commit, deploy, verify.
3. Sitemaps → submit
   `https://developer-marketing.vercel.app/sitemap-index.xml`.
4. IndexNow: nothing to do — the key file ships at the domain root and the
   deploy workflow submits changed URLs after every publish. The URL
   Submission panel in Bing Webmaster Tools will show them arriving.

## The readership signal (why this is charter-compatible)

Charter rule 9 forbids analytics, pixels, and click tracking — the site
deliberately cannot tell whether anyone reads it. Search-console impression
and query data is the one readership signal that costs the reader nothing:
it is aggregated at the search engine's end, involves no script, cookie, or
beacon on any page, and identifies nobody. It answers "which pieces surface
for which queries, and do people click" — enough to steer coverage — without
observing a single reader on the site. The same goes for
`editorial/MENTIONS.md` (the weekly mention watch): it queries public APIs
about the site's *own output*, never its readers.

## Why this matters (the short version)

- **Bing → ChatGPT**: ChatGPT Search retrieval is Bing-index-backed; a page
  Bing hasn't indexed effectively doesn't exist for it.
- **IndexNow → freshness**: answer engines skew hard toward recently-crawled
  content; pinging on publish shortens the window between "the newsroom
  shipped it" and "an agent can cite it" from days to hours.
- **Google**: AI Overviews draw on the live Google index via normal
  Googlebot; Gemini grounding additionally respects `Google-Extended`
  (which robots.txt explicitly allows).
