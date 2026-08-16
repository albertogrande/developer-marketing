#!/usr/bin/env node
// Corpus statistics over the scout's event DB — the shape of the whole log,
// not one row of it.
//
// Why this exists: scout-query answers "which events match?", and its --count
// tallies exactly two hardcoded scalar fields. Every corpus-level question the
// DB was built to answer — which sources earn their place, what language is
// moving in the tail, which registered entity has gone quiet — needed a
// throwaway `--json | node -e` pipeline instead, which the /intel skill
// documents as the workaround and the scout workflow's Bash allow-list does
// not permit. So the analysis either did not happen or happened off the books.
//
// This tool is the on-the-books version. It answers three shapes of question:
//
//   --by <field>   distribution: group and count, arrays included
//   --yield        which sources actually reach published Signals
//   --health       which registered sources have gone silent
//
//   npm run scout:stats -- --by source --top 15
//   npm run scout:stats -- --by topic --since 2026-08-01
//   npm run scout:stats -- --by day --channel hn
//   npm run scout:stats -- --match 'for (ai )?agents?' --by week
//   npm run scout:stats -- --yield
//   npm run scout:stats -- --health --weeks 4
//
// Every filter scout-query accepts works here too, so a distribution can be
// taken over any slice. Exit 0 with results (or none); 2 on bad arguments.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import {
  SOURCES,
  SITEMAPS,
  CRAWLS,
  TOPICS,
  normalizeUrl,
  eventId,
  readDbFiles,
  attachAutoEntities,
  DB_FILE_RE,
} from './lib/scout-sources.mjs';
import { PODCASTS } from './lib/podcasts.mjs';

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(name);
  return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : undefined;
};
const has = (name) => argv.includes(name);

// Group-by keys. Scalars read a field; the array keys fan out, so one event
// with three topics counts once per topic — the total under an array facet is
// deliberately not the event count, and the report says so.
const SCALAR_KEYS = ['source', 'channel', 'week', 'day', 'author', 'event'];
const ARRAY_KEYS = ['entity', 'topic'];
const BY_KEYS = [...SCALAR_KEYS, ...ARRAY_KEYS];

const BY = flag('--by');
const positive = (name, fallback) => {
  const raw = flag(name);
  if (raw === undefined) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    console.error(`scout-stats: ${name} must be a positive number, got "${raw}"`);
    process.exit(2);
  }
  return n;
};
const TOP = positive('--top', 20);
const WEEKS = positive('--weeks', 3);
const YIELD = has('--yield');
const HEALTH = has('--health');
const JSON_OUT = has('--json');
const AUTO = has('--auto');

if (BY && !BY_KEYS.includes(BY)) {
  console.error(`scout-stats: --by "${BY}" is not a field. Try: ${BY_KEYS.join(', ')}`);
  process.exit(2);
}
if (!BY && !YIELD && !HEALTH) {
  console.error('scout-stats: pass --by <field>, --yield, or --health (--help lists the fields)');
  console.error(`  fields: ${BY_KEYS.join(', ')}`);
  process.exit(2);
}

// --- filters, the same set scout-query takes ---------------------------------

const SINCE = flag('--since');
const UNTIL = flag('--until');
for (const [label, v] of [['--since', SINCE], ['--until', UNTIL]]) {
  if (v && Number.isNaN(new Date(v).getTime())) {
    console.error(`scout-stats: ${label} "${v}" is not a date`);
    process.exit(2);
  }
}
const ENTITY = flag('--entity');
const EVENT = flag('--event');
const TOPIC = flag('--topic');
const CHANNEL = flag('--channel');
const SOURCE = flag('--source');
const TEXT = flag('--text')?.toLowerCase();
const MATCH = flag('--match');

let matcher;
if (MATCH) {
  try {
    matcher = new RegExp(MATCH, 'i');
  } catch (e) {
    console.error(`scout-stats: --match is not a valid regular expression (${e.message})`);
    process.exit(2);
  }
}

const ENTITIES_FILE = 'signals/entities.json';
const registry = existsSync(ENTITIES_FILE) ? JSON.parse(readFileSync(ENTITIES_FILE, 'utf8')) : {};
let entitySlug = ENTITY;
if (ENTITY && !registry[ENTITY]) {
  const hit = Object.entries(registry).find(
    ([slug, e]) => !slug.startsWith('_') && (e.aliases ?? []).includes(ENTITY.toLowerCase())
  );
  if (hit) entitySlug = hit[0];
}

// --- load ---------------------------------------------------------------------

const dbFiles = existsSync('signals/db')
  ? readdirSync('signals/db').filter((f) => DB_FILE_RE.test(f)).sort().map((f) => `signals/db/${f}`)
  : [];
if (!dbFiles.length) {
  console.error('scout-stats: no event log found at signals/db/*.ndjson — run npm run scout:sweep first');
  process.exit(1);
}

const { byId } = readDbFiles(dbFiles, { read: (f) => readFileSync(f, 'utf8') });
const events = attachAutoEntities([...byId.values()], registry);

