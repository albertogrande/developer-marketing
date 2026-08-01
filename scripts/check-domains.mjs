#!/usr/bin/env node
// Domain availability check over RDAP — the registry-authoritative successor to
// whois, so no `whois` binary and no registrar API key is needed. Takes bare
// names ("mkt2") crossed with a TLD list, or full domains ("mkt2.dev"), and
// reports each as available / taken / unknown.
//
// Usage:
//   node scripts/check-domains.mjs mkt2 devmkt --tlds dev,com,io
//   node scripts/check-domains.mjs mkt2.dev the-wire.dev
//   node scripts/check-domains.mjs --file scripts/domain-candidates.txt
//   node scripts/check-domains.mjs mkt2 --tlds dev --json
//
// How it reads a result: RDAP returns 404 for a name no registry record exists
// for (available) and 200 for one that does (taken). Anything else — a registry
// with no RDAP service, a rate limit that outlived its retries, a malformed
// response — is reported as `unknown` rather than guessed at.
//
// Availability here means "unregistered", not "buyable at base price": registries
// reserve names and price premiums separately, and RDAP says nothing about either.
// Confirm at a registrar before planning around a result.
//
// Exits 0 unless every lookup failed — this is a research tool, not a build gate.

const BOOTSTRAP_URL = 'https://data.iana.org/rdap/dns.json';
// rdap.org routes a lookup to whatever registry it knows about — the fallback for
// ccTLDs missing from IANA's bootstrap. It answers its own 404 when it has no
// route, so a result is only trustworthy if it actually redirected somewhere else.
const ROUTER_URL = 'https://rdap.org';
// ccTLDs the bootstrap omits (it only mandates gTLDs) but which do serve RDAP.
// Identity Digital operates .io/.sh/.ac/.me; each verified to answer 200 for a
// registered name and 404 for a free one.
const OVERRIDES = new Map([
  ['io', 'https://rdap.identitydigital.services/rdap'],
  ['sh', 'https://rdap.identitydigital.services/rdap'],
  ['ac', 'https://rdap.identitydigital.services/rdap'],
  ['me', 'https://rdap.identitydigital.services/rdap'],
]);
const DEFAULT_TLDS = ['dev', 'com', 'io'];
const TIMEOUT_MS = 10_000;
const CONCURRENCY = 6;
const MAX_RETRIES = 3;
// A throttled registry can ask for a Retry-After measured in hours. Waiting that
// out would hang a sweep with no output; past this the lookup is just inconclusive.
const RETRY_AFTER_CAP_MS = 15_000;
// Registries rate-limit per client, so a wide sweep has to pace itself per host
// rather than just cap total concurrency — most lookups in a run hit the same
// registry. Distinct registries still proceed in parallel.
const MIN_HOST_INTERVAL_MS = 250;
// How far a 429 pushes that host's queue back, on top of the interval.
const THROTTLE_PENALTY_MS = 2_000;
const UA =
  'Mozilla/5.0 (compatible; developer-marketing-domaincheck/1.0; +https://developer-marketing.vercel.app/)';

// A label is 1–63 chars of a-z, 0-9 and inner hyphens (RFC 1035 + RFC 3696).
const LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

function parseArgs(argv) {
  const names = [];
  let tlds = null;
  let file = null;
  let json = false;
  let availableOnly = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--json') json = true;
    else if (arg === '--available') availableOnly = true;
    else if (arg === '--tlds') tlds = argv[++i];
    else if (arg.startsWith('--tlds=')) tlds = arg.slice(7);
    else if (arg === '--file') file = argv[++i];
    else if (arg.startsWith('--file=')) file = arg.slice(7);
    else if (arg === '--help' || arg === '-h') return { help: true };
    else if (arg.startsWith('-')) throw new Error(`unknown flag: ${arg}`);
    else names.push(arg);
  }

  return {
    names,
    file,
    json,
    availableOnly,
    tlds: (tlds ? tlds.split(',') : DEFAULT_TLDS)
      .map((t) => t.trim().replace(/^\./, '').toLowerCase())
      .filter(Boolean),
  };
}

