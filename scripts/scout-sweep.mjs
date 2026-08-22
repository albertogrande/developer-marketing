#!/usr/bin/env node
// The scout's deterministic capture: fetch every registered source (RSS/Atom
// watchlist + scoped community firehoses), normalize what landed in the
// window into events, and append the new ones to the append-only event DB
// (signals/db/<ISO-week>.ndjson). The model triages this output; it does not
// do the collecting.
//
// The DB is capture, not published claims — its URLs are deliberately outside
// check-sources.mjs's liveness gate (which is .md-only): link-checking a
// firehose would drown the gate, and nothing here ships to a reader without
// first passing through the signals' own rules.
//
// Usage:
//   npm run scout:sweep                    # last 2 days, append + triage
//   npm run scout:sweep -- --days 3
//   npm run scout:sweep -- --dry-run       # fetch + report, write nothing
//   npm run scout:sweep -- --json          # print new events as JSON lines
//   npm run scout:sweep -- --list          # print the registry and exit
//
// Failures are per-source and never fatal (a rotten feed is a report line,
// not a dead sweep); the script exits 0 unless the arguments are invalid.

import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  SOURCES,
  SITEMAPS,
  CRAWLS,
  COMMUNITY,
  parseAnyFeed,
  parseSitemap,
  extractLinks,
  humanizeSlug,
  normalizeEvent,
  hnToEvents,
  redditToEvents,
  lobstersToEvents,
  bskyToEvents,
  readDb,
  dbFileFor,
} from './lib/scout-sources.mjs';
import { PODCASTS } from './lib/podcasts.mjs';
import { useScoutProxy } from './lib/proxy.mjs';

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(name);
  return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};
const has = (name) => argv.includes(name);

const DAYS = Number(flag('--days', '2'));
if (!Number.isFinite(DAYS) || DAYS <= 0 || DAYS > 30) {
  console.error('scout-sweep: --days must be a number between 1 and 30');
  process.exit(2);
}
const DRY = has('--dry-run');
const JSON_OUT = has('--json');

if (has('--list')) {
  for (const s of SOURCES) console.log(`rss        ${s.id.padEnd(28)} ${s.kind.padEnd(12)} ${s.feed}`);
  for (const p of PODCASTS) console.log(`rss        ${p.id.padEnd(28)} ${'podcast'.padEnd(12)} ${p.feed}`);
  for (const q of COMMUNITY.hnQueries) console.log(`hn         query: ${q}`);
  for (const q of COMMUNITY.hnShowQueries) console.log(`hn-show    query: ${q}`);
  for (const s of SITEMAPS) console.log(`sitemap    ${s.id.padEnd(28)} ${s.kind.padEnd(12)} ${s.sitemap}`);
  for (const s of CRAWLS) console.log(`crawl      ${s.id.padEnd(28)} ${s.kind.padEnd(12)} ${s.page}`);
  for (const s of COMMUNITY.subreddits) console.log(`reddit     r/${s.name} (${s.mode})`);
  console.log(`lobsters   newest.json, keyword-filtered`);
  for (const a of COMMUNITY.bskyAuthors) console.log(`bluesky    @${a.handle} (${a.mode})`);
  process.exit(0);
}

const NOW = new Date();
const SINCE = new Date(NOW.getTime() - DAYS * 86400e3);
const TIMEOUT_MS = 10_000;
const CONCURRENCY = 8;
const UA = 'thebeat-scout/1.0 (+https://thebeat.dev)';

// SCOUT_PROXY_URL set → every fetch below goes through it, which is what
// unblocks the IP-blocked half of the watchlist from CI (see lib/proxy.mjs).
const PROXIED = await useScoutProxy();
if (PROXIED) console.log('scout-sweep: egress via SCOUT_PROXY_URL.');

const failures = [];
// label → in-window items this run. A source that fetches fine and returns
// nothing looks identical, in the old report, to one that was never asked —
// which is how Reddit and Bluesky went a fortnight at zero without anything
// saying so. Recording the shape of every job makes silence legible.
const yielded = new Map();

