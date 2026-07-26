// Shared route + frontmatter knowledge for the Node-side tooling: the
// referential-integrity gate (check-refs.mjs), the sitemap lastmod hook
// (astro.config.mjs), the agent-surface gate (check-agent-surface.mjs), and
// the IndexNow ping (indexnow-ping.mjs). One module so the route table and
// date logic can't drift between them.
//
// Route strings here are base-less and slashless ('/guide/02-docs'), the same
// internal convention `related[].href` uses; consumers add the site base
// and/or trailing slash for their own surface.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

// ---------------------------------------------------------------------------
// Site config

// site/base as written in astro.config.mjs — either as the SITE/BASE consts
// or inline in defineConfig. One extractor so no script greps the config
// with its own regex (that drifted once already).
export function siteConfig() {
  const config = readFileSync('astro.config.mjs', 'utf8');
  const site =
    (config.match(/SITE = '([^']+)'/) || config.match(/site:\s*'([^']+)'/) || [])[1] || '';
  const base =
    (config.match(/BASE = '([^']*)'/) || config.match(/base:\s*'([^']*)'/) || [])[1] || '';
  return { site, base };
}

// ---------------------------------------------------------------------------
// Frontmatter

export function frontmatterOf(file) {
  const text = readFileSync(file, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  let fm = {};
  if (m) {
    try {
      fm = parseYaml(m[1]) ?? {};
    } catch (e) {
      return { fm: null, body: text, err: e.message };
    }
  }
  return { fm, body: m ? text.slice(m[0].length) : text };
}

const mdFiles = (dir) =>
  existsSync(dir) ? readdirSync(dir).filter((f) => /\.mdx?$/.test(f)) : [];

// ---------------------------------------------------------------------------
// Collections

// dir → page route for one entry; `page: false` collections render as
// #anchors on their gallery page instead of standalone pages.
export const COLLECTIONS = {
  guide: { dir: 'src/content/guide', index: '/guide', page: true },
  articles: { dir: 'src/content/articles', index: '/articles', page: true },
  weekly: { dir: 'src/content/weekly', index: '/weekly', page: true },
  'deep-dives': { dir: 'src/content/deep-dives', index: '/deep-dives', page: true },
  radar: { dir: 'src/content/radar', index: '/radar', page: true },
  practices: { dir: 'src/content/practices', index: '/practices', page: false },
  examples: { dir: 'src/content/examples', index: '/examples', page: false },
  skills: { dir: 'src/content/skills', index: '/skills', page: false },
};

// Every entry across every collection: { collection, id, file, fm, body, err }.
export function contentEntries() {
  const out = [];
  for (const [collection, { dir }] of Object.entries(COLLECTIONS)) {
    for (const f of mdFiles(dir)) {
      const file = `${dir}/${f}`;
      out.push({ collection, id: f.replace(/\.mdx?$/, ''), file, ...frontmatterOf(file) });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Dates

// Frontmatter dates arrive as 'YYYY-MM-DD' strings (YAML 1.2 core schema) but
// tolerate Date instances; ISO date strings compare lexicographically.
const day = (v) =>
  v instanceof Date ? v.toISOString().slice(0, 10) : typeof v === 'string' ? v.slice(0, 10) : undefined;
const newest = (...vs) => vs.map(day).filter(Boolean).sort().pop();

// The honest last-changed date for one entry, from whichever date-ish fields
// its collection carries (date, updated, verified, probe.date).
export function entryLastmod(fm) {
  return newest(fm?.date, fm?.updated, fm?.verified, fm?.probe?.date);
}

// base-less slashless route → 'YYYY-MM-DD' for every page that has an honest
// date: entry pages, collection indexes, galleries, tag pages, and home.
// /about is deliberately absent (no dated content).
export function routeLastmod() {
  const map = new Map();
  const bump = (route, d) => {
    if (!d) return;
    const cur = map.get(route);
    if (!cur || d > cur) map.set(route, d);
  };

  for (const { collection, id, fm } of contentEntries()) {
    if (!fm) continue;
    const { index, page } = COLLECTIONS[collection];
    const d = entryLastmod(fm);
    if (page) bump(`${index}/${id}`, d);
    bump(index, d);
    bump('/', d);
    for (const t of fm.tags ?? []) {
      if (typeof t === 'string') {
        bump(`/tags/${t}`, d);
        bump('/tags', d);
      }
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Routes

// Static routes derived from src/pages/ — index.astro → parent dir, foo.astro
// → /foo, name.ext.ts → /name.ext. Dynamic ([param]) and 404 excluded.
export function pageRoutes(dir = 'src/pages', prefix = '') {
  const routes = new Set();
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      for (const r of pageRoutes(full, `${prefix}/${entry}`)) routes.add(r);
      continue;
    }
    if (entry.includes('[') || entry.startsWith('404')) continue;
    if (entry.endsWith('.astro')) {
      const name = entry.replace(/\.astro$/, '');
      routes.add(name === 'index' ? prefix || '/' : `${prefix}/${name}`);
    } else if (entry.endsWith('.ts')) {
      routes.add(`${prefix}/${entry.replace(/\.ts$/, '')}`);
    }
  }
  return routes;
}

// Every crawlable HTML page route (no machine endpoints): statics + entry
// pages + tag pages. Used for the IndexNow full-ping fallback and gate checks.
export function allPageRoutes() {
  const routes = new Set([...pageRoutes()].filter((r) => !/\.[a-z]+$/.test(r)));
  const tags = new Set();
  for (const { collection, id, fm } of contentEntries()) {
    if (!fm) continue;
    if (COLLECTIONS[collection].page) routes.add(`${COLLECTIONS[collection].index}/${id}`);
    for (const t of fm.tags ?? []) if (typeof t === 'string') tags.add(t);
  }
  for (const t of tags) routes.add(`/tags/${t}`);
  return [...routes].sort();
}

// A changed content file → the page routes whose rendered output it affects
// (its own page or gallery, the collection index, and home). Non-content
// paths return []. Used by the IndexNow ping.
export function routesForContentFile(path) {
  const m = path.match(/^src\/content\/([^/]+)\/([^/]+)\.mdx?$/);
  if (!m || !COLLECTIONS[m[1]]) return [];
  const { index, page } = COLLECTIONS[m[1]];
  return page ? [`${index}/${m[2]}`, index, '/'] : [index, '/'];
}
