# Apex shim — root-convention files for a project site

**The problem.** This site is a GitHub Pages *project* site: it lives under
`https://albertogrande.github.io/developer-marketing/`. Crawlers and agents
fetch root-convention files from the *domain root* only —
`https://albertogrande.github.io/robots.txt` and `/llms.txt` — and that root
belongs to a different repository: `albertogrande/albertogrande.github.io`
(the *user site*), which doesn't exist yet.

Nothing is blocked today (a missing root robots.txt means allow-all), but two
things are lost while the root is empty:

1. **Sitemap autodiscovery** — crawlers that find sitemaps via robots.txt
   never see ours.
2. **The root `/llms.txt` convention** — agents that probe the domain root
   find nothing.

**The fix (10 minutes).** Create the user-site repo and ship the two files in
this directory:

1. Create a new public repository named exactly `albertogrande.github.io`.
2. Copy `robots.txt` and `llms.txt` from this directory into its root.
3. Commit. GitHub Pages activates automatically for user-site repos (Settings
   → Pages if it doesn't).
4. Verify: `curl https://albertogrande.github.io/robots.txt` shows the
   sitemap line; `curl https://albertogrande.github.io/llms.txt` shows the
   pointer.

Notes:

- The root robots.txt governs the **whole host**, including every other
  project site under the account. The one here allows everything and adds
  this site's sitemap — extend it if other projects need their own rules.
- The root llms.txt is a *pointer*, not a copy: the real, always-current
  index is generated at build time at
  `/developer-marketing/llms.txt`. Don't duplicate content into the shim —
  it would go stale.
- If the account ever adds more Pages projects with agent surfaces, add one
  `Sitemap:` line and one llms.txt link each.

**The alternative fix** is a custom domain, which makes this site the domain
root and the shim unnecessary — see `../custom-domain.md`.
