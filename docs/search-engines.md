# Search-console setup (one-time, human-in-the-loop)

Being in the search indexes is what makes the site retrievable by answer
engines: ChatGPT Search retrieves overwhelmingly through **Bing's index**, and
Google's index feeds AI Overviews and Gemini grounding. The build already
pings IndexNow on every deploy (`scripts/indexnow-ping.mjs`); these two
console verifications are the only steps that need a human with account
access. Budget ~15 minutes.

## 1. Google Search Console

1. Open https://search.google.com/search-console → Add property →
   **URL prefix** → `https://albertogrande.github.io/developer-marketing/`.
2. Choose the **HTML tag** verification method and copy the token from
   `<meta name="google-site-verification" content="TOKEN">`.
3. Paste the token into `VERIFICATION.google` in `src/lib/site.ts`, commit,
   and wait for the deploy — the meta tag renders on every page.
4. Back in Search Console, click Verify.
5. Sitemaps → submit `sitemap-index.xml`.

## 2. Bing Webmaster Tools

1. Open https://www.bing.com/webmasters → Add site.
2. Easiest: **Import from Google Search Console** (reuses the verification
   you just did). Otherwise use the meta-tag method and paste the
   `msvalidate.01` token into `VERIFICATION.bing` in `src/lib/site.ts`,
   commit, deploy, verify.
3. Sitemaps → submit
   `https://albertogrande.github.io/developer-marketing/sitemap-index.xml`.
4. IndexNow: nothing to do — the key file ships in `public/` and the deploy
   workflow submits changed URLs after every publish. The URL Submission
   panel in Bing Webmaster Tools will show them arriving.

## Why this matters (the short version)

- **Bing → ChatGPT**: ChatGPT Search retrieval is Bing-index-backed; a page
  Bing hasn't indexed effectively doesn't exist for it.
- **IndexNow → freshness**: answer engines skew hard toward recently-crawled
  content; pinging on publish shortens the window between "the newsroom
  shipped it" and "an agent can cite it" from days to hours.
- **Google**: AI Overviews draw on the live Google index via normal
  Googlebot; Gemini grounding additionally respects `Google-Extended`
  (which robots.txt explicitly allows).

## After a custom-domain move

Re-do both verifications for the new host and resubmit the sitemap — see
`custom-domain.md`.
