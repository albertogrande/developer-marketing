// A minimal ZIP writer, because EPUB is a ZIP and this repo does not take a
// dependency to do a job this small. Same reasoning as newsletter/lib/mime.mjs
// and newsletter/lib/smtp.mjs: the format is stable, the subset we need is
// tiny, and owning it means no supply chain for a build artifact.
//
// Two things here exist specifically for EPUB, and removing them breaks readers
// rather than the archive:
//
//   1. The `mimetype` entry must be the FIRST entry, STORED (not deflated), and
//      carry no extra field — that is what lets a reader sniff the format from
//      the first bytes of the file without inflating anything. `store: true`
//      per entry is how a caller asks for that.
//   2. Timestamps are passed in, never read from the clock. The repo's
//      deterministic-dates rule (dates come from content, never `Date.now()`)
//      applies to build outputs too: same input, byte-identical EPUB.
//
// Only what an EPUB needs is implemented: no ZIP64, no encryption, no data
// descriptors, no directory entries. Archives stay well under 4GB, so the
// 32-bit size fields are not a constraint we can hit.

import { deflateRawSync } from 'node:zlib';

const LOCAL_SIG = 0x04034b50;
const CENTRAL_SIG = 0x02014b50;
const EOCD_SIG = 0x06054b50;

const METHOD_STORE = 0;
const METHOD_DEFLATE = 8;

// Bit 11 tells the reader the filename is UTF-8 rather than CP437.
const FLAG_UTF8 = 0x0800;

/* ---------------------------------------------------------------- crc32 --- */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  return table;
})();

export function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

/* ------------------------------------------------------------ dos stamps --- */

// MS-DOS packed date/time. Two-second resolution, and the epoch is 1980 — a
// date before that cannot be represented, so it is clamped rather than silently
// wrapping into a nonsense year.
export function dosStamp(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) throw new TypeError('zip: invalid date');
  const year = Math.max(1980, d.getUTCFullYear());
  return {
    date: ((year - 1980) << 9) | ((d.getUTCMonth() + 1) << 5) | d.getUTCDate(),
    time: (d.getUTCHours() << 11) | (d.getUTCMinutes() << 5) | (d.getUTCSeconds() >> 1),
  };
}

/* ----------------------------------------------------------------- write --- */

/**
 * Build a ZIP archive in memory.
 *
 * @param {Array<{name: string, data: string|Buffer, store?: boolean}>} entries
 *   In order. `store: true` skips compression — required for EPUB's `mimetype`.
 * @param {{ modified: Date|string }} opts
 *   `modified` stamps every entry. Required, so the caller has to decide where
 *   the date comes from instead of inheriting the clock.
 * @returns {Buffer}
 */
export function zip(entries, { modified } = {}) {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new TypeError('zip: at least one entry is required');
  }
  if (modified === undefined) {
    throw new TypeError('zip: `modified` is required — builds must not read the clock');
  }
  const stamp = dosStamp(modified);

  const seen = new Set();
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const entry of entries) {
    const name = String(entry.name);
    if (seen.has(name)) throw new Error(`zip: duplicate entry ${name}`);
    seen.add(name);

    const nameBuf = Buffer.from(name, 'utf8');
    const raw = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(String(entry.data), 'utf8');

    const store = entry.store === true;
    const body = store ? raw : deflateRawSync(raw, { level: 9 });
    const method = store ? METHOD_STORE : METHOD_DEFLATE;
    const sum = crc32(raw);

    const local = Buffer.alloc(30 + nameBuf.length);
    local.writeUInt32LE(LOCAL_SIG, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(FLAG_UTF8, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(stamp.time, 10);
    local.writeUInt16LE(stamp.date, 12);
    local.writeUInt32LE(sum, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28); // extra length — zero, which `mimetype` requires
    nameBuf.copy(local, 30);

    locals.push(local, body);

    const central = Buffer.alloc(46 + nameBuf.length);
    central.writeUInt32LE(CENTRAL_SIG, 0);
    central.writeUInt16LE(20, 4); // version made by
    central.writeUInt16LE(20, 6); // version needed
    central.writeUInt16LE(FLAG_UTF8, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(stamp.time, 12);
    central.writeUInt16LE(stamp.date, 14);
    central.writeUInt32LE(sum, 16);
    central.writeUInt32LE(body.length, 20);
    central.writeUInt32LE(raw.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30); // extra
    central.writeUInt16LE(0, 32); // comment
    central.writeUInt16LE(0, 34); // disk number start
    central.writeUInt16LE(0, 36); // internal attributes
    central.writeUInt32LE(0o644 << 16, 38); // external attributes: regular file
    central.writeUInt32LE(offset, 42);
    nameBuf.copy(central, 46);

    centrals.push(central);
    offset += local.length + body.length;
  }

  const centralBuf = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(EOCD_SIG, 0);
  eocd.writeUInt16LE(0, 4); // this disk
  eocd.writeUInt16LE(0, 6); // disk with central directory
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([...locals, centralBuf, eocd]);
}
