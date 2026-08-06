---
title: "The deprecation that didn't burn anyone"
date: 2026-08-06
summary: Five sunsets landed in six weeks — on clocks of 27 days, 29 days, a month, ten months, and twelve months. The window is what gets quoted, but the mechanics decide who gets burned. A working anatomy of the clean deprecation, and the checklist for running one as the campaign it is.
dek: "GitHub retired three surfaces in a week. MCP put a year under everything it deprecated. HashiCorp published a ten-month calendar. Cerebras' free-tier sunset lands August 17. The migration window is the headline — but notice reach, loud failure, and where the export lands are what separate a clean deprecation from a quiet churn event."
tags: [dx, activation, positioning]
related:
  - label: Guide — Developer experience & activation
    href: /guide/04-developer-experience-and-activation
  - label: Guide — Positioning for developers
    href: /guide/01-positioning-for-developers
  - label: "The Week (W31) — Twelve months or six weeks"
    href: /issues/2026-W31
  - label: Article — MCP just became infrastructure
    href: /articles/2026-07-29-mcp-goes-stateless
sources:
  - label: Model Context Protocol — The 2026-07-28 Specification
    url: https://blog.modelcontextprotocol.io/posts/2026-07-28/
  - label: GitHub Changelog — GitHub Models is being fully retired on July 30 (July 1)
    url: https://github.blog/changelog/2026-07-01-github-models-is-being-fully-retired-on-july-30-2026/
  - label: GitHub Changelog — GitHub Models is now retired (July 30)
    url: https://github.blog/changelog/2026-07-30-github-models-is-now-retired
  - label: GitHub Changelog — Upcoming deprecation of GitHub Spark (August 4)
    url: https://github.blog/changelog/2026-08-04-upcoming-deprecation-of-github-spark-on-github-com/
  - label: HashiCorp Developer — HCP Vagrant Registry end of life
    url: https://developer.hashicorp.com/hcp/docs/vagrant/hcp-vagrant-eol
  - label: "Hacker News — Cerebras discontinue its free tier plan"
    url: https://news.ycombinator.com/item?id=48941271
  - label: Ian L. Paterson — Free LLM APIs in 2026
    url: https://ianlpaterson.com/blog/free-llm-api-2026/
  - label: "Stripe — APIs as infrastructure: future-proofing Stripe with versioning"
    url: https://stripe.com/blog/api-versioning
  - label: Kubernetes — Deprecation policy
    url: https://kubernetes.io/docs/reference/using-api/deprecation-policy/
  - label: Heroku — Heroku's Next Chapter (2022 free-tier sunset)
    url: https://www.heroku.com/blog/next-chapter
---

Developer marketing has a whole literature on launches and almost none on endings. That gap just became expensive, because the last six weeks produced five dated sunsets from four vendors, and they read like a controlled experiment in how to end a product:

- **MCP** deprecated its old transport, its old auth registration, and three protocol features on **July 28** — with a written, minimum **twelve-month** offramp under all of it.
- **GitHub Models** went dark on **July 30** — six weeks after it closed to new customers, and **29 days** after existing customers were told the shutdown date.
- **GitHub Spark** was deprecated on **August 4** — new users and new apps stopped that day; existing users get until **August 31**, about **27 days**, to export.
- **HashiCorp's HCP Vagrant Registry** got a three-phase calendar ending **June 7, 2027** — roughly **ten months** of runway from the August 3 announcement.
- **Cerebras'** free API tier converts to a credit-based model on **August 17** — about a month after the email went out.

[The W31 weekly](/issues/2026-W31) made the short version of the argument: the migration window is a positioning claim now, the way the pricing cap became one. This dive is the long version, and it complicates the headline number. The window is what gets quoted, but it is not what determines who gets burned. **A deprecation is a campaign — the last one you will ever run for that product, and the first impression for everything else you sell.** Like any campaign it has mechanics: whether the notice reaches the person whose code will break, whether failure is loud before it is fatal, whether the export lands somewhere the customer controls, and whether the replacement is named honestly. Get those right and even a short window can be survivable. Get them wrong and a twelve-month window is just a longer fuse on the same churn event.

## Why the damage is silent

Start with what a botched deprecation actually costs, because it is systematically underpriced — the feedback loop is broken.

