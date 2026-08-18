---
show: Scaling DevTools
episode: When sales and product-led growth meet, with Railway's Angelo Saraceno
date: 2025-11-07
url: https://podcast.scalingdevtools.com/episodes/turning-developer-tools-into-a-sustainable-business-a-conversation-with-angelo
guests:
  - Angelo Saraceno (Railway) — revenue/support, joined as a support engineer
host: Jack Bridger
topics: [plg, metrics, pricing, devrel]
candidates: [practice]
distilled: 2026-08-17
---

## What it covers

Angelo Saraceno describes how Railway layered a sales motion onto a
product-led-growth company without gating the product: leave every feature
open, instrument usage so a feature trigger (e.g. requesting a static IP —
often a SOC 2 compliance signal) fires a webhook into the CRM, then reach out
with context instead of cold. He contrasts this with the "fork the product
for enterprise" trap and argues PLG and sales-assist are complementary, not
opposed, when the sales team treats itself as subservient to the product
motion rather than gating it.

## Claims worth checking

- [50:30] Cold outreach ("spraying and praying") got a *response* rate of
  "point zero one seven", against what he states is a "point three" industry
  standard — read as 0.017% vs 0.3%. Response rate, not conversion.
  Self-reported; he attributes the figure to a Railway blog post he wrote and
  says is in the show notes, and cites no source for the industry standard.
- [50:30] Feature-triggered, targeted outreach (e.g. a Slack invite once he
  detects a Fortune 500 company on the platform [47:50], or a webhook when
  someone presses the static-IP button [49:31]) gets response rates "usually
  at, like, three to 4%". Estimated from memory on the episode — he says
  explicitly he doesn't have the dashboard in front of him — so it is not the
  blog-post figure and is not audited here.
- [33:44–35:33] His framing: bottom-up/PLG works for "value generation"
  tools reached for during active building (his example: Cursor vs. Copilot's
  extra step through VS Code); top-down suits "defensive"/cost-cutting
  purchases aimed at budget holders (CFOs), not the engineer who'll use it.
  Stated as his own model, not measured.
- [04:37–06:30] Claim that infrastructure-as-code requests from ops teams
  often mask a different underlying ask from product engineers (deployment
  access, not YAML fluency) — a sales-discovery anecdote from Railway's own
  customer conversations, not a general finding.
- [13:54] His view that open source sets "the effective labor
  value to zero", offered in a passage about license rug-pulls (Redis is the
  example he names) — an opinion he flags as likely to get him "flamed on
  Twitter", not data.

## Quotes

> "Anyone who says PLG is dead has never done real PLG." — Angelo Saraceno
> [40:51]

> "What people genuinely hate is a sales experience that is so inane that you
> are just so frustrated at the end of it that you don't even want to give
> them money." — Angelo Saraceno [42:20]

## Why it matters here

A concrete, numbered version of "instrument the product, don't gate it" for
`06-channels-and-distribution` and the PLG-to-sales handoff the guide
currently treats thinly: a feature-usage webhook as the qualification signal
instead of a form-gated demo request. The numbers (0.017% cold vs. 3–4%
triggered) are *response* rates, not conversion rates, and they are Railway's
own: the cold figure he attributes to a blog post he wrote, the triggered one
he estimates from memory on air. Pull the actual post before citing either as
a sourced claim, and never as conversion — nothing here is independently
verified.
