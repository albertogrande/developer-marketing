#!/usr/bin/env node
// Deterministic half of the weekly jobs sweep. The jobs-scout skill does the
// fuzzy work (find + extract + classify) and writes signals/jobs/incoming.json;
// this script owns ALL data integrity — validation, dedupe, stable ids,
// timestamps, liveness, aging — and writes signals/jobs/jobs.json, so the
// stored board stays consistent regardless of LLM output.
//
// Ported from albertogrande/dev-marketing-jobs scripts/merge.ts with the scope
// narrowed to this site's board: three categories (marketing-leadership,
// growth, product-marketing), fully-remote roles only, and region as a
// CLASSIFICATION (worldwide/eu/usa/other — all kept, labeled) rather than the
// original's EU-eligibility gate. Batches dropped: one weekly run owns the
// whole board.

import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const JOBS_DIR = path.join(process.cwd(), 'signals', 'jobs');
const JOBS_PATH = path.join(JOBS_DIR, 'jobs.json');
const INCOMING_PATH = path.join(JOBS_DIR, 'incoming.json');

// Weekly cadence: two consecutive sweeps that can't re-find or confirm a
// posting = two weeks stale, drop it. (The source repo used 5 on a daily cron
// — same ~week of tolerance, different clock.)
const MISSED_RUNS_BEFORE_DROP = 2;

export const CATEGORIES = ['marketing-leadership', 'growth', 'product-marketing'];
export const REGIONS = ['worldwide', 'eu', 'usa', 'other'];

export const today = () => process.env.MERGE_TODAY ?? new Date().toISOString().slice(0, 10);

// --- URL canon + ids ---------------------------------------------------------

/** Canonicalize a URL so the same posting from two sources collapses to one id. */
export function canonicalUrl(raw) {
  try {
    const u = new URL(raw);
    u.hash = '';
    for (const p of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'source', 'gh_src'])
      u.searchParams.delete(p);
    u.hostname = u.hostname.replace(/^www\./, '').toLowerCase();
    return u.toString().replace(/\/$/, '');
  } catch {
    return String(raw).trim();
  }
}

export function jobId(url) {
  return createHash('sha1').update(canonicalUrl(url)).digest('hex').slice(0, 16);
}

// --- Identity dedupe (safety net for aggregator URLs) -------------------------
// The skill requires `url` to be the employer's own JD page and treats it as
// THE dedupe key, but the scraper occasionally slips a board listing through;
// these helpers collapse such twins by role identity (company + title) and
// always keep the employer JD URL as canonical.

const AGGREGATOR_HOSTS = [
  'devreljob.com', 'devreljobs.com', 'devrelcareers.com',
  'weworkremotely.com', 'remoteok.com', 'himalayas.app', 'wellfound.com',
  'linkedin.com', 'indeed.com', 'hackmamba.io', 'jobs.mkt1.co', 'workatastartup.com',
];

