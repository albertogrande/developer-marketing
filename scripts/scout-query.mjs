#!/usr/bin/env node
// The intelligence reader: filter the scout's event DB from the command line.
// Plain Node over NDJSON — no jq, no database; the /intel skill and the
// weekly editor both drive it, and a human can too.
//
//   npm run scout:query                              # everything, newest first
//   npm run scout:query -- --since 2026-08-01 --until 2026-08-07
//   npm run scout:query -- --entity vercel           # slug or alias
//   npm run scout:query -- --event pricing --topic plg
//   npm run scout:query -- --channel hn --source show-hn
//   npm run scout:query -- --text "launch week"      # title+summary substring
//   npm run scout:query -- --json                    # NDJSON out (merged records)
//   npm run scout:query -- --count                   # totals by channel/event
//
// Exit 0 with results (or none); 2 on bad arguments.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { readDb } from './lib/scout-sources.mjs';

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(name);
  return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : undefined;
};
const has = (name) => argv.includes(name);

const SINCE = flag('--since');
const UNTIL = flag('--until');
for (const [label, v] of [['--since', SINCE], ['--until', UNTIL]]) {
  if (v && Number.isNaN(new Date(v).getTime())) {
    console.error(`scout-query: ${label} "${v}" is not a date`);
    process.exit(2);
  }
}
const ENTITY = flag('--entity');
const EVENT = flag('--event');
const TOPIC = flag('--topic');
const CHANNEL = flag('--channel');
const SOURCE = flag('--source');
const TEXT = flag('--text')?.toLowerCase();
const JSON_OUT = has('--json');
const COUNT = has('--count');

// Resolve an alias to its slug so `--entity claude` finds `anthropic`.
let entitySlug = ENTITY;
const ENTITIES_FILE = 'signals/entities.json';
if (ENTITY && existsSync(ENTITIES_FILE)) {
  const reg = JSON.parse(readFileSync(ENTITIES_FILE, 'utf8'));
  if (!reg[ENTITY]) {
    const hit = Object.entries(reg).find(
      ([slug, e]) => !slug.startsWith('_') && (e.aliases ?? []).includes(ENTITY.toLowerCase())
    );
    if (hit) entitySlug = hit[0];
  }
}

const files = existsSync('signals/db')
  ? readdirSync('signals/db').filter((f) => f.endsWith('.ndjson')).sort().map((f) => `signals/db/${f}`)
  : [];

const events = [];
for (const file of files) for (const rec of readDb(readFileSync(file, 'utf8')).values()) events.push(rec);

const wanted = events
  .filter((e) => !SINCE || e.ts >= new Date(SINCE).toISOString())
  .filter((e) => !UNTIL || e.ts <= new Date(`${UNTIL}T23:59:59Z`).toISOString())
  .filter((e) => !entitySlug || (e.entities ?? []).includes(entitySlug))
  .filter((e) => !EVENT || e.event === EVENT)
  .filter((e) => !TOPIC || (e.topics ?? []).includes(TOPIC))
  .filter((e) => !CHANNEL || e.channel === CHANNEL)
  .filter((e) => !SOURCE || e.source === SOURCE)
  .filter((e) => !TEXT || `${e.title} ${e.summary ?? ''}`.toLowerCase().includes(TEXT))
  .sort((a, b) => b.ts.localeCompare(a.ts));

if (COUNT) {
  const tally = (key) => {
    const m = new Map();
    for (const e of wanted) {
      const k = e[key] ?? '(none)';
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  console.log(`${wanted.length} event(s)`);
  console.log('\nby channel:');
  for (const [k, n] of tally('channel')) console.log(`  ${String(n).padStart(4)}  ${k}`);
  console.log('\nby event kind:');
  for (const [k, n] of tally('event')) console.log(`  ${String(n).padStart(4)}  ${k}`);
} else if (JSON_OUT) {
  for (const e of wanted) console.log(JSON.stringify(e));
} else {
  for (const e of wanted) {
    const tags = [
      e.event && `event:${e.event}`,
      (e.entities ?? []).length && `entities:${e.entities.join(',')}`,
      (e.topics ?? []).length && `topics:${e.topics.join(',')}`,
    ]
      .filter(Boolean)
      .join(' · ');
    console.log(`${e.ts.slice(0, 10)} [${e.source}] ${e.title}`);
    if (e.summary) console.log(`    ${e.summary.length > 160 ? e.summary.slice(0, 159) + '…' : e.summary}`);
    console.log(`    ${e.url}${tags ? `\n    ${tags}` : ''}`);
  }
  console.log(`\n${wanted.length} event(s).`);
}
