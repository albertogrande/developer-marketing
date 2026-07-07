# Developer Marketing — a living field guide

The state of the art in **developer marketing**, DevRel, and developer
experience — kept current by an autonomous [Claude Code](https://claude.com/claude-code)
agent. Built with [Astro](https://astro.build) and published to GitHub Pages.

**Live site:** https://albertogrande.github.io/developer-marketing/

## What it is

A practitioner's reference to marketing to developers, in three strands:

- **Guide** (`src/content/guide/`) — the evergreen reference. One file per
  section, `NN-slug.md`. Frontmatter: `title, order, summary, updated`.
- **Radar** (`src/content/radar/`) — dated signals, newest first.
  `YYYY-MM-DD-slug.md`. Frontmatter: `title, date, kind, summary, take, tags,
  related, sources`.
- **Deep dives** (`src/content/deep-dives/`) — long-form, researched pieces.
  `YYYY-MM-DD-slug.md`.

Schemas live in `src/content.config.ts` (Zod). Content is frontmatter-driven so
the autonomous agent can write it deterministically.

## How it stays current

The `radar-scan` skill (`.claude/skills/radar-scan/SKILL.md`) is the playbook:
it sweeps practitioner blogs, DevRel communities, and industry research, publishes
**one** dated radar entry, and refreshes any affected guide sections. The
`.github/workflows/radar.yml` workflow runs it daily via
[`anthropics/claude-code-action`](https://github.com/anthropics/claude-code-action);
`deploy.yml` then publishes to Pages.

Requires repo secret `CLAUDE_CODE_OAUTH_TOKEN` (from `claude setup-token`).

## Develop

```bash
npm install
npm run dev      # local dev server
npm run build    # astro build + pagefind search index
npm run preview  # preview the production build
```

The front-end (layouts, components, command palette, styles) is inherited from
the [Claude Code field guide](https://github.com/albertogrande/claude-code),
which itself descends from [The Wire](https://github.com/albertogrande/the-wire).

## License

MIT.