When a launch flops, you see it: no signups, no upvotes, a quiet Slack. When a deprecation burns someone, you mostly see nothing. The developer whose cron job started failing at 3 a.m. does not file an angry ticket; they patch around you, note "this vendor breaks things," and surface that judgment months later at the next build-vs-buy decision — a meeting you are not in. [The DX section of the guide](/guide/04-developer-experience-and-activation) has carried this point since July; the five cases let us put mechanics under it.

The cleanest specimen of the silent burn predates all five windows. In a dated write-up of running production workloads on free LLM APIs, practitioner Ian Paterson describes Cerebras quietly pruning its free-tier model catalog from about a dozen models down to two — by May 31 the live API returned exactly two entries. His monitoring script, pinned to one model name, failed every call. "No email, no deprecation notice that reached me," he writes. "One day the call worked, the next it returned a 404." The error did not even say *deprecated* — it said the model "does not exist or you do not have access to it." (His account is single-sourced; the two-model catalog was checkable against the live API at the time.)

Note what that episode is not: it is not a pricing controversy, and it never trended. It is one developer, one broken integration, one conclusion filed away — repeated across however many integrators were pinned to those models. That is the quiet churn event. No spike in any dashboard, and the trust is gone anyway. The reason to study deprecation mechanics is that this failure mode is *invisible by default*, so only deliberate process prevents it.

## What the long window buys — and what it actually consists of

