---
title: Getting into the MCP directory is app-store review now, not a web form
date: 2026-08-04
summary: Anthropic's Connectors Directory is a gated, vetted distribution channel with no published review clock — a reminder that shipping an MCP server isn't the same as getting it in front of users.
dek: One developer's four-month wait is a single account, but the queue mechanics behind it are documented in Anthropic's own docs and two independent guides — and they change how you should plan an MCP launch.
desk: news
byline: Rio Vidal
tags: [mcp, docs, distribution, channels]
related:
  - label: Guide — Channels & distribution
    href: /guide/06-channels-and-distribution
  - label: Article — MCP just became infrastructure
    href: /articles/2026-07-29-mcp-goes-stateless
sources:
  - label: Josh Symonds — Anthropic Hates Developers (2026-07-31)
    url: https://joshsymonds.com/blog/anthropic-hates-developers/
  - label: Anthropic — Submitting to the Connectors Directory (docs)
    url: https://claude.com/docs/connectors/building/submission
  - label: Anthropic Software Directory Policy (support.claude.com)
    url: https://support.claude.com/en/articles/13145358-anthropic-software-directory-policy
  - label: Tallyfy — How to list your MCP server in Claude's Connectors Directory (2026-06-09)
    url: https://tallyfy.com/how-to-list-mcp-server-anthropic-claude-connectors/
  - label: sunpeak — Claude Connector Directory submission requirements (2026-05-22)
    url: https://sunpeak.ai/blogs/claude-connector-directory-submission/
---

On July 31, a developer named Josh Symonds published a dated timeline of the four months he spent waiting for Anthropic to review his MCP connector for the Connectors Directory — submitted March 22, told on July 30 that his review queue had been discarded and to start over. The specific timeline is one person's account. The process it describes is documented in Anthropic's own submission docs and in two independent third-party guides, and that process is the story: getting an MCP server into the directory is app-store review, and it has no app store's clock.

## What's confirmed

The Connectors Directory is Anthropic's curated catalog of MCP servers — "high-quality, vetted, and reviewed" servers, in Anthropic's words — that a Claude user can discover and add inside the product. Since [MCP went stateless on July 28](/articles/2026-07-29-mcp-goes-stateless) and "every devtool is shipping an MCP server" became the house line, that catalog is a distribution channel, not a formality. And it is gated on three things every submitter should plan around.

First, **you need a Team or Enterprise organization to submit a remote server.** Submissions now run through an in-Claude.ai admin portal, not the open Google Form the earliest submitters used; individual plans don't have the admin settings the portal lives in. The intake got more capable — a status dashboard, reviewer feedback, an escalation address — and narrower at the same time.

Second, **the review is a real vetting pass, not a listing form.** Anthropic's policy says it reviews for "safety, security, and compatibility"; its docs warn that a missing or incomplete privacy policy is an immediate rejection. Sunpeak's independent write-up (May 22) lists the rest of the tripwires from experience: a tool missing a `title`, `readOnlyHint`, or `destructiveHint`; a test account with no sample data; descriptions that are "vague, promotional, or instruct the model how to behave." Reviewers "run functional tests against every tool and run a policy compliance scan." That is app-store review — a human exercising your product against a rubric — wearing a directory's clothes.

Third, **there is no published turnaround.** Anthropic's docs say only that "review times vary with queue volume." Tallyfy's guide (June 9) is blunter: "plan in weeks, not days," "each vendor review is slow and opaque," and — the part that turns a delay into a trap — "a single missing item sends you back to the end of the queue." Miss one annotation, resubmit, lose your place. None of that is Symonds's claim; it's what the documentation and the guides written before his post already said.

## The single-sourced part

Symonds's own numbers are one account, backed by redacted email screenshots — though he frames the episode as one entry in a wider pattern of Anthropic support failures, not an isolated case. Submitted March 22, resubmitted March 30, confirmed "received" May 26, told "in the review queue" June 15, told July 30 that the queue had been abandoned and to resubmit — over four months, no decision. Against it he sets OpenAI: the same connector submitted March 30, approved April 28. "29 days from submission to acceptance." Treat the 29-day figure and the four-month figure as reported, not established — a single developer, one connector, two vendors.

One piece of context his post supplies and the outrage headline drops: the intake system changed underneath him. He submitted through a Google Form; Anthropic now runs the portal described above. The most likely reading of "your queue was discarded" is a migration that dropped the old form's backlog rather than a targeted rejection — which is an explanation, not an excuse. Migrating your intake and losing the people already in line is its own failure, and the developer had no way to see it coming.

## Why it matters

The guide's §06 already lists "an MCP server" among the machine-readable surfaces you build to be found by AI assistants. This is the missing half: building the server and getting it distributed are two different jobs, and the second one now runs through a vendor's review queue with no SLA. Review latency has quietly become a competitive-distribution variable. If OpenAI clears a connector in weeks and Anthropic's queue runs in months — even intermittently, even because of a migration — the platform you can actually launch on is a real input to where your users find you, not a detail.

It also resets expectations. Teams treat "submit to the directory" like filling in a marketplace form and then get surprised by a code-review-grade gate with no ticket you can escalate cleanly. Plan it like the app-store submission it is.

## The one move this week

If an MCP server is on your roadmap, **prepare the directory submission like an App Store review, and don't make any one directory your only path to users.** Concretely: annotate every tool with a `title` and the right `readOnlyHint`/`destructiveHint`, ship a complete privacy policy, and stand up a fully populated reviewer test account before you submit — because a single gap resets your queue position, and the queue is measured in weeks. Then decouple your launch from the listing: publish your own install instructions and a direct connect URL so a developer (or their agent) can add your server the day you ship, whether or not the directory has blessed it yet. The listing is amplification; it should never be your only door.

**What to watch next:** whether Anthropic publishes a review SLA or a real appeals path now that the process is public and being criticized, and whether other Google-Form-era submitters corroborate being stranded by the portal migration. One angry post is a data point; a pattern of them would make review latency a story about MCP distribution, not about one developer's month.