export function isAggregatorUrl(raw) {
  try {
    const host = new URL(raw).hostname.replace(/^www\./, '').toLowerCase();
    return AGGREGATOR_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

/** Role identity used to collapse the same posting arriving under different URLs.
 *
 * The source repo keyed the company on its ATS board slug when the URL had
 * one — which silently broke the one case this key exists for: an aggregator
 * listing (no ATS slug) never matched its ATS-URL twin. The normalized,
 * token-sorted company name covers the free-text variants ("DataHub (Acryl
 * Data)" vs "Acryl Data (DataHub)") without that hole, so it is the key. */
export function identityKey(job) {
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const title = norm(job.title);
  const company = norm(job.company).split(' ').filter(Boolean).sort().join(' ');
  return `${company} | ${title}`;
}

/** Merge two records of the same role, keeping the employer JD URL + oldest history. */
function mergePair(a, b) {
  const aAgg = isAggregatorUrl(a.url);
  const bAgg = isAggregatorUrl(b.url);
  const winner = aAgg !== bAgg ? (aAgg ? b : a) : a.firstSeenAt <= b.firstSeenAt ? a : b;
  const loser = winner === a ? b : a;
  return {
    ...winner,
    firstSeenAt: winner.firstSeenAt <= loser.firstSeenAt ? winner.firstSeenAt : loser.firstSeenAt,
    lastSeenAt: winner.lastSeenAt >= loser.lastSeenAt ? winner.lastSeenAt : loser.lastSeenAt,
    missedRuns: Math.min(winner.missedRuns, loser.missedRuns),
  };
}

export function collapseByIdentity(jobs) {
  const byIdentity = new Map();
  for (const job of jobs) {
    const key = identityKey(job);
    const prev = byIdentity.get(key);
    byIdentity.set(key, prev ? mergePair(prev, job) : job);
  }
  return [...byIdentity.values()];
}

// --- Region classification ----------------------------------------------------
// Unlike the source repo, region does NOT gate anything here — every remote
// role stays on the board. This classifier is the deterministic fallback for
// display grouping when the scraper leaves `region` unset; the skill's
// JD-derived value wins when present. "Unstated" reads as worldwide, matching
// how postings behave in practice: a JD that restricts hiring says so.

const WORLDWIDE = /\b(worldwide|global|anywhere|any location|fully distributed)\b/i;
const EU_MARKERS =
  /\b(europe|european|eu|emea|eea|uk|united kingdom|ireland|germany|berlin|france|paris|spain|madrid|barcelona|netherlands|amsterdam|portugal|lisbon|poland|sweden|denmark|norway|finland|italy|belgium|austria|switzerland|cet|cest|gmt)\b/i;
const US_MARKERS =
  /\b(u\.?s\.?a?|united states|us[/\- ]?canada|canada|canadian|north america|americas|pst|pdt|est|edt)\b/i;
const US_STATE =
  /,\s*(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WV|WI|WY|WA)\b/;

export function classifyRegion(location) {
  const loc = String(location ?? '');
  if (WORLDWIDE.test(loc)) return 'worldwide';
  if (EU_MARKERS.test(loc)) return 'eu';
  if (US_MARKERS.test(loc) || US_STATE.test(loc)) return 'usa';
  if (/^\s*(remote\s*)?$/i.test(loc) || /^remote$/i.test(loc.trim())) return 'worldwide';
  return 'other';
}

// --- Incoming validation --------------------------------------------------------
// Hand-rolled on purpose: scripts/ carries no runtime deps (see scout-enrich).
// Invalid entries are skipped with a reason, never fatal — one bad row from
// the scraper must not cost the run.

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const isHttpUrl = (v) => {
  try {
    return /^https?:$/.test(new URL(v).protocol);
  } catch {
    return false;
  }
};

/** Validate + normalize one incoming entry; returns { job } or { reason }. */
export function validateIncoming(raw) {
  if (typeof raw !== 'object' || raw === null) return { reason: 'not an object' };
  const r = raw;
  if (typeof r.title !== 'string' || !r.title.trim()) return { reason: 'missing title' };
  if (typeof r.company !== 'string' || !r.company.trim()) return { reason: 'missing company' };
  if (typeof r.url !== 'string' || !isHttpUrl(r.url)) return { reason: 'missing/invalid url' };
  if (r.remote !== 'remote') return { reason: `not fully remote (${r.remote ?? 'unset'})` };
  if (!CATEGORIES.includes(r.category)) return { reason: `bad category (${r.category})` };
  if (r.postedAt != null && !ISO_DAY.test(String(r.postedAt))) return { reason: 'bad postedAt' };
  const location = typeof r.location === 'string' && r.location.trim() ? r.location.trim() : 'Remote';
  return {
    job: {
      title: r.title.trim(),
      company: r.company.trim(),
      companyUrl: typeof r.companyUrl === 'string' && isHttpUrl(r.companyUrl) ? r.companyUrl : null,
      location,
      remote: 'remote',
      region: REGIONS.includes(r.region) ? r.region : classifyRegion(location),
      category: r.category,
      tags: Array.isArray(r.tags) ? r.tags.filter((t) => typeof t === 'string') : [],
      salary: typeof r.salary === 'string' && r.salary.trim() ? r.salary.trim() : null,
      url: r.url,
      source: typeof r.source === 'string' && r.source.trim() ? r.source.trim() : 'search',
      summary: typeof r.summary === 'string' ? r.summary.trim() : '',
      postedAt: r.postedAt ?? null,
    },
  };
}

// --- Merge (pure, exported for tests) -----------------------------------------

export async function mergeJobs(existing, incoming, now, liveness = async () => 'unknown') {
  const byId = new Map(collapseByIdentity(existing).map((j) => [j.id, j]));
  const seenThisRun = new Set();
  const idByIdentity = new Map();
  for (const j of byId.values()) idByIdentity.set(identityKey(j), j.id);

  for (const inc of incoming) {
    const incId = jobId(inc.url);
    const matchId = byId.has(incId) ? incId : idByIdentity.get(identityKey(inc));
    const prev = matchId ? byId.get(matchId) : undefined;
    if (prev) {
      const upgradeUrl = isAggregatorUrl(prev.url) && !isAggregatorUrl(inc.url);
      const id = upgradeUrl ? incId : prev.id;
      if (id !== prev.id) byId.delete(prev.id);
      byId.set(id, {
        ...prev,
        id,
        url: upgradeUrl ? inc.url : prev.url,
        title: inc.title,
        company: inc.company,
        companyUrl: inc.companyUrl,
        location: inc.location,
        remote: inc.remote,
        region: inc.region,
        category: inc.category,
        tags: inc.tags,
        salary: inc.salary,
        summary: inc.summary,
        postedAt: inc.postedAt ?? prev.postedAt,
        source: inc.source,
        lastSeenAt: now,
        missedRuns: 0,
      });
      seenThisRun.add(id);
      idByIdentity.set(identityKey(inc), id);
    } else {
      byId.set(incId, { ...inc, id: incId, firstSeenAt: now, lastSeenAt: now, missedRuns: 0 });
      seenThisRun.add(incId);
      idByIdentity.set(identityKey(inc), incId);
    }
  }

  // Liveness for jobs not re-found this run: authoritative "dead" drops now,
  // authoritative "live" clears the miss counter, inconclusive ages via
  // missedRuns. A soft 200 or a network hiccup never kills a real role.
  for (const [id, job] of byId) {
    if (seenThisRun.has(id)) continue;
    const verdict = await liveness(job);
    if (verdict === 'dead') {
      byId.delete(id);
    } else if (verdict === 'live') {
      if (job.missedRuns !== 0) byId.set(id, { ...job, missedRuns: 0 });
    } else {
      const missedRuns = job.missedRuns + 1;
      if (missedRuns >= MISSED_RUNS_BEFORE_DROP) byId.delete(id);
      else byId.set(id, { ...job, missedRuns });
    }
  }

  return collapseByIdentity([...byId.values()]);
}

// --- Liveness (network) ---------------------------------------------------------
// ATS SPAs return HTTP 200 for removed postings, so a 200 proves nothing.
// Ashby and Greenhouse expose public board APIs listing only currently-open
// postings — a job absent from its board is authoritatively closed. Everything
// else falls back to hard 404/410 or an unambiguous closed-marker in a
// server-rendered body.

const UA = { 'user-agent': 'the-beat-jobs/1.0 (+https://thebeat.dev/jobs)' };

const ASHBY_POSTING_RE = /^https?:\/\/jobs\.ashbyhq\.com\/([^/]+)\/([0-9a-f-]+)/i;
const ashbyBoardCache = new Map();

async function ashbyBoardJobIds(org) {
  if (ashbyBoardCache.has(org)) return ashbyBoardCache.get(org) ?? null;
  let ids = null;
  try {
    const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${org}`, {
      signal: AbortSignal.timeout(15_000),
      headers: UA,
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.jobs)) ids = new Set(data.jobs.map((j) => j.id).filter(Boolean));
    }
  } catch {
    ids = null;
  }
  ashbyBoardCache.set(org, ids);
  return ids;
}

async function checkAshbyLive(url) {
  const m = canonicalUrl(url).match(ASHBY_POSTING_RE);
  if (!m) return null;
  const ids = await ashbyBoardJobIds(m[1]);
  if (ids === null) return null;
  return ids.has(m[2]);
}

// Greenhouse runs a parallel EU data-residency stack; route the lookup to the
// matching region or EU postings never get an authoritative verdict.
const GREENHOUSE_POSTING_RE = /^https?:\/\/(?:job-boards|boards)\.(eu\.)?greenhouse\.io\/([^/]+)\/jobs\/(\d+)/i;

export function parseGreenhousePosting(url) {
  const m = canonicalUrl(url).match(GREENHOUSE_POSTING_RE);
  if (!m) return null;
  return { eu: Boolean(m[1]), org: m[2], id: m[3] };
}

const greenhouseBoardCache = new Map();

async function greenhouseBoardJobIds(org, eu) {
  const cacheKey = eu ? `eu:${org}` : org;
  if (greenhouseBoardCache.has(cacheKey)) return greenhouseBoardCache.get(cacheKey) ?? null;
  const apiHost = eu ? 'boards-api.eu.greenhouse.io' : 'boards-api.greenhouse.io';
  let ids = null;
  try {
    const res = await fetch(`https://${apiHost}/v1/boards/${org}/jobs`, {
      signal: AbortSignal.timeout(15_000),
      headers: UA,
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.jobs))
        ids = new Set(data.jobs.map((j) => String(j.id)).filter((id) => id && id !== 'undefined'));
    }
  } catch {
    ids = null;
  }
  greenhouseBoardCache.set(cacheKey, ids);
  return ids;
}

