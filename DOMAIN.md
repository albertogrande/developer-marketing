# Domain

Decision record for the publication's own address — **which** name to buy and
why. Once one is bought, `docs/custom-domain.md` covers **how** to point the
site at it (a DNS step plus `SITE_ORIGIN` in `site.config.mjs`).

Nothing here is bought yet.

Availability was checked with `scripts/check-domains.mjs`, which reads RDAP —
the registry-authoritative successor to whois. RDAP reports whether a name is
**registered**, never whether it is **affordable**: registries reserve and
premium-price names separately, and short `.dev` names are exactly what Google
Registry tiers highest. Every price question below is unverified.

```
node scripts/check-domains.mjs --file scripts/domain-candidates.txt --tlds dev,com --available
```

## The shortlist

| Domain | State | Note |
| --- | --- | --- |
| `devmarketing.io` | free | the recommendation: exact category term, `.io` reads native to devtools |
| `devmarketing.co` | free | defensive redirect |
| `developermarketing.co` | free | redundant next to `devmarketing`, and longer |
| `mkt2.dev` | free | short and brandable, but opaque on first read |

`.co` availability was confirmed at the registrar, not by this tool — `.co`
publishes no RDAP, so the script can only reach a DNS-based guess there.

## What the search established

**Every exact-match `.com` is taken.** `devmarketing.com` (Dynadot, parked),
`developermarketing.com` (GoDaddy parking, expires 2026-09-28),
`dev-marketing.com` (Netregistry), `developer-marketing.com` (Moniker, expires
2026-09-11), `devmkt.com` (a live site). The two September expiries are
domainer-held and will almost certainly be renewed; treat a drop as a lottery,
not a plan.

**Moving off the descriptive concept does not buy a `.com`.** Two sweeps over 88
brandable candidates — GitHub vocabulary, journalism vocabulary, printing
vocabulary down to `colophon`, `quire`, `recto`, `verso`, plus coinages like
`devly` and `shiply` — returned **zero** free `.com`. The real trade is not
descriptive-versus-brandable; it is a descriptive name on `.io` against an
opaque name on the same `.io`. A one-word `.com` is an aftermarket purchase at
four to six figures.

The only two names free across `.com`/`.io`/`.dev` were `readmeweekly` (boxes the
site into a weekly cadence it does not have, and collides with readme.com, an
established devtools company) and `devfrontdoor` (clunky, and the metaphor only
lands for someone who has already read the guide).

**Hyphens were rejected.** The unhyphenated twin of every hyphenated candidate is
domainer-parked, so word-of-mouth traffic leaks straight to a parking page. The
site is also the front door for consulting, which means saying the domain aloud
on calls and podcasts constantly.

**Near misses worth recording.** `devmarket.ing` is free and spells the whole
word using the `.ing` TLD as its final syllable — the most elegant option found,
and the most likely to carry a premium price. `developermkt.com` is free, the
only available descriptive `.com`, but mixes registers ("developer" spelled out,
"mkt" abbreviated). `devgtm.com` and `gtmdev.com` are listed for sale on
Afternic by a single holder.

## Reasoning

The audience is a practitioner who markets *to* developers, not a developer —
so `.dev` addresses the subject rather than the reader. Four of the site's
surfaces (guide, job board, salary data, articles) are discovery plays that live
on search, and the trade press this publication covers is overwhelmingly
category-named: The New Stack, InfoQ, SD Times, DevOps.com.

`.co` was ranked below `.io` for one reason: it is heard as `.com`, and both
`.com` twins are parked, so the leaked traffic has somewhere hostile to land.

Against `.io`: the UK's agreement to cede the Chagos Archipelago puts the "IO"
country code in question. Any ccTLD retirement runs for years and there is
precedent for continuity (`.su` outlived the USSR by decades), but verify the
current status before committing — this note is not maintained.

The cost of a descriptive name is that it is rented, not owned: `devmarketing`
cannot be trademarked, and whoever holds `devmarketing.com` could build a
competitor with a better address. That is the accepted trade for discovery now.
The moment to revisit is after the publication has an audience that searches for
it by name — at which point a 301 migration is cheap. The reverse is not.
