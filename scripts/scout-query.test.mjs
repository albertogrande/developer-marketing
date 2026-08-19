// The query tool is how both the editor and the /intel skill read the event
// DB, so a filter that silently matches nothing is worse than a crash: the
// answer comes back as "a quiet week" instead of "you asked wrong". --source
// is the one filter that takes a list, and the list form is what the weekly
// practice sweep depends on.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const QUERY = join(process.cwd(), 'scripts', 'scout-query.mjs');
const { eventId } = await import('./lib/scout-sources.mjs');

const event = (over = {}) => {
  const url = over.url ?? 'https://x.dev/a';
  return {
    ts: '2026-08-18T09:00:00.000Z',
    week: '2026-W34',
    source: 'show-hn',
    channel: 'hn',
    title: 'A thing',
    entities: [],
    topics: [],
    ...over,
    url,
    id: over.id ?? eventId(url),
  };
};

function query(records, args) {
  const root = mkdtempSync(join(tmpdir(), 'scout-query-'));
  try {
    mkdirSync(join(root, 'signals/db'), { recursive: true });
    writeFileSync(
      join(root, 'signals/db', '2026-W34.ndjson'),
      records.map((r) => JSON.stringify(r)).join('\n') + '\n'
    );
    writeFileSync(join(root, 'signals/entities.json'), '{}');
    return execFileSync('node', [QUERY, ...args], { cwd: root, encoding: 'utf8' });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const CORPUS = [
  event({ url: 'https://x.dev/hn', source: 'show-hn', title: 'From HN' }),
  event({ url: 'https://x.dev/mkt1', source: 'mkt1', title: 'From MKT1' }),
  event({ url: 'https://x.dev/hb', source: 'heavybit', title: 'From Heavybit' }),
];

test('--source matches one id exactly, as it always has', () => {
  const out = query(CORPUS, ['--source', 'mkt1']);
  assert.match(out, /From MKT1/);
  assert.doesNotMatch(out, /From HN|From Heavybit/);
});

test('--source takes a comma-separated list, so the practice sweep is one query', () => {
  const out = query(CORPUS, ['--source', 'mkt1,heavybit']);
  assert.match(out, /From MKT1/);
  assert.match(out, /From Heavybit/);
  assert.doesNotMatch(out, /From HN/, 'a source outside the list must not leak in');
});

test('spaces around the commas are tolerated — the list is written by hand', () => {
  const out = query(CORPUS, ['--source', 'mkt1, heavybit']);
  assert.match(out, /From MKT1/);
  assert.match(out, /From Heavybit/);
});

test('no --source still returns everything', () => {
  const out = query(CORPUS, []);
  for (const t of ['From HN', 'From MKT1', 'From Heavybit']) assert.match(out, new RegExp(t));
});