async function readCandidateFile(path) {
  const { readFile } = await import('node:fs/promises');
  const text = await readFile(path, 'utf8');
  return text
    .split('\n')
    .map((l) => l.replace(/#.*$/, '').trim())
    .filter(Boolean);
}

// Bare name + TLD list -> the cross product; a name with a dot is taken as-is.
function expand(names, tlds) {
  const domains = new Set();
  for (const raw of names) {
    const name = raw.trim().toLowerCase().replace(/\.$/, '');
    if (!name) continue;
    if (name.includes('.')) domains.add(name);
    else for (const tld of tlds) domains.add(`${name}.${tld}`);
  }
  return [...domains].sort();
}

function validate(domain) {
  const labels = domain.split('.');
  if (labels.length < 2) return 'needs a TLD';
  if (domain.length > 253) return 'too long';
  const bad = labels.find((l) => !LABEL_RE.test(l));
  if (bad !== undefined) return `invalid label "${bad}"`;
  return null;
}

// Per-host slot reservation. Single-threaded, so read-then-write can't interleave:
// each caller claims the next free slot and pushes the host's cursor forward.
const nextSlot = new Map();

async function pace(host) {
  const now = Date.now();
  const at = Math.max(now, nextSlot.get(host) || 0);
  nextSlot.set(host, at + MIN_HOST_INTERVAL_MS);
  if (at > now) await sleep(at - now);
}

// A 429 is about the host, not this one request — slow every queued lookup for it.
function penalize(host, extraMs) {
  const until = Date.now() + extraMs + THROTTLE_PENALTY_MS;
  nextSlot.set(host, Math.max(nextSlot.get(host) || 0, until));
}

async function getJson(url, { retries = MAX_RETRIES } = {}) {
  const host = new URL(url).host;
  for (let attempt = 0; ; attempt++) {
    await pace(host);
    let res;
    try {
      res = await fetch(url, {
        headers: { accept: 'application/rdap+json, application/json', 'user-agent': UA },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        redirect: 'follow',
      });
    } catch (err) {
      if (attempt >= retries) return { status: 0, error: err.message };
      await sleep(500 * 2 ** attempt);
      continue;
    }

    // 429/5xx are the registry throttling or wobbling — worth another try.
    if ((res.status === 429 || res.status >= 500) && attempt < retries) {
      const after = Number(res.headers.get('retry-after'));
      const wait =
        Number.isFinite(after) && after > 0
          ? Math.min(after * 1000, RETRY_AFTER_CAP_MS)
          : 500 * 2 ** attempt;
      if (res.status === 429) penalize(host, wait);
      else await sleep(wait);
      continue;
    }

    // res.url is the URL after redirects — how a router miss is told from a real answer.
    const finalUrl = res.url || url;
    if (res.status === 404) return { status: 404, finalUrl };
    if (!res.ok) return { status: res.status, finalUrl, error: `HTTP ${res.status}` };

    try {
      return { status: res.status, finalUrl, body: await res.json() };
    } catch (err) {
      return { status: res.status, finalUrl, error: `unparseable response: ${err.message}` };
    }
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// IANA's bootstrap file maps every TLD to its registry's RDAP base URL.
async function loadBootstrap() {
  const { status, body, error } = await getJson(BOOTSTRAP_URL);
  if (status !== 200 || !Array.isArray(body?.services)) {
    throw new Error(`could not load the IANA RDAP bootstrap (${error || `HTTP ${status}`})`);
  }
  const map = new Map();
  for (const [tlds, urls] of body.services) {
    const base = urls.find((u) => u.startsWith('https://')) || urls[0];
    if (!base) continue;
    for (const tld of tlds) map.set(tld.toLowerCase(), base.replace(/\/$/, ''));
  }
  return map;
}

// The registrar of record, when the registry chooses to publish it.
function registrarOf(body) {
  const entity = (body?.entities || []).find((e) => (e.roles || []).includes('registrar'));
  if (!entity) return null;
  const fn = (entity.vcardArray?.[1] || []).find((f) => f[0] === 'fn');
  return fn?.[3] || null;
}

function expiryOf(body) {
  const event = (body?.events || []).find((e) => e.eventAction === 'expiration');
  return event?.eventDate ? event.eventDate.slice(0, 10) : null;
}

// Last resort for a registry that publishes no RDAP at all (several short ccTLDs).
// DNS delegation is evidence, not an answer: a registered name parked without
// nameservers still returns NXDOMAIN, so this can only ever say "likely". These
// states stay distinct from the RDAP-backed ones and are excluded from --available.
async function guessByDns(domain, tld) {
  const dns = await import('node:dns');
  const resolver = new dns.promises.Resolver({ timeout: 5_000, tries: 2 });
  const note = `no RDAP for .${tld}`;
  try {
    const ns = await resolver.resolveNs(domain);
    return ns.length
      ? { domain, state: 'likely-taken', detail: `${note}; delegated to ${ns[0]}` }
      : { domain, state: 'unknown', detail: `${note}; DNS inconclusive` };
  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'NXDOMAIN') {
      return { domain, state: 'likely-free', detail: `${note}; no DNS record — verify manually` };
    }
    return { domain, state: 'unknown', detail: `${note}; DNS ${err.code || 'error'}` };
  }
}

async function check(domain, bootstrap) {
  const invalid = validate(domain);
  if (invalid) return { domain, state: 'invalid', detail: invalid };

  const tld = domain.slice(domain.lastIndexOf('.') + 1);
  const base = OVERRIDES.get(tld) || bootstrap.get(tld) || ROUTER_URL;

  const { status, body, error, finalUrl } = await getJson(
    `${base}/domain/${encodeURIComponent(domain)}`,
  );

  // The router answering for itself means it had no route, not that the name is free.
  if (base === ROUTER_URL && new URL(finalUrl).host === new URL(ROUTER_URL).host) {
    return await guessByDns(domain, tld);
  }

  if (status === 404) return { domain, state: 'available' };
  if (status === 200) {
    const parts = [registrarOf(body), expiryOf(body) && `expires ${expiryOf(body)}`].filter(Boolean);
    return { domain, state: 'taken', detail: parts.join(', ') || null };
  }
  return { domain, state: 'unknown', detail: error || `HTTP ${status}` };
}

async function mapPool(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

const HELP = `Domain availability over RDAP.

  node scripts/check-domains.mjs <name|domain>... [--tlds dev,com,io] [--file list.txt]
                                 [--available] [--json]

--available drops the taken/inconclusive rows, for sweeps too long to read whole.
Bare names are crossed with --tlds (default: ${DEFAULT_TLDS.join(',')}); names containing a
dot are checked as given. "available" means unregistered, not necessarily
buyable at base price — registries reserve and premium-price names separately.`;

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(HELP);
    return 0;
  }

  const names = [...opts.names, ...(opts.file ? await readCandidateFile(opts.file) : [])];
  if (!names.length) {
    console.error(HELP);
    return 2;
  }

  const domains = expand(names, opts.tlds);
  const bootstrap = await loadBootstrap();

  // A wide sweep prints nothing until every lookup lands, which is indistinguishable
  // from a hang. Tick each completion to stderr so progress is visible; stdout stays
  // clean for piping.
  let done = 0;
  const progress = process.stderr.isTTY
    ? (r) => process.stderr.write(`\r${++done}/${domains.length} checked (${r.domain})`.padEnd(60))
    : () => ++done;

  const results = await mapPool(domains, CONCURRENCY, async (d) => {
    const r = await check(d, bootstrap);
    progress(r);
    return r;
  });
  if (process.stderr.isTTY) process.stderr.write('\r'.padEnd(61) + '\r');
  // The tally always counts every lookup; --available only narrows what's printed.
  const shown = opts.availableOnly ? results.filter((r) => r.state === 'available') : results;

  if (opts.json) {
    console.log(JSON.stringify(shown, null, 2));
  } else {
    const width = Math.max(1, ...shown.map((r) => r.domain.length));
    const MARK = {
      available: '✓',
      'likely-free': '~',
      taken: '✗',
      'likely-taken': '×',
      unknown: '?',
      invalid: '!',
    };
    const order = {
      available: 0,
      'likely-free': 1,
      taken: 2,
      'likely-taken': 3,
      unknown: 4,
      invalid: 5,
    };
    for (const r of [...shown].sort(
      (a, b) => order[a.state] - order[b.state] || a.domain.localeCompare(b.domain),
    )) {
      const detail = r.detail ? `  ${r.detail}` : '';
      console.log(`${MARK[r.state]} ${r.domain.padEnd(width)}  ${r.state}${detail}`);
    }
    const count = (s) => results.filter((r) => r.state === s).length;
    console.error(
      `\n${count('available')} available, ${count('taken')} taken, ` +
        `${count('likely-free')} likely free, ${count('likely-taken')} likely taken, ` +
        `${count('unknown') + count('invalid')} inconclusive, of ${results.length} checked.`,
    );
  }

  // Only a total washout is a failure — a few inconclusive registries are normal.
  return results.every((r) => r.state === 'unknown') ? 1 : 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(`check-domains: ${err.message}`);
    process.exit(1);
  },
);
