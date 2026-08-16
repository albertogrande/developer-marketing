// scout-stats exists to make corpus claims checkable, so the things it could
// get quietly wrong are the things worth pinning: double-counting an event that
// appears in two week files (the bug that made a 1,150-event corpus report
// 1,184), and mis-joining a published signal to the source that captured it.
// Both fail silently — the number just comes out flattering.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const STATS = join(process.cwd(), 'scripts', 'scout-stats.mjs');
const { eventId } = await import('./lib/scout-sources.mjs');

// The id is the hash of the normalized URL, not a label — the yield join
// depends on that, so fixtures derive it the same way the sweep does.
const event = (over = {}) => {
  const url = over.url ?? 'https://x.dev/a';
  return {
    ts: '2026-08-10T09:00:00.000Z',
    week: '2026-W33',
    source: 'show-hn',
    channel: 'hn',
    title: 'Show HN: a thing',
    entities: [],
    topics: [],
    ...over,
    url,
    id: over.id ?? eventId(url),
  };
};

/** Run the tool against a throwaway repo root holding a DB and some signals. */
function stats(files, args, { signals = [], entities = {} } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'scout-stats-'));
  try {
    mkdirSync(join(root, 'signals/db'), { recursive: true });
    for (const [name, records] of Object.entries(files)) {
      writeFileSync(join(root, 'signals/db', name), records.map((r) => JSON.stringify(r)).join('\n') + '\n');
    }
    writeFileSync(join(root, 'signals/entities.json'), JSON.stringify(entities));
    if (signals.length) {
      mkdirSync(join(root, 'src/content/signals'), { recursive: true });
      for (const [i, url] of signals.entries()) {
        writeFileSync(join(root, 'src/content/signals', `s${i}.md`), `---\ntitle: A signal\nsource:\n  label: 'x'\n  url: ${url}\n---\n\nBody.\n`);
      }
    }
    return execFileSync('node', [STATS, ...args], { cwd: root, encoding: 'utf8' });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('an id present in two week files is one event, not two', () => {
  // Exactly the leerob shape: a sitemap restamps the URL, so the same id lands
  // in a later week file with a newer ts.
  const out = stats(
    {
      '2026-W32.ndjson': [event({ id: 'dup', ts: '2026-08-06T00:00:00.000Z', week: '2026-W32', source: 'leerob' })],
      '2026-W33.ndjson': [
        event({ id: 'dup', ts: '2026-08-12T00:00:00.000Z', week: '2026-W33', source: 'leerob' }),
        event({ id: 'other', source: 'show-hn' }),
      ],
    },
    ['--by', 'source']
  );
  assert.match(out, /2\s+events matched/, 'two distinct events, not three');
  assert.match(out, /leerob\s+1\b/);
});

test('enrichment lines merge onto their event instead of counting as events', () => {
  const out = stats(
    {
      '2026-W33.ndjson': [event({ id: 'a1' }), { id: 'a1', topics: ['pricing'], event: 'pricing' }],
    },
    ['--by', 'topic']
  );
  assert.match(out, /pricing\s+1\b/);
  assert.match(out, /only 1 of 1 event\(s\) carry any topic/);
});

test('array facets say plainly that they do not sum to the event count', () => {
  const out = stats(
    {
      '2026-W33.ndjson': [
        event({ id: 'a1' }),
        { id: 'a1', topics: ['pricing', 'plg'] },
        event({ id: 'a2', url: 'https://x.dev/b' }),
      ],
    },
    ['--by', 'topic']
  );
  // Two topic rows over one tagged event out of two.
  assert.match(out, /topic is multi-valued/);
  assert.match(out, /only 1 of 2 event\(s\)/);
});

test('yield joins a published signal to the source that captured it, by normalized url', () => {
  const out = stats(
    {
      '2026-W33.ndjson': [
        event({ source: 'vercel-blog', channel: 'rss', url: 'https://vercel.com/changelog/thing' }),
        event({ source: 'show-hn', url: 'https://x.dev/unpublished' }),
      ],
    },
    ['--yield'],
    // The tracking param must not break the join — that is what normalizeUrl is for.
    { signals: ['https://vercel.com/changelog/thing?utm_source=newsletter'] }
  );
  assert.match(out, /vercel-blog\s+1\s+1\s+100\.0%/);
  assert.match(out, /show-hn\s+1\s+0\s+0\.0%/);
  assert.match(out, /0 did not match any captured event/);
});

test('a signal sourced outside the watchlist is reported, not silently dropped', () => {
  const out = stats(
    { '2026-W33.ndjson': [event()] },
    ['--yield'],
    { signals: ['https://somewhere-unwatched.example/post'] }
  );
  assert.match(out, /1 did not match any captured event/);
});

test('health names a registered source that has never produced an event', () => {
  const out = stats({ '2026-W33.ndjson': [event({ source: 'show-hn' })] }, ['--health']);
  // Every RSS source in the real registry is absent from this fixture DB.
  assert.match(out, /never produced an event/);
  assert.match(out, /channels registered but empty: reddit, bluesky/);
});

test('auto-entities are derived at read time, so --auto reaches unenriched events', () => {
  const reg = { vercel: { name: 'Vercel', kind: 'company', aliases: [] } };
  const db = { '2026-W33.ndjson': [event({ title: 'Vercel ships Agent Plugins' })] };
  const curated = stats(db, ['--by', 'entity'], { entities: reg });
  assert.match(curated, /0 group\(s\)/, 'nothing is curated, so the curated facet is empty');
  const auto = stats(db, ['--by', 'entity', '--auto'], { entities: reg });
  assert.match(auto, /vercel\s+1\b/, 'the same event is reachable once auto-tags are included');
});

test('bad arguments are errors, not empty reports', () => {
  const bad = [
    ['--by', 'nonsense'],
    ['--by', 'source', '--match', '(unclosed'],
    ['--by', 'source', '--top', 'lots'],
    ['--health', '--weeks', '-1'],
  ];
  for (const args of bad) {
    assert.throws(
      () => stats({ '2026-W33.ndjson': [event()] }, args),
      (e) => e.status === 2,
      `${args.join(' ')} should exit 2`
    );
  }
});