async function get(url, label, accept = 'application/rss+xml, application/atom+xml, application/json, text/xml, */*') {
  const res = await fetch(url, {
    headers: { 'user-agent': UA, accept },
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// Each job returns events (possibly none); its failure is one report line.
async function job(label, fn) {
  try {
    const events = await fn();
    yielded.set(label, events.length);
    return events;
  } catch (e) {
    failures.push(`${label}: ${e.message}`);
    return [];
  }
}

const inWindow = (ev) => {
  const t = new Date(ev.ts).getTime();
  return t >= SINCE.getTime() && t <= NOW.getTime() + 3600e3; // small clock-skew allowance
};

const jobs = [];

// RSS/Atom watchlist (incl. the podcast registry — same feeds the transcript
// pipeline reads; the DB records the episodes as events, dedup by URL).
const rssSources = [
  ...SOURCES,
  ...PODCASTS.map((p) => ({ id: p.id, name: p.name, feed: p.feed, kind: 'podcast', posture: 'independent' })),
];
for (const s of rssSources) {
  jobs.push(() =>
    job(`rss ${s.id}`, async () => {
      const xml = await get(s.feed, s.id);
      const { items } = parseAnyFeed(xml);
      const channel = s.channel ?? 'rss';
      return items
        .filter((i) => i.date) // undated items can't be windowed — skip, honestly
        .map((i) =>
          normalizeEvent({
            ts: i.date,
            source: s.id,
            channel,
            title: i.title,
            url: i.link,
            summary: i.summary,
            author: i.author,
          })
        )
        .filter(inWindow);
    })
  );
}

// Dated sitemaps — as window-filterable as a feed; titles humanized from
// the slug.
for (const s of SITEMAPS) {
  jobs.push(() =>
    job(`sitemap ${s.id}`, async () => {
      const xml = await get(s.sitemap, s.id);
      const inc = new RegExp(s.include);
      const exc = s.exclude ? new RegExp(s.exclude) : null;
      return parseSitemap(xml)
        .filter((u) => u.lastmod && inc.test(u.loc) && !(exc && exc.test(u.loc)))
        .map((u) =>
          normalizeEvent({ ts: u.lastmod, source: s.id, channel: 'crawl', title: humanizeSlug(u.loc), url: u.loc })
        )
        .filter(inWindow);
    })
  );
}

// Feedless blogs — crawl the index page. First contact seeds the seen-file
// silently (no back-catalogue flood); after that, an unseen link is a new
// post, stamped with capture time.
const SEEN_FILE = 'signals/db/.crawl-seen.json';
const crawlSeen = existsSync(SEEN_FILE) ? JSON.parse(await readFile(SEEN_FILE, 'utf8')) : {};
let crawlSeenDirty = false;
for (const s of CRAWLS) {
  jobs.push(() =>
    job(`crawl ${s.id}`, async () => {
      const html = await get(s.page, s.id, 'text/html,*/*');
      const links = extractLinks(html, { pattern: s.linkPattern, base: s.base });
      const seenSet = new Set(crawlSeen[s.id] ?? []);
      const unseen = links.filter((l) => !seenSet.has(l.url));
      const coldStart = seenSet.size === 0;
      for (const l of links) seenSet.add(l.url);
      crawlSeen[s.id] = [...seenSet];
      crawlSeenDirty = true;
      if (coldStart) {
        failures.push(`crawl ${s.id}: cold start — ${links.length} existing posts seeded, capture begins next run`);
        return [];
      }
      return unseen.slice(0, s.take).map((l) =>
        normalizeEvent({ ts: NOW, source: s.id, channel: 'crawl', title: l.text, url: l.url })
      );
    })
  );
}

// Hacker News via Algolia — exact timestamps, always fetchable.
const hnSince = Math.floor(SINCE.getTime() / 1000);
for (const q of COMMUNITY.hnQueries) {
  jobs.push(() =>
    job(`hn "${q}"`, async () => {
      const url = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(q)}&tags=story&numericFilters=created_at_i%3E${hnSince}&hitsPerPage=50`;
      return hnToEvents(JSON.parse(await get(url, 'hn')), { source: 'hackernews' }).filter(inWindow);
    })
  );
}
for (const q of COMMUNITY.hnShowQueries) {
  jobs.push(() =>
    job(`hn-show "${q}"`, async () => {
      const url = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(q)}&tags=show_hn&numericFilters=created_at_i%3E${hnSince}&hitsPerPage=50`;
      return hnToEvents(JSON.parse(await get(url, 'hn')), { source: 'show-hn' }).filter(inWindow);
    })
  );
}

// Reddit — the per-subreddit Atom feed. The JSON endpoints (www, old, and the
// OAuth host alike) 403 every unauthenticated caller, which kept these four
// jobs at zero events from the day they were registered; .rss is the surface
// Reddit still serves without a token.
for (const sub of COMMUNITY.subreddits) {
  jobs.push(() =>
    job(`reddit r/${sub.name}`, async () => {
      const url = `https://www.reddit.com/r/${sub.name}/new/.rss?limit=50`;
      const keywords = sub.mode === 'filtered' ? COMMUNITY.keywords : [];
      return redditToEvents(await get(url, 'reddit'), { subreddit: sub.name, keywords }).filter(inWindow);
    })
  );
}

// Lobsters — the newest stream, keyword-filtered (its search API rejects
// query params from scripts).
jobs.push(() =>
  job('lobsters', async () => {
    const json = JSON.parse(await get('https://lobste.rs/newest.json', 'lobsters'));
    return lobstersToEvents(json, { keywords: COMMUNITY.keywords }).filter(inWindow);
  })
);

// Bluesky — registered practitioners via the public getAuthorFeed. Post search
// is behind bot protection and 403s without a token, so the channel follows
// accounts instead of queries (see COMMUNITY.bskyAuthors for why each is here).
for (const a of COMMUNITY.bskyAuthors) {
  jobs.push(() =>
    job(`bsky @${a.handle}`, async () => {
      const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(a.handle)}&limit=50&filter=posts_no_replies`;
      const keywords = a.mode === 'filtered' ? COMMUNITY.keywords : [];
      return bskyToEvents(JSON.parse(await get(url, 'bsky')), { source: `bsky:${a.handle}`, keywords }).filter(inWindow);
    })
  );
}

// Bounded concurrency, same shape as check-sources.mjs.
const results = [];
for (let i = 0; i < jobs.length; i += CONCURRENCY) {
  const batch = jobs.slice(i, i + CONCURRENCY).map((fn) => fn());
  results.push(...(await Promise.all(batch)));
}

const fetched = results.flat();

// Dedupe: within the run, then against everything the DB already holds.
//
// This used to check only the week files for SINCE and NOW, which leaks: an
// event's file is chosen by its own timestamp, so a source that restamps a URL
// with a later date — leerob.com's sitemap gives every <loc> the build time —
// re-enters in a *different* week file and is appended again. That is exactly
// how the first fortnight collected 34 duplicate lines. Replay hides it (last
// write wins), so nothing ever complained, but line count stopped meaning
// event count. Reading every week file is what scout-query and scout-enrich
// already do; the cost is one pass over a few hundred KB per sweep.
const seen = new Map();
for (const ev of fetched) if (!seen.has(ev.id)) seen.set(ev.id, ev);

const dbFiles = existsSync('signals/db')
  ? readdirSync('signals/db').filter((f) => /^\d{4}-W\d{2}\.ndjson$/.test(f)).map((f) => `signals/db/${f}`)
  : [];
for (const file of dbFiles) {
  for (const id of readDb(await readFile(file, 'utf8')).keys()) seen.delete(id);
}

const fresh = [...seen.values()].sort((a, b) => a.ts.localeCompare(b.ts));

if (!DRY && crawlSeenDirty) {
  await mkdir(dirname(SEEN_FILE), { recursive: true });
  await writeFile(SEEN_FILE, JSON.stringify(crawlSeen, null, 2) + '\n', 'utf8');
}

// Append each event to its own week's file (an event belongs to the week it
// happened, not the week the sweep ran).
if (!DRY && fresh.length) {
  const byFile = new Map();
  for (const ev of fresh) {
    const file = dbFileFor(new Date(ev.ts));
    if (!byFile.has(file)) byFile.set(file, []);
    byFile.get(file).push(ev);
  }
  for (const [file, events] of byFile) {
    await mkdir(dirname(file), { recursive: true });
    await appendFile(file, events.map((e) => JSON.stringify(e)).join('\n') + '\n', 'utf8');
  }
}

// --- report ----------------------------------------------------------------

if (JSON_OUT) {
  for (const ev of fresh) console.log(JSON.stringify(ev));
} else {
  const byChannel = new Map();
  for (const ev of fresh) {
    if (!byChannel.has(ev.channel)) byChannel.set(ev.channel, []);
    byChannel.get(ev.channel).push(ev);
  }
  for (const [channel, events] of byChannel) {
    console.log(`\n## ${channel} — ${events.length} new`);
    for (const ev of events) {
      console.log(`- ${ev.ts.slice(0, 10)} [${ev.source}] ${ev.title}`);
      console.log(`  ${ev.url}`);
    }
  }
}

console.log(
  `\nscout-sweep: ${fresh.length} new event(s) from ${jobs.length} source jobs ` +
    `(window ${DAYS}d, ${fetched.length} in-window items before dedupe)${DRY ? ' — dry run, nothing written' : ''}.`
);
if (failures.length) {
  console.log(`\nunreachable (${failures.length}) — tolerated, fix or prune in scripts/lib/scout-sources.mjs:`);
  for (const f of failures) console.log(`  - ${f}`);

  // Reddit blocks datacenter egress at the IP, not the endpoint: www and old,
  // .json and .rss, every User-Agent and Accept combination answers 403 from a
  // CI runner, and the same requests answer 200 through a proxy. Saying so here
  // stops a permanent, understood block from reading like today's flake.
  // Behind SCOUT_PROXY_URL the note would be wrong twice over — a 403 through
  // the proxy is the proxy's IP burning, a different problem — so it is
  // suppressed and the failure lines above stand on their own.
  if (!PROXIED && failures.some((f) => f.startsWith('reddit r/') && f.includes('403'))) {
    console.log(
      '\n  note: Reddit 403s all datacenter egress — this is an IP block, not a broken URL,\n' +
        '        so it will fail every CI run until the sweep gets a proxy or Reddit API\n' +
        '        credentials. It does reach when the sweep runs behind one. See BACKLOG.md.'
    );
  }
}

// Reached, returned nothing. Over a 2-day window most of the watchlist is
// silent on any given day, so this is a count, not a roll-call: one quiet
// source is normal, a source quiet for weeks is a registry problem, and that
// judgment needs history — `npm run scout:stats -- --health` has it.
const silent = [...yielded.entries()].filter(([, n]) => n === 0).length;
if (silent) {
  console.log(
    `\n${silent} of ${yielded.size} reached sources published nothing in the window ` +
      `(normal at 2 days — 'npm run scout:stats -- --health' names the ones silent for weeks).`
  );
}
