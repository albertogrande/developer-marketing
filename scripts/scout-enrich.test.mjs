// The `-` (stdin) modes were unusable for two days without anyone noticing:
// `readFile(0, 'utf8')` rejects with ERR_INVALID_ARG_TYPE, and because the
// scout's workaround was "write a temp file first" the tool still appeared to
// work. So what is pinned here is the pipe itself — that a patch arriving on
// stdin lands the same line a patch arriving as a file does, and that the
// failure modes stdin adds (empty input, two `-` flags in one run) say what is
// wrong instead of surfacing as a JSON parse error.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ENRICH = join(process.cwd(), 'scripts', 'scout-enrich.mjs');
const { eventId } = await import('./lib/scout-sources.mjs');

const URL_A = 'https://acme.dev/blog/pricing';
const ID_A = eventId(URL_A);

/** A throwaway repo root holding one week file and one registered entity. */
function repo() {
  const root = mkdtempSync(join(tmpdir(), 'scout-enrich-'));
  mkdirSync(join(root, 'signals/db'), { recursive: true });
  writeFileSync(
    join(root, 'signals/db', '2026-W33.ndjson'),
    JSON.stringify({
      id: ID_A,
      ts: '2026-08-10T09:00:00.000Z',
      week: '2026-W33',
      source: 'acme-blog',
      channel: 'rss',
      title: 'Acme changes its pricing',
      url: URL_A,
    }) + '\n'
  );
  writeFileSync(
    join(root, 'signals/entities.json'),
    JSON.stringify({ acme: { name: 'Acme', kind: 'company', aliases: ['acme.dev'] } }, null, 2) + '\n'
  );
  return root;
}

/** Run the tool, returning { status, stdout, stderr } rather than throwing. */
function enrich(root, args, input) {
  try {
    const stdout = execFileSync('node', [ENRICH, ...args], { cwd: root, encoding: 'utf8', input });
    return { status: 0, stdout, stderr: '' };
  } catch (err) {
    return { status: err.status, stdout: err.stdout ?? '', stderr: err.stderr ?? '' };
  }
}

const dbLines = (root) =>
  readFileSync(join(root, 'signals/db', '2026-W33.ndjson'), 'utf8')
    .trim()
    .split('\n')
    .map((l) => JSON.parse(l));

test('--patch - reads the patch from stdin and appends the enrichment line', () => {
  const root = repo();
  try {
    const patch = [{ id: ID_A, entities: ['acme'], event: 'pricing', topics: ['pricing'] }];
    const run = enrich(root, ['--patch', '-'], JSON.stringify(patch));
    assert.equal(run.status, 0, run.stderr);
    const lines = dbLines(root);
    assert.equal(lines.length, 2);
    assert.deepEqual(lines[1], { id: ID_A, entities: ['acme'], event: 'pricing', topics: ['pricing'] });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('stdin and a file produce byte-identical enrichment lines', () => {
  const patch = JSON.stringify([{ id: ID_A, entities: ['acme'], event: 'pricing' }]);
  const viaStdin = repo();
  const viaFile = repo();
  try {
    assert.equal(enrich(viaStdin, ['--patch', '-'], patch).status, 0);
    writeFileSync(join(viaFile, 'patch.json'), patch);
    assert.equal(enrich(viaFile, ['--patch', 'patch.json']).status, 0);
    assert.deepEqual(dbLines(viaStdin), dbLines(viaFile));
  } finally {
    rmSync(viaStdin, { recursive: true, force: true });
    rmSync(viaFile, { recursive: true, force: true });
  }
});

test('--new-entities - registers through stdin, and the same run may not pipe twice', () => {
  const root = repo();
  try {
    const run = enrich(root, ['--new-entities', '-'], JSON.stringify({ bolt: { name: 'Bolt', kind: 'company' } }));
    assert.equal(run.status, 0, run.stderr);
    const reg = JSON.parse(readFileSync(join(root, 'signals/entities.json'), 'utf8'));
    assert.equal(reg.bolt.name, 'Bolt');
    assert.deepEqual(reg.bolt.aliases, []);

    // Two `-` flags cannot both be served: refuse at argument time (exit 2)
    // rather than let the second read an empty stream.
    const twice = enrich(root, ['--new-entities', '-', '--patch', '-'], '{}');
    assert.equal(twice.status, 2);
    assert.match(twice.stderr, /only one input can be stdin/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('empty and malformed stdin fail as validation errors, writing nothing', () => {
  const root = repo();
  try {
    const empty = enrich(root, ['--patch', '-'], '');
    assert.equal(empty.status, 1);
    assert.match(empty.stderr, /stdin is empty/);

    const bad = enrich(root, ['--patch', '-'], '[{"id":');
    assert.equal(bad.status, 1);
    assert.match(bad.stderr, /stdin is not valid JSON/);

    assert.equal(dbLines(root).length, 1, 'the DB is untouched on a bad input');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
