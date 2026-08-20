import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { zip, crc32, dosStamp } from './zip.mjs';

const MODIFIED = '2026-08-20T12:00:00Z';

test('crc32 matches the published check values', () => {
  // The standard CRC-32 check vector, and the empty case readers rely on.
  assert.equal(crc32(Buffer.from('123456789')), 0xcbf43926);
  assert.equal(crc32(Buffer.from('')), 0);
  assert.equal(crc32(Buffer.from('application/epub+zip')), 0x2cab616f);
});

test('dosStamp packs the date and clamps below the 1980 epoch', () => {
  const { date, time } = dosStamp('2026-08-20T13:45:20Z');
  assert.equal((date >> 9) + 1980, 2026);
  assert.equal((date >> 5) & 0x0f, 8);
  assert.equal(date & 0x1f, 20);
  assert.equal(time >> 11, 13);
  assert.equal((time >> 5) & 0x3f, 45);
  // 1970 cannot be represented; it must clamp rather than wrap to a bogus year.
  assert.equal((dosStamp('1970-01-01T00:00:00Z').date >> 9) + 1980, 1980);
});

test('a stored first entry lands where a reader sniffs for it', () => {
  const buf = zip(
    [
      { name: 'mimetype', data: 'application/epub+zip', store: true },
      { name: 'META-INF/container.xml', data: '<container/>' },
    ],
    { modified: MODIFIED }
  );

  // Local header, then the name, then the payload — all at fixed offsets
  // because the entry is stored and carries no extra field.
  assert.equal(buf.readUInt32LE(0), 0x04034b50);
  assert.equal(buf.readUInt16LE(8), 0, 'first entry must be STORED, not deflated');
  assert.equal(buf.readUInt16LE(28), 0, 'first entry must carry no extra field');
  assert.equal(buf.subarray(30, 38).toString(), 'mimetype');
  assert.equal(buf.subarray(38, 58).toString(), 'application/epub+zip');
});

test('the archive is byte-identical across runs', () => {
  const entries = [
    { name: 'mimetype', data: 'application/epub+zip', store: true },
    { name: 'a.xhtml', data: '<p>hello</p>'.repeat(50) },
  ];
  const a = zip(entries, { modified: MODIFIED });
  const b = zip(entries, { modified: MODIFIED });
  assert.deepEqual(a, b);
});

test('refuses to invent a timestamp', () => {
  assert.throws(() => zip([{ name: 'a', data: 'x' }]), /modified.*required/);
});

test('rejects an empty archive and duplicate names', () => {
  assert.throws(() => zip([], { modified: MODIFIED }), /at least one entry/);
  assert.throws(
    () => zip([{ name: 'a', data: '1' }, { name: 'a', data: '2' }], { modified: MODIFIED }),
    /duplicate entry/
  );
});

test('round-trips through the system unzip', (t) => {
  let dir;
  try {
    execFileSync('unzip', ['-v'], { stdio: 'ignore' });
  } catch {
    t.skip('unzip not available');
    return;
  }

  const payload = 'Railway'.repeat(500);
  const buf = zip(
    [
      { name: 'mimetype', data: 'application/epub+zip', store: true },
      { name: 'OEBPS/ch-01.xhtml', data: payload },
      { name: 'OEBPS/héllo.txt', data: 'unicode name' },
    ],
    { modified: MODIFIED }
  );

  try {
    dir = mkdtempSync(join(tmpdir(), 'zip-test-'));
    const file = join(dir, 'out.zip');
    writeFileSync(file, buf);

    // -t verifies every CRC; a bad header or checksum exits non-zero.
    execFileSync('unzip', ['-t', file], { stdio: 'ignore' });
    execFileSync('unzip', ['-q', file, '-d', dir]);

    assert.equal(readFileSync(join(dir, 'mimetype'), 'utf8'), 'application/epub+zip');
    assert.equal(readFileSync(join(dir, 'OEBPS/ch-01.xhtml'), 'utf8'), payload);
    assert.equal(readFileSync(join(dir, 'OEBPS/héllo.txt'), 'utf8'), 'unicode name');
  } finally {
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});
