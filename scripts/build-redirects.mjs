#!/usr/bin/env node
// Build the GitHub Pages redirect layer. The site's home is Vercel
// (site.config.mjs); the old Pages deployment must keep every URL it ever
// served working — citations, feed subscriptions, agent bookmarks — so this
// emits a stub per route into dist/: HTML stubs with an instant meta refresh
// plus rel=canonical (the consolidation signal search engines follow),
// pointer stubs for the machine endpoints in their own media type, and a
// robots.txt whose Sitemap line points at the new home.
//
// Pages serves this artifact under /developer-marketing/, mirroring the old
// URL space path-for-path; the new site serves the same paths at its root.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { allPageRoutes, contentEntries, COLLECTIONS, siteConfig } from './lib/routes.mjs';

const DIST = 'dist';
const { site, base } = siteConfig();
if (base !== '') {
  console.error(
    `build-redirects: site.config.mjs says the site lives under "${base}" — redirect stubs are only for the root deployment. Refusing.`
  );
  process.exit(1);
}

const newUrl = (route) => `${site}${route === '/' ? '/' : `${route}/`}`;
const write = (rel, content) => {
  const file = join(DIST, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
};

const htmlStub = (to) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Moved — Developer Marketing</title>
<link rel="canonical" href="${to}">
<meta http-equiv="refresh" content="0;url=${to}">
</head>
<body>
<p>This page moved to <a href="${to}">${to}</a>.</p>
</body>
</html>
`;

let count = 0;

// Every HTML page the old site ever served.
for (const route of allPageRoutes()) {
  const to = newUrl(route);
  write(route === '/' ? 'index.html' : `${route.slice(1)}/index.html`, htmlStub(to));
  count++;
}
write('404.html', htmlStub(newUrl('/')));

// Raw-markdown siblings → one-line markdown pointers.
for (const { collection, id } of contentEntries()) {
  const to = `${site}/${collection}/${id}.md`;
  write(`${collection}/${id}.md`, `Moved: ${to}\n`);
  count++;
}

// JSON endpoints → a JSON body agents can still parse.
for (const name of [...Object.keys(COLLECTIONS).map((c) => `${c}.json`), 'api.json', 'feed.json']) {
  write(name, `${JSON.stringify({ moved_to: `${site}/${name}` }, null, 2)}\n`);
  count++;
}

// llms files → markdown pointers in the llmstxt shape.
for (const name of ['llms.txt', 'llms-full.txt']) {
  write(
    name,
    `# Developer Marketing — a field guide\n\n> This site moved to ${site}/ — the current ${name} lives at ${site}/${name}.\n`
  );
  count++;
}

// A minimal valid Atom feed announcing the move, for any subscribed reader.
write(
  'feed.xml',
  `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Developer Marketing — a field guide (moved)</title>
  <link href="${site}/feed.xml" rel="alternate" type="application/atom+xml"/>
  <link href="${site}/" rel="alternate" type="text/html"/>
  <updated>2026-07-26T00:00:00Z</updated>
  <id>${site}/feed.xml</id>
  <entry>
    <title>This feed moved</title>
    <link href="${site}/feed.xml"/>
    <id>${site}/feed.xml#moved</id>
    <updated>2026-07-26T00:00:00Z</updated>
    <summary>Developer Marketing now publishes from ${site}/ — resubscribe at ${site}/feed.xml.</summary>
  </entry>
</feed>
`
);

// robots.txt for the old host path: allow everything, point at the new sitemap.
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap-index.xml\n`);

console.log(`build-redirects: ${count + 3} stubs → dist/ (target ${site}/)`);
