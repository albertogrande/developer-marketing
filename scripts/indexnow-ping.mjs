#!/usr/bin/env node
// IndexNow ping — tell the search indexes (Bing's feeds ChatGPT Search;
// Seznam, Naver, Yandex also subscribe) which URLs changed, the moment a
// deploy publishes them. Freshness is a first-class ranking signal for
// answer engines, so the gap between "the newsroom shipped it" and "an agent
// can cite it" should be hours, not days.
//
// Usage:  BASE_SHA=<previous deployed commit> node scripts/indexnow-ping.mjs
//         node scripts/indexnow-ping.mjs --dry-run
//
// Changed content files between BASE_SHA..HEAD_SHA map to the pages whose
// rendered output they affect (entry page or gallery, collection index,
// home) via scripts/lib/routes.mjs. No BASE_SHA (or an unknown one, e.g.
// after a force-push) degrades to pinging every page — never to silence.
// A ping failure warns but exits 0: the deploy already succeeded, and a
// missed ping only delays recrawl. A missing key file is a misconfiguration
// and fails loudly.

import { execSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { allPageRoutes, routesForContentFile, siteConfig } from './lib/routes.mjs';

const DRY = process.argv.includes('--dry-run');
const ENDPOINT = 'https://api.indexnow.org/indexnow';

const { site, base } = siteConfig();
if (!site) {
  console.error('indexnow-ping: no site in astro.config.mjs');
  process.exit(1);
}
const host = new URL(site).host;

// The key ships in public/ as <32-hex>.txt containing itself; keyLocation in
// a subdirectory scopes submissions to URLs under the base path — exactly
// right for a project site (and lands at the domain root on a custom domain).
const keyFile = readdirSync('public').find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) {
  console.error('indexnow-ping: no IndexNow key file in public/ (expected <32-hex>.txt)');
  process.exit(1);
}
const key = readFileSync(`public/${keyFile}`, 'utf8').trim();
const keyLocation = `${site}${base}/${keyFile}`;

const absolute = (route) => `${site}${base}${route === '/' ? '/' : `${route}/`}`;

const baseSha = process.env.BASE_SHA ?? '';
const headSha = process.env.HEAD_SHA || 'HEAD';

const shaKnown = (sha) => {
  if (!sha) return false;
  try {
    execSync(`git cat-file -e ${sha}^{commit}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

let routes;
let reason;
if (shaKnown(baseSha)) {
  const diff = execSync(`git diff --name-only ${baseSha} ${headSha} -- src/content`, {
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean);
  if (!diff.length) {
    console.log(`indexnow-ping: no content changed in ${baseSha.slice(0, 7)}..${headSha} — nothing to submit`);
    process.exit(0);
  }
  routes = [...new Set(diff.flatMap(routesForContentFile))];
  reason = `${diff.length} changed content file(s) since ${baseSha.slice(0, 7)}`;
} else {
  routes = allPageRoutes();
  reason = baseSha ? `unknown BASE_SHA ${baseSha.slice(0, 7)} — full ping` : 'no BASE_SHA — full ping';
}

const urlList = routes.map(absolute).slice(0, 10000);
const payload = { host, key, keyLocation, urlList };

console.log(`indexnow-ping: ${reason} → ${urlList.length} URL(s)`);
for (const u of urlList.slice(0, 20)) console.log(`  ${u}`);
if (urlList.length > 20) console.log(`  … +${urlList.length - 20} more`);

if (DRY) {
  console.log('indexnow-ping: dry run — not submitting');
  process.exit(0);
}

try {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });
  // 200 = submitted, 202 = key validation pending — both fine.
  console.log(`indexnow-ping: ${ENDPOINT} → HTTP ${res.status}`);
  if (res.status >= 400) {
    console.warn(`indexnow-ping: submission rejected (${res.status} ${await res.text()}) — continuing; the sitemap still carries the change`);
  }
} catch (e) {
  console.warn(`indexnow-ping: network failure (${e.message}) — continuing; the sitemap still carries the change`);
}
