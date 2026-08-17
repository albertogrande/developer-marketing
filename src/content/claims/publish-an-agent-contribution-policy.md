---
title: Publish an agent-contribution policy before the norm hardens
when: Maintaining an open-source project — or running community programs for one — that receives AI-assisted or agent-written pull requests.
do: Decide the policy once and write it where humans and agents both read it — an AGENTS.md beside the code, strict PR templates with auto-close on non-compliance, CI thresholds as required checks, and one deliberately human step (a CLA flow) as a checkpoint — instead of relitigating it per PR.
why: The norm is being set in public right now. Debian opened a binding project-wide General Resolution on AI/LLM contributions (voting 2026-08-15 to 2026-08-28, eight options from outright ban to disclosure-conditioned acceptance), the Emacs project drafted an AGENTS.md that restricts agents rather than enabling them, and GitHub's own maintainer guidance (2026-08-12, from AutoGPT maintainer Nicholas Tindle) recommends explicit gates over closed doors. Projects with no written policy inherit whichever norm wins elsewhere.
section: 03-devrel-and-community
tags: [devrel, community]
since: The 2026-08 governance cluster — Emacs AGENTS.md draft (2026-08-03), GitHub's maintainer guidance (2026-08-12), Debian's General Resolution (2026-08-15 to 2026-08-28)
verify: Check the Debian GR result on debian-devel-announce after 2026-08-28 and whether major forges have shipped agent-contribution policy features; re-read your own AGENTS.md against how agent PRs actually behave.
status: current
checked: 2026-08-17
updated: 2026-08-17
sources:
  - label: Debian — General Resolution on AI/LLM contribution policy
    url: https://lists.debian.org/debian-devel-announce/2026/08/msg00002.html
  - label: The GitHub Blog — Your contributors are AI-first now. Is your project?
    url: https://github.blog/open-source/maintainers/your-contributors-are-ai-first-now-is-your-project
---

Which option Debian passes will move this claim — an outright ban winning
would flip the recommended posture from "gate" toward "decide which side of a
forking norm you're on." Re-verify immediately after 2026-08-28.