async function checkGreenhouseLive(url) {
  const posting = parseGreenhousePosting(url);
  if (!posting) return null;
  const ids = await greenhouseBoardJobIds(posting.org, posting.eu);
  if (ids === null) return null;
  return ids.has(posting.id);
}

// Deliberately TIGHT: a false positive drops a LIVE role, so only unambiguous
// "this exact posting is closed" wording matches — never bare "closed"/"filled".
const CLOSED_BODY_PHRASES = [
  'no longer accepting application',
  'this position is no longer open',
  'this position is no longer available',
  'this position has been filled',
  'this position has been closed',
  'this job is no longer open',
  'this job is no longer available',
  'this job posting is no longer available',
  'this role is no longer open',
  'this role is no longer available',
  'this opening is no longer available',
  'this posting is no longer available',
  'this vacancy is no longer available',
  'this opportunity is no longer available',
  'the job you are looking for is no longer available',
  'job posting has expired',
  'this listing has expired',
];

export function isClosedPageBody(html) {
  const text = String(html).toLowerCase();
  return CLOSED_BODY_PHRASES.some((phrase) => text.includes(phrase));
}

export async function checkLive(job) {
  if (process.env.MERGE_SKIP_LIVENESS === '1') return 'unknown';
  for (const probe of [checkAshbyLive, checkGreenhouseLive]) {
    const ok = await probe(job.url);
    if (ok !== null) return ok ? 'live' : 'dead';
  }
  try {
    const res = await fetch(canonicalUrl(job.url), {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
      headers: UA,
    });
    if (res.status === 404 || res.status === 410) return 'dead';
    if (res.ok) {
      const html = await res.text().catch(() => '');
      if (isClosedPageBody(html)) return 'dead';
    }
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

// --- IO -------------------------------------------------------------------------

function sortForStorage(jobs) {
  return [...jobs].sort(
    (a, b) => b.firstSeenAt.localeCompare(a.firstSeenAt) || a.company.localeCompare(b.company),
  );
}

async function readJson(p, fallback) {
  try {
    return JSON.parse(await fs.readFile(p, 'utf8'));
  } catch {
    return fallback;
  }
}

async function main() {
  const now = today();
  const existing = await readJson(JOBS_PATH, []);
  const rawIncoming = await readJson(INCOMING_PATH, []);
  if (!Array.isArray(rawIncoming)) {
    console.error('jobs-merge: incoming.json is not an array — refusing to run');
    process.exit(1);
  }

  const incoming = [];
  for (const raw of rawIncoming) {
    const v = validateIncoming(raw);
    if (v.job) incoming.push(v.job);
    else console.warn(`jobs-merge: skipped "${raw?.title ?? '?'}" @ ${raw?.company ?? '?'} — ${v.reason}`);
  }
  console.log(`jobs-merge: ${existing.length} stored, ${incoming.length}/${rawIncoming.length} incoming valid`);

  const merged = await mergeJobs(existing, incoming, now, checkLive);
  const sorted = sortForStorage(merged);
  console.log(`jobs-merge: result ${sorted.length} open roles`);

  await fs.writeFile(JOBS_PATH, JSON.stringify(sorted, null, 2) + '\n', 'utf8');
  await fs.rm(INCOMING_PATH, { force: true });
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
