#!/usr/bin/env node
// The model's only write path into the event DB. The scout never edits
// signals/db/*.ndjson by hand — malformed JSON would corrupt the replay —
// it hands this tool a patch and the tool appends validated, merged lines
// (append-only enrichment: a later line with the same id wins on replay).
//
//   npm run scout:enrich -- --patch <file.json>     # or - for stdin
//     [{ "id": "abc123", "entities": ["stripe"], "event": "pricing", "topics": ["plg"] }]
//
//   npm run scout:enrich -- --add <file.json>       # out-of-watchlist finds
//     [{ "title": "...", "url": "https://...", "ts": "2026-08-06T10:00:00Z",
//        "summary": "...", "source": "websearch", "channel": "search" }]
//
//   npm run scout:enrich -- --new-entities <file.json>
//     { "acme": { "name": "Acme", "kind": "company", "aliases": ["acme.dev"] } }
//
// Exit 0 on success, 1 on any validation error (nothing is written on error
// — a partial enrichment is worse than none), 2 on bad arguments.

import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  CHANNELS,
  EVENT_KINDS,
  ENTITY_KINDS,
  normalizeEvent,
  readDb,
  dbFileFor,
} from './lib/scout-sources.mjs';

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(name);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : undefined;
};

const PATCH = flag('--patch');
const ADD = flag('--add');
const NEW_ENTITIES = flag('--new-entities');
if (!PATCH && !ADD && !NEW_ENTITIES) {
  console.error('scout-enrich: pass --patch <file>, --add <file>, or --new-entities <file> (use - for stdin)');
  process.exit(2);
}

const readInput = async (spec) => {
  const raw = spec === '-' ? await readFile(0, 'utf8') : await readFile(spec, 'utf8');
  return JSON.parse(raw);
};

const ENTITIES_FILE = 'signals/entities.json';
const loadEntities = () => (existsSync(ENTITIES_FILE) ? JSON.parse(readFileSync(ENTITIES_FILE, 'utf8')) : {});

const problems = [];

// --- register new entities first, so a patch may use them in the same run --
if (NEW_ENTITIES) {
  const additions = await readInput(NEW_ENTITIES);
  const reg = loadEntities();
  const allAliases = new Set(
    Object.entries(reg).flatMap(([slug, e]) => (slug.startsWith('_') ? [] : e.aliases ?? []))
  );
  for (const [slug, ent] of Object.entries(additions)) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) problems.push(`entity slug "${slug}" is not kebab-case`);
    else if (reg[slug]) problems.push(`entity "${slug}" already registered`);
    if (!ent?.name) problems.push(`entity "${slug}" missing name`);
    if (!ENTITY_KINDS.includes(ent?.kind)) problems.push(`entity "${slug}" has bad kind "${ent?.kind}"`);
    for (const a of ent?.aliases ?? []) {
      if (allAliases.has(a)) problems.push(`entity "${slug}" alias "${a}" already taken`);
      allAliases.add(a);
    }
  }
  if (!problems.length) {
    const merged = { ...reg, ...Object.fromEntries(Object.entries(additions).map(([s, e]) => [s, { aliases: [], ...e }])) };
    await writeFile(ENTITIES_FILE, JSON.stringify(merged, null, 2) + '\n', 'utf8');
    console.log(`scout-enrich: registered ${Object.keys(additions).length} entit${Object.keys(additions).length === 1 ? 'y' : 'ies'}.`);
  }
}

// --- load the whole DB once (patches may target any week) -------------------
const dbFiles = existsSync('signals/db')
  ? readdirSync('signals/db').filter((f) => f.endsWith('.ndjson')).map((f) => `signals/db/${f}`)
  : [];
const byId = new Map();
const fileOf = new Map();
for (const file of dbFiles) {
  for (const [id, rec] of readDb(readFileSync(file, 'utf8'))) {
    byId.set(id, rec);
    fileOf.set(id, file);
  }
}
const entities = loadEntities();
const knownEntity = (slug) => Object.hasOwn(entities, slug) && !slug.startsWith('_');

// --- --patch: enrichment lines ----------------------------------------------
if (PATCH && !problems.length) {
  const patches = await readInput(PATCH);
  if (!Array.isArray(patches)) problems.push('--patch input must be a JSON array');
  const lines = new Map(); // file → lines
  for (const p of Array.isArray(patches) ? patches : []) {
    if (!p?.id || !byId.has(p.id)) {
      problems.push(`patch id "${p?.id}" not found in the DB`);
      continue;
    }
    for (const e of p.entities ?? []) if (!knownEntity(e)) problems.push(`patch ${p.id}: unknown entity "${e}" (register it with --new-entities)`);
    if (p.event !== undefined && !EVENT_KINDS.includes(p.event)) problems.push(`patch ${p.id}: bad event "${p.event}"`);
    if (p.topics !== undefined && !Array.isArray(p.topics)) problems.push(`patch ${p.id}: topics must be an array`);
    const extra = Object.keys(p).filter((k) => !['id', 'entities', 'event', 'topics'].includes(k));
    if (extra.length) problems.push(`patch ${p.id}: unexpected field(s) ${extra.join(', ')}`);
    const file = fileOf.get(p.id);
    if (!lines.has(file)) lines.set(file, []);
    lines.get(file).push(JSON.stringify({ id: p.id, ...(p.entities ? { entities: p.entities } : {}), ...(p.event ? { event: p.event } : {}), ...(p.topics ? { topics: p.topics } : {}) }));
  }
  if (!problems.length) {
    for (const [file, ls] of lines) await appendFile(file, ls.join('\n') + '\n', 'utf8');
    console.log(`scout-enrich: appended ${[...lines.values()].flat().length} enrichment line(s).`);
  }
}

// --- --add: out-of-watchlist events -----------------------------------------
if (ADD && !problems.length) {
  const raw = await readInput(ADD);
  const items = Array.isArray(raw) ? raw : [raw];
  const fresh = [];
  for (const item of items) {
    if (!item?.title || !item?.url) {
      problems.push(`add: every event needs title and url (${JSON.stringify(item).slice(0, 80)})`);
      continue;
    }
    const channel = item.channel ?? 'search';
    if (!CHANNELS.includes(channel)) problems.push(`add: bad channel "${channel}"`);
    const ev = normalizeEvent({
      ts: item.ts ?? new Date(),
      source: item.source ?? 'websearch',
      channel,
      title: item.title,
      url: item.url,
      summary: item.summary,
      author: item.author,
    });
    if (byId.has(ev.id)) continue; // already captured — silently fine
    for (const e of item.entities ?? []) if (!knownEntity(e)) problems.push(`add ${ev.id}: unknown entity "${e}"`);
    if (item.event !== undefined && !EVENT_KINDS.includes(item.event)) problems.push(`add ${ev.id}: bad event "${item.event}"`);
    fresh.push({ ...ev, ...(item.entities ? { entities: item.entities } : {}), ...(item.event ? { event: item.event } : {}), ...(item.topics ? { topics: item.topics } : {}) });
  }
  if (!problems.length && fresh.length) {
    const byFile = new Map();
    for (const ev of fresh) {
      const file = dbFileFor(new Date(ev.ts));
      if (!byFile.has(file)) byFile.set(file, []);
      byFile.get(file).push(JSON.stringify(ev));
    }
    for (const [file, ls] of byFile) {
      await mkdir(dirname(file), { recursive: true });
      await appendFile(file, ls.join('\n') + '\n', 'utf8');
    }
  }
  if (!problems.length) console.log(`scout-enrich: added ${fresh.length} event(s).`);
}

if (problems.length) {
  console.error('scout-enrich: nothing written —');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
