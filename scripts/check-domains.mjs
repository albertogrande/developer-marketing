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
// Identity Digital operates .io/.sh/.ac; each verified to answer 200 for a
// registered name and 404 for a free one.
const OVERRIDES = new Map([
  ['io', 'https://rdap.identitydigital.services/rdap'],
  ['sh', 'https://rdap.identitydigital.services/rdap'],
  ['ac', 'https://rdap.identitydigital.services/rdap'],
]);
const DEFAULT_TLDS = ['dev', 'com', 'io'];
const TIMEOUT_MS = 10_000;
const CONCURRENCY = 6;
const MAX_RETRIES = 3;
const UA =
  'Mozilla/5.0 (compatible; developer-marketing-domaincheck/1.0; +https://albertogrande.github.io/developer-marketing/)';

// A label is 1–63 chars of a-z, 0-9 and inner hyphens (RFC 1035 + RFC 3696).
const LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

function parseArgs(argv) {
  const names = [];
  let tlds = null;
  let file = null;
  let json = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--json') json = true;
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

async function getJson(url, { retries = MAX_RETRIES } = {}) {
  for (let attempt = 0; ; attempt++) {
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
      await sleep(Number.isFinite(after) && after > 0 ? after * 1000 : 500 * 2 ** attempt);
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
    return { domain, state: 'unknown', detail: `no RDAP service found for .${tld}` };
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

  node scripts/check-domains.mjs <name|domain>... [--tlds dev,com,io] [--file list.txt] [--json]

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
  const results = await mapPool(domains, CONCURRENCY, (d) => check(d, bootstrap));

  if (opts.json) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    const width = Math.max(...results.map((r) => r.domain.length));
    const MARK = { available: '✓', taken: '✗', unknown: '?', invalid: '!' };
    const order = { available: 0, taken: 1, unknown: 2, invalid: 3 };
    for (const r of [...results].sort(
      (a, b) => order[a.state] - order[b.state] || a.domain.localeCompare(b.domain),
    )) {
      const detail = r.detail ? `  ${r.detail}` : '';
      console.log(`${MARK[r.state]} ${r.domain.padEnd(width)}  ${r.state}${detail}`);
    }
    const count = (s) => results.filter((r) => r.state === s).length;
    console.error(
      `\n${count('available')} available, ${count('taken')} taken, ` +
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
