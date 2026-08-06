---
title: Treat the MCP spec migration as a customer-facing deprecation
when: Your product ships an MCP server, or "MCP support" appears anywhere in your positioning.
do: Stop claiming MCP support as a differentiator — it's table stakes since the 2026-07-28 spec — and start the migration off the deprecated pieces (HTTP+SSE transport, Dynamic Client Registration, Roots/Sampling/Logging) now, run as a public deprecation with a dated changelog entry and a migration guide, not a silent backend change.
why: The 2026-07-28 revision made MCP settled infrastructure — a stateless core that runs on any HTTP stack, all four Tier-1 SDKs shipping day one, and AWS, Cloudflare, Google Cloud, Microsoft, Figma and Netlify publicly behind it — so the differentiator moved up a layer, to what your server exposes and how safely an agent can act through it. The deprecated pieces keep working for a twelve-month minimum; teams that treat that window as a comms event look like infrastructure, and teams that let it lapse generate the broken-integration stories developers screenshot.
section: 02-docs-as-front-door
tags: [docs, dx, positioning]
since: "MCP spec revision 2026-07-28 — stateless core, CIMD auth, twelve-month minimum deprecation window on HTTP+SSE, DCR, and Roots/Sampling/Logging"
verify: Check the MCP spec blog for the current deprecation status and removal dates; check whether major MCP hosts have published dated migration guides (if most have, the window for looking early has closed).
status: current
checked: 2026-08-03
updated: 2026-08-03
sources:
  - label: The 2026-07-28 Specification (Model Context Protocol)
    url: https://blog.modelcontextprotocol.io/posts/2026-07-28/
  - label: "MCP 2026-07-28: what's changing and how to migrate (Agentic AI Foundation)"
    url: https://aaif.io/blog/mcp-2026-07-28-whats-changing-and-how-to-migrate
---

The claim to check before you print "MCP-native" anywhere: four maintained SDKs and six hyperscalers make protocol support the floor, not the ceiling. The download figures the project cites (~half a billion a month) are supply-side SDK pulls, not deployed servers — so the honest positioning claim is about *your* server's quality and safety, not the protocol's popularity.