The [2026-07-28 MCP spec](https://blog.modelcontextprotocol.io/posts/2026-07-28/) is the current benchmark, and it is worth being precise about why — because the twelve months is the least interesting part.

The spec deprecated real, deployed surface: the legacy HTTP+SSE transport, Dynamic Client Registration, and the Roots/Sampling/Logging features. Each deprecation is tracked under a numbered proposal (SEPs), dated, and covered by an explicit keep-working guarantee: "They still work, and they'll keep working for at least twelve months. New implementations shouldn't adopt them." The window is framed as a design goal — "a twelve-month minimum window so you can plan upgrades instead of reacting to them" — and the offramp shipped *with* the deprecation, not after it: all four Tier-1 SDKs (TypeScript, Python, Go, C#) supported the new spec day one, with migration notes on the breaking changes. The project even concedes the cost out loud: "there will be some migration cost, especially for developers that did depend on session identifiers."

Decompose that and you get four mechanics, only one of which is the number: a **dated policy** (not a promise made per-incident), a **keep-working guarantee** with a floor, a **migration path that exists on day one**, and **honesty about the cost**. [HashiCorp's Vagrant retirement](https://developer.hashicorp.com/hcp/docs/vagrant/hcp-vagrant-eol) shows the same anatomy stretched over infrastructure: three dated phases (new box creation ends 2026-12-14, support ends 2027-03-15, operations cease 2027-06-07), promised export tooling — local export, S3 hosting guidance, "a snapshot of all existing Vagrant boxes" in "a static archive with URL redirects" — and the open-source community edition named as the fallback, with the honest caveat that users will "be responsible for the hosting costs incurred." Ten months is shorter than MCP's twelve-month floor, but the load-bearing part isn't the total — it's that every phase has a date and the exit ramp is specified before the first door closes.

Neither of these invented the pattern. The institutional ancestors are policies, not events. [Stripe's 2017 versioning post](https://stripe.com/blog/api-versioning) described date-pinned API versions with the claim that "we've maintained compatibility with every version of our API since the company's inception in 2011" — nearly a hundred backwards-incompatible changes without ever forcing an upgrade — and framed the whole thing in one sentence developer marketers should tattoo somewhere: "Just like a power company shouldn't change its voltage every two years, we believe that our users should be able to trust that a web API will be as stable as possible." [Kubernetes' deprecation policy](https://kubernetes.io/docs/reference/using-api/deprecation-policy/) puts hard floors in writing — GA API versions "must not be removed within a major version"; beta versions keep being served for at least nine months or three releases after deprecation — and, since v1.19, makes the API itself announce the deprecation via a `Warning` header and a metric.

That last mechanism matters more than it looks. A published policy converts every individual deprecation from a judgment call into a contract lookup — the integrator can price the risk before adopting. That is why "what's your deprecation policy" is quietly becoming a procurement question, and why the window has migrated from an ops detail to a positioning surface.

## The anatomy of the short one

Now the counterexamples — and the honest reading is more mixed than "GitHub bad."

[GitHub Models' retirement](https://github.blog/changelog/2026-07-30-github-models-is-now-retired) got some mechanics genuinely right. The shutdown was staged: closed to new customers June 16, full retirement [announced July 1](https://github.blog/changelog/2026-07-01-github-models-is-being-fully-retired-on-july-30-2026/), dead July 30. And crucially, the July 1 notice scheduled two **brownouts** — July 16 and 23 — during which "GitHub Models requests will temporarily return errors before service is restored." A brownout is the loud-failure pattern done properly: it finds the integrations whose owners never read the email, in a way that is recoverable. It exists precisely because notice sent is not notice received. Any team running a shutdown should copy it.

What Models got wrong is everything around the clock. Existing customers — explicitly including those "with active usage" — got 29 days from the announced hard date to errors. There was no export tooling and no like-for-like replacement: departing users were pointed at Microsoft Foundry ("a broad model catalog") and Copilot — adjacent products with different auth, different billing, different shapes. The killed product's core value was being the zero-setup way to call models with just a GitHub token; neither successor preserves it. Compare Heroku's 2022 free-tier sunset — the canonical modern precedent — which gave roughly three months from [announcement](https://www.heroku.com/blog/next-chapter) (August 25) to shutdown (November 28) and at least stated its reason plainly: "an extraordinary amount of effort to manage fraud and abuse." Heroku's sunset is remembered bitterly anyway, which is the point — three months and a named reason is roughly the *floor* at which a free-tier kill stays merely unpopular. Models came in well under it.

[Spark](https://github.blog/changelog/2026-08-04-upcoming-deprecation-of-github-spark-on-github-com/), announced five days later, is the strangest case: brutal clock, decent mechanics. About 27 days to the August 31 export deadline — the shortest window in this comparison — but the export lands somewhere the developer controls (the workbench's "Create repository" flow puts the app's code in a normal GitHub repo), and "apps you've already deployed will continue to work after GitHub Spark is retired."

Except many won't — and this is the finding that generalizes. Spark apps call AI through a built-in `llm()` function. That function ran on GitHub Models, which died July 30. So every Spark app using AI broke *five days before Spark's own deprecation was announced*, and the fix is to "replace it with your own inference provider" — your own API key, your own billing. Each window, judged alone, was administered roughly as documented. Stacked, the platform's dependency retired before the platform's users were told anything. Call it **compounding clocks**: a deprecation schedule is only as trustworthy as the schedules of everything underneath it, and the burn landed on people who never chose GitHub Models at all — they chose Spark, which chose Models. If you sell a platform, your deprecation policy implicitly includes your suppliers'.

## The steelman: most windows are wasted on most users

The strongest case for the short window deserves stating properly, because parts of it are true.

First: migration is deadline-driven. Give integrators twelve months and most will move in month twelve — every ops team knows the migration curve is a hockey stick at the cutoff. The window's length mostly changes *when* the scramble happens, not whether it happens. Brownouts exist because even a dated email doesn't get read; arguably the brownout, not the window, does the real work of finding stragglers.

Second: long offramps have a real carrying cost. Stripe can afford eternal compatibility because it built version-transformation modules that make old versions a fixed cost; most teams didn't, and for them every deprecated-but-supported surface is an on-call burden, a security exposure, and a tax on velocity. Worse, a killed product has no team left to staff a ten-month wind-down — the org has already moved on, which is exactly why retired products get short clocks.

Third: proportionality. GitHub Models was free, marketed to experimenters, never GA'd as critical infrastructure. Killing an experiment fast is what healthy portfolios do; demanding Kubernetes-grade process for every playground would mean fewer playgrounds shipped at all.

All fair — and all beside the point, because each argument prices the deprecation against *the product being killed*, and the trust damage lands on *everything else the vendor sells*. Developers cannot reliably distinguish the experiment from the platform ex ante — GitHub retired three surfaces in five days (Models, the Copilot Billing Preview app, and Spark), and the reader deciding today whether to build on any GitHub AI surface has exactly one usable signal about which of them is next: the vendor's demonstrated deprecation behavior. That is what a published policy is *for* — it is the mechanism that lets you kill experiments fast without repricing your platform, because it tells integrators in advance which one they are holding. The vendors with written floors (Stripe, Kubernetes, now MCP) are the ones that get to make aggressive changes without a trust bill. The absence of a policy means every sunset is adjudicated by vibes, and the vibes compound against you.

And the deadline-driven-migration point cuts the other way: if most users move only at the cutoff regardless, then the *cost* of a long window to the vendor is mostly support overlap — while the cost of a short one is borne entirely by the minority with real production dependencies, who are precisely your most valuable integrators. The hockey stick is an argument for brownouts and loud failure, not for short windows.

## Cerebras lands in eleven days

Which brings us to the live test. Per the notification email [quoted on Hacker News](https://news.ycombinator.com/item?id=48941271), on August 17 Cerebras free-tier accounts transition to a credit-based model: "You'll be required to add a payment method to unlock $5 in free credits to continue to use the service." The notice went out by email roughly a month ahead — dated, explicit, and a defensible business change. Free tiers are not entitlements, and a payment-method gate is the standard fraud control; Heroku's entire sunset rationale was the abuse a naked free tier attracts.

But Cerebras is running this sunset with a trust deficit it already incurred — the silent catalog pruning above — and against a developer base predisposed to read it cynically (the HN thread's verdict, in one commenter's words: Wall Street demands growth, the freebies get taken away, time to pay for your tools). So August 17 is a clean natural experiment in whether mechanics can carry a sunset that sentiment is against. What clean looks like, concretely: requests after the cutoff fail with an error that names the change and links the migration doc — not a `404`, not "model does not exist"; the dashboard shows the credit state before the deadline, not after the first failed call; and the models in the catalog hold still through the transition, because a pricing change and a catalog change in the same window reads as bait-and-switch even when it's coincidence. If integrations die silently at 9:00 a.m. on the 17th, the episode goes in the churn-event column and the catalog pruning becomes a pattern instead of an incident. We'll log how it lands.

## Running the ending as a campaign

For the reader who markets a developer product, the synthesis. You will eventually deprecate something — a free tier, an API version, an acquired product, a model. The five cases reduce to a checklist, in priority order:

1. **Publish the policy before you need it.** A written floor — "deprecated surfaces keep working N months minimum" — is the single highest-leverage artifact, because it converts every future sunset from a judgment call into a contract lookup, and it is a sales asset the week a competitor botches theirs. MCP's twelve-month minimum is the current benchmark in the agent ecosystem; as of mid-2026, a window measured in weeks reads as a warning label on everything else you ship.
2. **Date every phase.** Three dates minimum: announcement, freeze (no new usage), off. HashiCorp published all three at once, ten months out. An undated "we plan to wind down" is not a deprecation, it's a threat.
3. **Make the API the channel.** The integration that breaks belongs to someone who does not read your email. Kubernetes returns a `Warning` header; GitHub Models ran two scheduled brownouts. Loud, recoverable failure before the cutoff is the only notice that reliably arrives. And the terminal error is marketing copy: it must say *deprecated*, name the date, and link the migration guide. A silent `404` is how you end up in someone's blog post as the cautionary tale.
4. **Ship the offramp with the announcement, not after.** MCP's SDKs supported the new spec on day one; Spark's export was a working button, landing code in a repo the user owns. An export "coming soon" is a promise from a team that is being disbanded.
5. **Name the replacement honestly — including "there isn't one."** Pointing users at adjacent products as if they were substitutes (Models → Foundry/Copilot) insults the people who can tell the difference, which for developer products is all of them. If there is no like-for-like, say so, expect the churn, and plan the win-back instead of pretending.
6. **Audit the compounding clocks.** If you sell a platform, list what your users' workloads transitively depend on and check those schedules against yours. Spark's users were burned by a deprecation two layers down, before their own notice existed.
7. **Measure it like a campaign.** Notice reach, migration curve against the deadline, share migrated before the final week, support-ticket shape after cutoff. If you can't tell whether the notice arrived, you have decided not to know whether you burned anyone.

The through-line: a launch and a deprecation are the same discipline pointed in opposite directions. Both are dated, staged communication events with a funnel, a measurable outcome, and copy that does real work. The industry treats one as marketing and the other as an ops chore — and the vendors that have figured out it's all one trust surface are, not coincidentally, the ones whose deprecations don't make lists like this one.

Two dates to watch. August 17: how Cerebras lands. End of September: whether any devtool that ships an MCP server publishes a dated public migration plan off the deprecated transport and auth — the test [the W31 weekly](/issues/2026-W31) set. The first vendor to market its migration plan as a feature, rather than bury it as a chore, gets to own the positioning that this whole summer just made legible: *we end things well*.
