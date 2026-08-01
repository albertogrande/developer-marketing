#!/usr/bin/env node
// Fetch publisher-provided transcripts for recent podcast episodes into a
// local, gitignored cache so the scout can verify a claim or lift a short
// attributed quote instead of paraphrasing a marketing summary.
//
//   npm run podcast:transcripts               # last 2 days, every feed
//   npm run podcast:transcripts -- --days 7
//   npm run podcast:transcripts -- --show scaling-devtools
//   npm run podcast:transcripts -- --list     # report only, download nothing
//
// Exits 0 even when nothing is found: "no new episodes" and "episode published
// but its transcript isn't ready yet" are both normal days, not failures.
//
// THE CACHE IS NOT CONTENT. Files land in .cache/transcripts/ (gitignored) and
// are disposable. A transcript is a third party's copyrighted work; this repo
// publishes under CC BY 4.0 and cannot relicense someone else's words. Use one
// to check a fact or quote a sentence with attribution, then let it go — never
// commit one, and never paste a whole transcript into a brief.

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  PODCASTS,
  parseFeed,
  pickTranscript,
  withinDays,
  transcriptToText,
  cacheName,
} from './lib/podcasts.mjs';

const CACHE_DIR = '.cache/transcripts';
const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};
const has = (name) => argv.includes(`--${name}`);

const days = Number(flag('days', 2));
const only = flag('show', null);
const listOnly = has('list');

if (!Number.isFinite(days) || days <= 0) {
  console.error('podcast-transcripts: --days must be a positive number');
  process.exit(2);
}

const shows = only ? PODCASTS.filter((p) => p.id === only) : PODCASTS;
if (!shows.length) {
  console.error(
    `podcast-transcripts: no show with id "${only}". Known: ${PODCASTS.map((p) => p.id).join(', ')}`
  );
  process.exit(2);
}

const get = async (url, label) => {
  const res = await fetch(url, {
    headers: { 'user-agent': 'developer-marketing-scout/1.0 (+https://developer-marketing.vercel.app)' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`${label}: HTTP ${res.status}`);
  return res.text();
};

if (!listOnly) mkdirSync(CACHE_DIR, { recursive: true });

const now = new Date();
const found = [];
const missing = [];
const failed = [];

for (const show of shows) {
  let items;
  try {
    const { items: parsed } = parseFeed(await get(show.feed, show.id));
    items = withinDays(parsed, days, now);
  } catch (e) {
    failed.push({ show: show.name, why: e.message });
    continue;
  }

  if (!items.length) continue;

  for (const ep of items) {
    const pick = pickTranscript(ep.transcripts);
    if (!pick) {
      // Expected, not an error: Transistor publishes the transcript a few days
      // after the episode, and some shows never publish one at all.
      missing.push({
        show: show.name,
        title: ep.title,
        date: ep.date,
        link: ep.link,
        hint: show.transcripts === 'on-page' ? 'transcript may be on the episode page' : 'no transcript published yet',
      });
      continue;
    }
    const file = join(CACHE_DIR, cacheName(show.id, ep.date, ep.title));
    if (listOnly) {
      found.push({ show: show.name, title: ep.title, date: ep.date, file, cached: existsSync(file) });
      continue;
    }
    try {
      const text = transcriptToText(await get(pick.url, ep.title ?? show.id), pick.type);
      const header = [
        `# ${ep.title ?? '(untitled episode)'}`,
        `Show: ${show.name}`,
        `Published: ${ep.date.toISOString().slice(0, 10)}`,
        `Episode: ${ep.link ?? '(no link)'}`,
        `Transcript: ${pick.url} (${pick.type})`,
        '',
        'Publisher-provided transcript, cached for verification only. Copyright',
        'remains with the publisher — quote briefly with attribution, never',
        'republish, never commit this file.',
        '',
        '---',
        '',
      ].join('\n');
      writeFileSync(file, header + text + '\n');
      found.push({ show: show.name, title: ep.title, date: ep.date, file, words: text.split(/\s+/).length });
    } catch (e) {
      failed.push({ show: show.name, why: `${ep.title}: ${e.message}` });
    }
  }
}

const day = (d) => d.toISOString().slice(0, 10);
console.log(
  `podcast-transcripts: ${shows.length} feed(s), last ${days} day(s) — ${found.length} transcript(s), ${missing.length} episode(s) without one.`
);
for (const f of found) {
  console.log(`  ✓ ${day(f.date)} ${f.show} — ${f.title}`);
  console.log(`      ${f.file}${f.words ? ` (${f.words} words)` : f.cached ? ' (already cached)' : ''}`);
}
for (const m of missing) {
  console.log(`  · ${day(m.date)} ${m.show} — ${m.title}`);
  console.log(`      ${m.hint}: ${m.link ?? ''}`);
}
for (const f of failed) console.log(`  ! ${f.show}: ${f.why}`);
if (failed.length) console.log('  (fetch failures are reported, not fatal — the sweep continues)');
