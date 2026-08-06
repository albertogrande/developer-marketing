#!/usr/bin/env node
// Fetch publisher-provided transcripts for recent podcast episodes into a
// local, gitignored cache so the scout can verify a claim or lift a short
// attributed quote instead of paraphrasing a marketing summary.
//
//   npm run podcast:transcripts               # last 2 days, every feed
//   npm run podcast:transcripts -- --days 7
//   npm run podcast:transcripts -- --show scaling-devtools
//   npm run podcast:transcripts -- --list     # report only, download nothing
//   npm run podcast:transcripts -- --all      # whole back catalogue, no window
//   npm run podcast:transcripts -- --pending  # episodes still lacking a note
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
  noteName,
} from './lib/podcasts.mjs';

const CACHE_DIR = '.cache/transcripts';
// Distilled episode notes — the site's own work product, committed. See
// editorial/podcasts/README.md for why the raw transcript is not.
const NOTES_DIR = 'editorial/podcasts';
const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};
const has = (name) => argv.includes(`--${name}`);

const days = Number(flag('days', 2));
const only = flag('show', null);
const listOnly = has('list');
const all = has('all');
// --pending answers "what is left to distil?" — every episode with a transcript
// available that has no note yet. It downloads nothing and is the queue the
// scout drains a few at a time.
const pendingOnly = has('pending');

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
    headers: { 'user-agent': 'thebeat-scout/1.0 (+https://thebeat.dev)' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`${label}: HTTP ${res.status}`);
  return res.text();
};

if (!listOnly && !pendingOnly) mkdirSync(CACHE_DIR, { recursive: true });

const now = new Date();
const found = [];
const missing = [];
const failed = [];
const pending = [];

for (const show of shows) {
  let items;
  try {
    const { items: parsed } = parseFeed(await get(show.feed, show.id));
    // --all and --pending walk the whole back catalogue; everything else asks
    // the scout's real question, "what shipped in the last ~24h".
    items = all || pendingOnly ? parsed.filter((i) => i.date) : withinDays(parsed, days, now);
  } catch (e) {
    failed.push({ show: show.name, why: e.message });
    continue;
  }

  if (!items.length) continue;

  for (const ep of items) {
    const pick = pickTranscript(ep.transcripts);

    if (pendingOnly) {
      // An episode is pending when a transcript exists to distil from and no
      // note has been written yet. No transcript means nothing to queue.
      if (!pick) continue;
      if (existsSync(join(NOTES_DIR, noteName(show.id, ep.date, ep.title)))) continue;
      pending.push({ show: show.name, title: ep.title, date: ep.date, link: ep.link });
      continue;
    }

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

if (pendingOnly) {
  pending.sort((a, b) => b.date - a.date);
  console.log(
    `podcast-transcripts: ${pending.length} episode(s) with a transcript and no note in ${NOTES_DIR}/ (newest first).`
  );
  for (const p of pending) console.log(`  · ${day(p.date)} ${p.show} — ${p.title}\n      ${p.link ?? ''}`);
  for (const f of failed) console.log(`  ! ${f.show}: ${f.why}`);
  process.exit(0);
}

const window = all ? 'whole back catalogue' : `last ${days} day(s)`;
console.log(
  `podcast-transcripts: ${shows.length} feed(s), ${window} — ${found.length} transcript(s), ${missing.length} episode(s) without one.`
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
