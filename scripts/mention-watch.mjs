#!/usr/bin/env node
// Mention watch: what the world says about the site's own output. Queries
// public, keyless APIs (HN Algolia; Bluesky public search) for links to the
// site's origin and appends anything new to editorial/MENTIONS.md, deduped
// by URL. Charter-clean by construction — this watches the site's citations,
// never its readers (see docs/search-engines.md).
//
// Run weekly from liveness.yml; idempotent, exits 0 on API failures (a
// missing source is a warning, not an outage — the site's own scout already
// logs when these APIs go dark).

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { SITE_ORIGIN } from '../site.config.mjs';

const FILE = 'editorial/MENTIONS.md';
const host = new URL(SITE_ORIGIN).hostname;

const HEADER = `# Mentions

Public mentions of this site's pages, appended by \`scripts/mention-watch.mjs\`
(weekly, from the Liveness workflow) — newest first, deduped by URL. A taste
signal for the weekly editor: which pieces travel, and where.
`;

async function fetchJson(url) {
  try {
    const res = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn(`warn: ${new URL(url).hostname} unreachable (${e.message}) — skipped.`);
    return null;
  }
}

const found = [];

// Hacker News via Algolia — stories and comments linking the site.
const hn = await fetchJson(
  `https://hn.algolia.com/api/v1/search_by_date?query=%22${host}%22&hitsPerPage=50`
);
for (const hit of hn?.hits ?? []) {
  const url = `https://news.ycombinator.com/item?id=${hit.story_id ?? hit.objectID}`;
  const date = (hit.created_at ?? '').slice(0, 10);
  const title = hit.title ?? hit.story_title ?? '(comment)';
  found.push({ date, source: 'hn', title, url, points: hit.points });
}

// Bluesky public search — posts mentioning the host.
const bsky = await fetchJson(
  `https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=%22${host}%22&sort=latest&limit=50`
);
for (const post of bsky?.posts ?? []) {
  const rkey = post.uri?.split('/').pop();
  const handle = post.author?.handle;
  if (!rkey || !handle) continue;
  const url = `https://bsky.app/profile/${handle}/post/${rkey}`;
  const date = (post.record?.createdAt ?? post.indexedAt ?? '').slice(0, 10);
  const text = String(post.record?.text ?? '').replace(/\s+/g, ' ').slice(0, 80);
  found.push({ date, source: 'bluesky', title: text || '(post)', url });
}

const existing = existsSync(FILE) ? readFileSync(FILE, 'utf8') : HEADER;
const fresh = found
  .filter((m) => m.date && !existing.includes(m.url))
  .sort((a, b) => b.date.localeCompare(a.date));

if (!fresh.length) {
  if (!existsSync(FILE)) writeFileSync(FILE, existing);
  console.log('mention-watch: no new mentions.');
  process.exit(0);
}

const lines = fresh.map(
  (m) =>
    `- ${m.date} · ${m.source} · [${m.title.replace(/[[\]]/g, '')}](${m.url})${m.points != null ? ` (${m.points} pts)` : ''}`
);
// Newest entries go directly under the header block.
const [head, ...rest] = existing.split('\n\n');
writeFileSync(FILE, `${head}\n\n${lines.join('\n')}\n${rest.length ? '\n' + rest.join('\n\n') : ''}`);
console.log(`mention-watch: ${fresh.length} new mention(s) appended to ${FILE}.`);