// Curated entities carry authority; auto-tags carry coverage. --auto folds the
// two together for filtering and faceting, and every report that uses it says
// so, because a count over auto-tags is a count over a substring match.
const entitiesOf = (e) => (AUTO ? [...new Set([...(e.entities ?? []), ...(e.entitiesAuto ?? [])])] : e.entities ?? []);

const wanted = events
  .filter((e) => e.ts && e.title)
  .filter((e) => !SINCE || e.ts >= new Date(SINCE).toISOString())
  .filter((e) => !UNTIL || e.ts <= new Date(`${UNTIL}T23:59:59Z`).toISOString())
  .filter((e) => !entitySlug || entitiesOf(e).includes(entitySlug))
  .filter((e) => !EVENT || e.event === EVENT)
  .filter((e) => !TOPIC || (e.topics ?? []).includes(TOPIC))
  .filter((e) => !CHANNEL || e.channel === CHANNEL)
  .filter((e) => !SOURCE || e.source === SOURCE)
  .filter((e) => !TEXT || `${e.title} ${e.summary ?? ''}`.toLowerCase().includes(TEXT))
  .filter((e) => !matcher || matcher.test(`${e.title} ${e.summary ?? ''}`));

const pad = (s, n) => String(s).padEnd(n);
const num = (n, w = 6) => String(n).padStart(w);

// --- --by: distributions ------------------------------------------------------

const valuesFor = (e, key) => {
  switch (key) {
    case 'day':
      return [e.ts.slice(0, 10)];
    case 'entity':
      return entitiesOf(e);
    case 'topic':
      return e.topics ?? [];
    default:
      return [e[key] ?? '(none)'];
  }
};

