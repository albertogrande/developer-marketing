#!/usr/bin/env node
// Editorial-state gate. MEMORY.md declares its own line cap ("Keep under
// ~170 lines") and the weekly skill is told to prune to it — but nothing
// enforced it, and the file drifted to 2× the cap before anyone noticed.
// A memory file that grows without bound stops being a working memory: the
// desks read all of it every run, and the pruning discipline is what keeps
// the signal density up. This makes the cap binding.
//
// Also sanity-checks signals/ filenames (ISO week form YYYY-Www.md) — a
// misnamed week file is invisible to every desk that greps by week id — and
// the scout's event DB under signals/db/ (ISO week .ndjson files whose every
// line parses and carries an id, ts and url; the query tools replay these
// blind, so a malformed line is corruption, not style).
//
// signals/ has exactly two subdirectories, and they are listed in SUBDIRS
// rather than checked one-off: db/ (the event log) and jobs/ (the board's
// stored state). Adding a third means adding it here in the same commit —
// the jobs board shipped without that and stopped every writer run for a day,
// because this gate runs only in editorial-gates and `npm run check`, not in
// CI on push. CI now runs it too, so the next such directory fails on the
// push that adds it rather than on the next scout.
//
// Runs in `npm run check` and the editorial-gates action. Warns at 90% of
// cap, fails above cap.

import { readFileSync, readdirSync, existsSync } from 'node:fs';

const problems = [];
const warnings = [];

// --- MEMORY.md line cap -----------------------------------------------------
const MEMORY = 'editorial/MEMORY.md';
if (existsSync(MEMORY)) {
  const text = readFileSync(MEMORY, 'utf8');
  const m = text.match(/[Kk]eep (?:it )?under ~?(\d+) lines/);
  const cap = m ? Number(m[1]) : 170;
  const lines = text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
  if (lines > cap) {
    problems.push(
      `${MEMORY}: ${lines} lines exceeds its own ~${cap}-line cap — prune (retire dead threads; git history preserves everything)`
    );
  } else if (lines > cap * 0.9) {
    warnings.push(`${MEMORY}: ${lines} lines — within 10% of the ~${cap}-line cap, prune soon`);
  }
} else {
  problems.push(`${MEMORY}: missing`);
}

// --- signals/ filenames -----------------------------------------------------
const SUBDIRS = new Set(['db', 'jobs']);
if (existsSync('signals')) {
  for (const e of readdirSync('signals', { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    if (e.isDirectory()) {
      if (!SUBDIRS.has(e.name)) {
        problems.push(
          `signals/${e.name}/: unexpected directory — only ${[...SUBDIRS].join('/, ')}/ live here`
        );
      }
      continue;
    }
    if (e.name === 'entities.json') continue; // validated below
    if (!/^\d{4}-W\d{2}\.md$/.test(e.name)) {
      problems.push(`signals/${e.name}: not an ISO week filename (YYYY-Www.md) — desks grep by week id`);
    }
  }
}

// --- signals/entities.json ---------------------------------------------------
// The event graph's nodes. Query and enrichment resolve slugs through it, so
// a malformed registry silently breaks every entity filter.
const ENTITIES = 'signals/entities.json';
if (existsSync(ENTITIES)) {
  try {
    const reg = JSON.parse(readFileSync(ENTITIES, 'utf8'));
    const kinds = new Set(['company', 'tool', 'person', 'protocol', 'show']);
    const aliases = new Set();
    for (const [slug, ent] of Object.entries(reg)) {
      if (slug.startsWith('_')) continue; // _comment
      if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) problems.push(`${ENTITIES}: bad slug "${slug}"`);
      if (!ent?.name) problems.push(`${ENTITIES}: ${slug} missing name`);
      if (!kinds.has(ent?.kind)) problems.push(`${ENTITIES}: ${slug} has bad kind "${ent?.kind}"`);
      for (const a of ent?.aliases ?? []) {
        if (aliases.has(a)) problems.push(`${ENTITIES}: alias "${a}" appears twice`);
        aliases.add(a);
      }
    }
  } catch (e) {
    problems.push(`${ENTITIES}: does not parse (${e.message})`);
  }
}

// --- signals/db/ event log ---------------------------------------------------
if (existsSync('signals/db')) {
  for (const f of readdirSync('signals/db')) {
    if (f.startsWith('.')) continue;
    if (!/^\d{4}-W\d{2}\.ndjson$/.test(f)) {
      problems.push(`signals/db/${f}: not an ISO week event log (YYYY-Www.ndjson)`);
      continue;
    }
    const lines = readFileSync(`signals/db/${f}`, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (!line.trim()) return;
      try {
        const rec = JSON.parse(line);
        // Two valid shapes: a full event (id + ts + url + title) or an
        // append-only enrichment line (id + only enrichment fields).
        if (!rec.id) {
          problems.push(`signals/db/${f}:${i + 1}: line missing id`);
        } else if (rec.ts || rec.url || rec.title) {
          if (!rec.ts || !rec.url || !rec.title) {
            problems.push(`signals/db/${f}:${i + 1}: event missing ts/url/title`);
          }
        } else {
          const allowed = new Set(['id', 'entities', 'event', 'topics']);
          const extra = Object.keys(rec).filter((k) => !allowed.has(k));
          if (extra.length) {
            problems.push(`signals/db/${f}:${i + 1}: enrichment line has unexpected field(s) ${extra.join(', ')}`);
          }
        }
      } catch {
        problems.push(`signals/db/${f}:${i + 1}: unparsable JSON line`);
      }
    });
  }
}

// --- signals/jobs/ board state -----------------------------------------------
// scripts/jobs-merge.mjs owns every integrity decision about a listing; this
// gate only checks that the directory holds what it should and that the stored
// state still parses, since the /jobs page and /jobs.json read it at build.
if (existsSync('signals/jobs')) {
  const JOB_FILES = new Set(['jobs.json', 'sources.json', 'incoming.json']);
  for (const f of readdirSync('signals/jobs')) {
    if (f.startsWith('.')) continue;
    if (!JOB_FILES.has(f)) {
      problems.push(`signals/jobs/${f}: unexpected file — only ${[...JOB_FILES].join(', ')} live here`);
      continue;
    }
    let parsed;
    try {
      parsed = JSON.parse(readFileSync(`signals/jobs/${f}`, 'utf8'));
    } catch (e) {
      problems.push(`signals/jobs/${f}: does not parse (${e.message})`);
      continue;
    }
    // jobs.json is the rendered board; a non-array or a duplicate id is
    // corruption the page would render silently.
    if (f === 'jobs.json') {
      if (!Array.isArray(parsed)) {
        problems.push('signals/jobs/jobs.json: not an array — the board reads it as a list');
        continue;
      }
      const ids = new Set();
      for (const [i, job] of parsed.entries()) {
        if (!job?.id) problems.push(`signals/jobs/jobs.json[${i}]: listing missing id`);
        else if (ids.has(job.id)) problems.push(`signals/jobs/jobs.json: id "${job.id}" appears twice`);
        else ids.add(job.id);
      }
    }
  }
}

for (const w of warnings) console.warn(`warn: ${w}`);
if (problems.length) {
  console.error('check-editorial: editorial state problems:');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log('check-editorial: ok.');