if (BY) {
  const tally = new Map();
  let tagged = 0;
  for (const e of wanted) {
    const vals = valuesFor(e, BY);
    if (ARRAY_KEYS.includes(BY) && vals.length) tagged++;
    for (const v of vals) tally.set(v, (tally.get(v) ?? 0) + 1);
  }
  // Chronological keys read as a series; everything else ranks by size.
  const rows =
    BY === 'day' || BY === 'week'
      ? [...tally.entries()].sort((a, b) => a[0].localeCompare(b[0]))
      : [...tally.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const shown = BY === 'day' || BY === 'week' ? rows : rows.slice(0, TOP);

  if (JSON_OUT) {
    console.log(JSON.stringify({ by: BY, events: wanted.length, groups: rows.map(([k, n]) => ({ key: k, events: n })) }, null, 2));
  } else {
    const width = Math.max(BY.length, ...shown.map(([k]) => String(k).length), 12);
    console.log(`${pad(BY, width)}  events   share`);
    console.log('-'.repeat(width + 17));
    const denom = wanted.length || 1;
    for (const [k, n] of shown) console.log(`${pad(k, width)}  ${num(n)}  ${num(((100 * n) / denom).toFixed(1), 5)}%`);
    console.log('-'.repeat(width + 17));
    console.log(`${pad(`${rows.length} group(s)`, width)}  ${num(wanted.length)}   events matched`);
    if (rows.length > shown.length) console.log(`\n  ${rows.length - shown.length} more group(s) below the top ${TOP} — raise --top to see them.`);
    if (ARRAY_KEYS.includes(BY)) {
      console.log(
        `\n  ${BY} is multi-valued: rows sum above the event count, and only ${tagged} of ${wanted.length} ` +
          `event(s) carry any ${BY} at all.`
      );
      if (BY === 'entity' && !AUTO) console.log('  Curated entities only — pass --auto to include the sweep\'s deterministic matches.');
      if (BY === 'topic') {
        const unused = TOPICS.filter((t) => !tally.has(t));
        if (unused.length) console.log(`  Never used in this slice (${unused.length}): ${unused.join(', ')}`);
      }
    }
  }
}

// --- --yield: capture vs publication -----------------------------------------
//
// The question the watchlist cannot answer about itself: a source producing
// 600 events and a source producing 6 look the same in a volume count, and
// opposite in an editorial one. Joins each published signal back to the event
// that captured it, by normalized URL.

if (YIELD) {
  const SIGNALS_DIR = 'src/content/signals';
  const published = [];
  if (existsSync(SIGNALS_DIR)) {
    for (const f of readdirSync(SIGNALS_DIR).filter((f) => f.endsWith('.md'))) {
      const text = readFileSync(`${SIGNALS_DIR}/${f}`, 'utf8');
      // The signal's primary source url, inside the frontmatter's source block.
      const m = text.match(/^\s*url:\s*["']?(https?:\/\/\S+?)["']?\s*$/m);
      if (m) published.push({ file: f, url: normalizeUrl(m[1]) });
    }
  }
  const sourceOfSignal = new Map();
  let unmatched = 0;
  for (const p of published) {
    const ev = byId.get(eventId(p.url));
    if (!ev) {
      unmatched++;
      continue;
    }
    sourceOfSignal.set(p.file, ev.source);
  }

  const vol = new Map();
  for (const e of wanted) vol.set(e.source, (vol.get(e.source) ?? 0) + 1);
  const promoted = new Map();
  for (const s of sourceOfSignal.values()) promoted.set(s, (promoted.get(s) ?? 0) + 1);

  const rows = [...vol.entries()]
    .map(([source, n]) => ({ source, events: n, signals: promoted.get(source) ?? 0 }))
    .map((r) => ({ ...r, yield: r.events ? (100 * r.signals) / r.events : 0 }))
    .sort((a, b) => b.yield - a.yield || b.signals - a.signals || b.events - a.events);

  if (JSON_OUT) {
    console.log(JSON.stringify({ sources: rows, unmatchedSignals: unmatched }, null, 2));
  } else {
    const width = Math.max(22, ...rows.map((r) => r.source.length));
    console.log(`${pad('source', width)}  events  signals   yield`);
    console.log('-'.repeat(width + 26));
    for (const r of rows) console.log(`${pad(r.source, width)}  ${num(r.events)}  ${num(r.signals, 7)}  ${num(r.yield.toFixed(1), 6)}%`);
    console.log('-'.repeat(width + 26));
    console.log(`${pad(`${rows.length} source(s)`, width)}  ${num(wanted.length)}  ${num(sourceOfSignal.size, 7)}`);
    console.log(
      `\n  ${published.length} published signal(s) read; ${unmatched} did not match any captured event ` +
        `(found by search rather than the watchlist, or published before the DB began).`
    );
    console.log('  Yield is evidence for a keep/cut decision, never an automatic one: a narrow');
    console.log('  source that publishes monthly is doing its job when it is quiet.');
  }
}

// --- --health: registered vs actually producing -------------------------------

if (HEALTH) {
  const registered = [
    ...SOURCES.map((s) => ({ id: s.id, kind: s.kind, how: 'rss' })),
    ...PODCASTS.map((p) => ({ id: p.id, kind: 'podcast', how: 'rss' })),
    ...SITEMAPS.map((s) => ({ id: s.id, kind: s.kind, how: 'sitemap' })),
    ...CRAWLS.map((s) => ({ id: s.id, kind: s.kind, how: 'crawl' })),
  ];
  const lastSeen = new Map();
  const counts = new Map();
  for (const e of events) {
    if (!e.source || !e.ts) continue;
    counts.set(e.source, (counts.get(e.source) ?? 0) + 1);
    if (!lastSeen.has(e.source) || e.ts > lastSeen.get(e.source)) lastSeen.set(e.source, e.ts);
  }
  const cutoff = new Date(Date.now() - WEEKS * 7 * 86400e3).toISOString();

  const rows = registered
    .map((r) => ({ ...r, events: counts.get(r.id) ?? 0, last: lastSeen.get(r.id) ?? null }))
    .sort((a, b) => a.events - b.events || a.id.localeCompare(b.id));
  const quiet = rows.filter((r) => !r.last || r.last < cutoff);

  if (JSON_OUT) {
    console.log(JSON.stringify({ weeks: WEEKS, sources: rows }, null, 2));
  } else {
    const width = Math.max(22, ...rows.map((r) => r.id.length));
    console.log(`${pad('source', width)}  events   last event`);
    console.log('-'.repeat(width + 24));
    for (const r of rows) console.log(`${pad(r.id, width)}  ${num(r.events)}   ${r.last ? r.last.slice(0, 10) : 'never'}`);
    console.log('-'.repeat(width + 24));
    console.log(`${pad(`${rows.length} registered source(s)`, width)}  ${num(rows.reduce((a, r) => a + r.events, 0))}`);

    // Channels registered in the sweep that have produced nothing at all are a
    // different failure from a quiet blog: the docs claim coverage there.
    const deadChannels = ['reddit', 'bluesky'].filter((c) => !events.some((e) => e.channel === c));
    console.log('');
    if (quiet.length) {
      console.log(`silent for ${WEEKS}+ week(s) (${quiet.length}) — check the feed, then decide:`);
      for (const r of quiet) console.log(`  - ${pad(r.id, width)} ${r.last ? `last ${r.last.slice(0, 10)}` : 'never produced an event'}`);
    } else {
      console.log(`Every registered source has produced an event within ${WEEKS} week(s).`);
    }
    if (deadChannels.length) {
      console.log(
        `\nchannels registered but empty: ${deadChannels.join(', ')} — the sweep runs these jobs every day ` +
          `and they 403 from CI. Fix the fetch or say plainly that the channel is dark; do not let the ` +
          `watchlist advertise reach it does not have.`
      );
    }
    const db = events.filter((e) => e.title);
    const enriched = db.filter((e) => e.event || (e.entities ?? []).length || (e.topics ?? []).length).length;
    const auto = db.filter((e) => (e.entitiesAuto ?? []).length).length;
    console.log(
      `\nenrichment: ${enriched}/${db.length} event(s) curated by the model ` +
        `(${((100 * enriched) / (db.length || 1)).toFixed(1)}%), ${auto} carrying deterministic entity tags ` +
        `(${((100 * auto) / (db.length || 1)).toFixed(1)}%).`
    );
  }
}
