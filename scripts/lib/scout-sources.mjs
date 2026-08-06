// The scout's watchlist and the event log's pure logic, in one module so the
// sweep tool, the enrich/query tools and the tests share a single source of
// truth (the same pattern as ./podcasts.mjs for the podcast pipeline).
//
// The registry is data on purpose: widening coverage — a new feed, another
// HN query, one more subreddit — is an edit here, not new code. Every feed
// carries the date it was last verified to resolve; a feed that rots shows
// up in the sweep's failure list, never breaks the run. Autodiscovery tip:
// most blogs advertise their feed in a <link rel="alternate"> tag — curl the
// page and grep for rss/atom before declaring a candidate feedless.
//
// The event DB this feeds (signals/db/<ISO-week>.ndjson) is append-only:
// one JSON line per event, keyed by a stable id derived from the normalized
// URL, later lines with the same id merging over earlier ones (last-write-
// wins on replay — the newsletter store's doctrine). Nothing edits a line in
// place; enrichment appends.

import { createHash } from 'node:crypto';
import { isoWeekId } from '../../src/lib/dates.mjs';

// ---------------------------------------------------------------------------
// The RSS/Atom watchlist. kind: practitioner | operator | newsletter |
// research. posture: independent | vendor — vendor feeds are data about the
// vendor (the wire flags self-reported claims; the enum keeps that context
// queryable). All feeds verified 2026-08-06; candidates that failed then
// (devrelweekly 525, draft.dev/leerob/netlify/resend/planetscale/markepear/
// slashdata 404s, commonroom no feed, reforge 500) are deliberately absent —
// re-verify before adding.

export const SOURCES = [
  // Practitioners & newsletters — independent voices.
  { id: 'lennys-newsletter', name: "Lenny's Newsletter", feed: 'https://www.lennysnewsletter.com/feed', kind: 'practitioner', posture: 'independent' },
  { id: 'elena-verna', name: "Elena Verna", feed: 'https://www.elenaverna.com/feed', kind: 'practitioner', posture: 'independent' },
  { id: 'developer-marketing-alliance', name: 'Developer Marketing Alliance', feed: 'https://www.developermarketing.io/rss/', kind: 'practitioner', posture: 'independent' },
  { id: 'console-dev', name: 'Console.dev', feed: 'https://console.dev/rss.xml', kind: 'newsletter', posture: 'independent' },
  { id: 'tldr-tech', name: 'TLDR Tech', feed: 'https://tldr.tech/api/rss/tech', kind: 'newsletter', posture: 'independent' },
  { id: 'sdtimes', name: 'SD Times', feed: 'https://sdtimes.com/feed/', kind: 'newsletter', posture: 'independent' },
  { id: 'techcrunch-startups', name: 'TechCrunch Startups', feed: 'https://techcrunch.com/category/startups/feed/', kind: 'newsletter', posture: 'independent' },

  // Operators — how developer-first companies actually run docs/DX/community.
  { id: 'stripe-blog', name: 'Stripe blog', feed: 'https://stripe.com/blog/feed.rss', kind: 'operator', posture: 'vendor' },
  { id: 'vercel-blog', name: 'Vercel blog', feed: 'https://vercel.com/atom', kind: 'operator', posture: 'vendor' },
  { id: 'github-blog', name: 'GitHub blog', feed: 'https://github.blog/feed/', kind: 'operator', posture: 'vendor' },
  { id: 'supabase-blog', name: 'Supabase blog', feed: 'https://supabase.com/rss.xml', kind: 'operator', posture: 'vendor' },
  { id: 'sentry-blog', name: 'Sentry blog', feed: 'https://blog.sentry.io/feed.xml', kind: 'operator', posture: 'vendor' },
  { id: 'postman-blog', name: 'Postman blog', feed: 'https://blog.postman.com/feed/', kind: 'operator', posture: 'vendor' },
  { id: 'mongodb-blog', name: 'MongoDB blog', feed: 'https://www.mongodb.com/blog/rss', kind: 'operator', posture: 'vendor' },
  { id: 'twilio-blog', name: 'Twilio blog', feed: 'https://www.twilio.com/en-us/blog/feed', kind: 'operator', posture: 'vendor' },
  { id: 'auth0-blog', name: 'Auth0 blog', feed: 'https://auth0.com/blog/rss.xml', kind: 'operator', posture: 'vendor' },
  { id: 'microsoft-devblogs', name: 'Microsoft DevBlogs', feed: 'https://devblogs.microsoft.com/feed/', kind: 'operator', posture: 'vendor' },
  { id: 'netlify-blog', name: 'Netlify blog', feed: 'https://www.netlify.com/feed.xml', kind: 'operator', posture: 'vendor' },
  { id: 'resend-blog', name: 'Resend blog', feed: 'https://resend.com/blog/rss.xml', kind: 'operator', posture: 'vendor' },
  { id: 'commonroom-blog', name: 'Common Room blog', feed: 'https://www.commonroom.io/rss.xml', kind: 'practitioner', posture: 'vendor' },

  // Research & data.
  { id: 'slashdata-blog', name: 'SlashData blog', feed: 'https://www.slashdata.co/blog-feed.xml', kind: 'research', posture: 'independent' },

  // Launch trackers.
  { id: 'producthunt-devtools', name: 'Product Hunt — developer tools', feed: 'https://www.producthunt.com/feed?category=developer-tools', kind: 'newsletter', posture: 'independent' },
];

// ---------------------------------------------------------------------------
// Feedless sources, two shapes. SITEMAPS: sites whose sitemap.xml carries
// <lastmod> — as window-filterable as a feed, just without titles (we
// humanize the slug; the scout's triage has the URL). CRAWLS: sites with
// neither feed nor dated sitemap — the blog index page is fetched, links
// matching the pattern are extracted with their anchor text, and *only URLs
// never seen before* become events (ts = capture time, same honesty rule as
// a late-surfaced wire item). First contact with a crawl source seeds
// signals/db/.crawl-seen.json silently instead of flooding the log with the
// site's whole back catalogue.

export const SITEMAPS = [
  { id: 'reforge-blog', name: 'Reforge blog', sitemap: 'https://www.reforge.com/sitemap.xml', include: '^https://www\.reforge\.com/blog/.+', kind: 'practitioner', posture: 'independent' },
  { id: 'leerob', name: 'Lee Robinson', sitemap: 'https://leerob.com/sitemap.xml', include: '^https://leerob\.com/[a-z0-9-]+$', exclude: '^https://leerob\.com/(writing|stack|uses|work|links|vercel)$', kind: 'practitioner', posture: 'independent' },
];

export const CRAWLS = [
  { id: 'markepear', name: 'Markepear', page: 'https://www.markepear.dev/blog', base: 'https://www.markepear.dev', linkPattern: '^/blog/[a-z0-9-]+$', take: 12, kind: 'practitioner', posture: 'independent' },
  { id: 'draft-dev', name: 'Draft.dev', page: 'https://draft.dev/learn', base: 'https://draft.dev', linkPattern: '^/learn/[a-z0-9-]+$', take: 12, kind: 'practitioner', posture: 'independent' },
];

// ---------------------------------------------------------------------------
// Community firehoses, scoped by query — the watchlist captures matches, not
// the whole site. Reddit and Bluesky refuse some datacenter networks with a
// 403; the sweep tolerates that (failures reported, never fatal).

export const COMMUNITY = {
  // Algolia HN API — always fetchable, exact timestamps.
  hnQueries: ['devrel', '"developer marketing"', '"developer experience"', 'documentation', 'devtools pricing'],
  // Show HN is where the small launches the wire exists for land.
  hnShowQueries: ['devtool', 'developer', 'API', 'CLI', 'SDK'],
  // r/devrel is small — take it whole; the big ones are keyword-filtered.
  subreddits: [
    { name: 'devrel', mode: 'all' },
    { name: 'marketing', mode: 'filtered' },
    { name: 'SaaS', mode: 'filtered' },
    { name: 'ExperiencedDevs', mode: 'filtered' },
  ],
  // Applied to filtered subreddits and to Lobsters' newest stream.
  keywords: ['developer', 'devrel', 'devtool', 'api', 'sdk', 'docs', 'documentation', 'open source', 'pricing', 'launch'],
  bskyQueries: ['"developer relations"', '"developer marketing"', 'devrel'],
};

// Valid enums — the enrich tool validates against these, and agents filter on
// them, so extend deliberately (same rule as the site's schema vocabularies).
export const CHANNELS = ['rss', 'hn', 'reddit', 'lobsters', 'bluesky', 'producthunt', 'crawl', 'search', 'manual'];
export const EVENT_KINDS = ['launch', 'release', 'funding', 'acquisition', 'pricing', 'deprecation', 'research', 'campaign', 'content', 'discussion', 'podcast', 'hiring', 'other'];
export const ENTITY_KINDS = ['company', 'tool', 'person', 'protocol', 'show'];
export const SOURCE_KINDS = ['practitioner', 'operator', 'newsletter', 'research', 'podcast'];

// ---------------------------------------------------------------------------
// Feed parsing — RSS 2.0 *and* Atom, unlike podcasts.mjs's parseFeed (which
// is deliberately podcast-shaped and untouched). Regex/string work, no XML
// dependency, per house style.

const unwrap = (s = '') => s.replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1').trim();

const tagText = (block, tag) => {
  const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? unwrap(m[1]) : undefined;
};

const attrOf = (block, tag, name) => {
  const m = block.match(new RegExp(`<${tag}\\b[^>]*\\b${name}=["']([^"']+)["'][^>]*/?>`, 'i'));
  return m ? m[1] : undefined;
};

const decodeEntities = (s = '') =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, '&');

// HTML → a short plain-text snippet. The DB stores a pointer plus an index
// line, never the article body (size and copyright both say no).
export const snippet = (html = '', max = 300) => {
  const text = decodeEntities(html.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text || undefined;
};

const firstDate = (block, tags) => {
  for (const t of tags) {
    const raw = tagText(block, t);
    if (!raw) continue;
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return undefined;
};

// One parser for both syndication dialects. Returns { feedTitle, items } with
// items of { title, link, date?, summary?, author? } — the sweep maps these
// to events.
export function parseAnyFeed(xml) {
  const isAtom = /<feed[\s>]/.test(xml) && !/<rss[\s>]/.test(xml);
  const rawItems = isAtom
    ? xml.split(/<entry(?:\s[^>]*)?>/).slice(1).map((b) => b.split('</entry>')[0])
    : xml.split(/<item(?:\s[^>]*)?>/).slice(1).map((b) => b.split('</item>')[0]);

  const head = isAtom ? xml.split(/<entry(?:\s[^>]*)?>/)[0] : xml.split(/<item(?:\s[^>]*)?>/)[0];
  const feedTitle = tagText(head, 'title');

  const items = rawItems.map((block) => {
    // Atom links live in href attributes; prefer rel="alternate", fall back
    // to the first <link>. RSS links are element text.
    let link = tagText(block, 'link');
    if (!link || link === '') {
      const alt = block.match(/<link\b[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i);
      link = alt ? alt[1] : attrOf(block, 'link', 'href');
    }
    const date = firstDate(block, ['pubDate', 'published', 'updated', 'dc:date']);
    const summary = snippet(
      tagText(block, 'description') ?? tagText(block, 'content:encoded') ?? tagText(block, 'summary') ?? tagText(block, 'content') ?? ''
    );
    const author = tagText(block, 'dc:creator') ?? tagText(block, 'name');
    return {
      title: decodeEntities(tagText(block, 'title') ?? '').trim() || undefined,
      link: link?.trim() || undefined,
      date,
      summary,
      author,
    };
  });

  return { feedTitle, items: items.filter((i) => i.title && i.link) };
}

// A sitemap gives URLs and dates but no titles — a humanized slug is honest
// and good enough for triage (the model has the URL for anything better).
export const humanizeSlug = (url) => {
  const slug = url.replace(/\/$/, '').split('/').pop() ?? '';
  const words = slug.replace(/[-_]+/g, ' ').trim();
  return words ? words[0].toUpperCase() + words.slice(1) : url;
};

// <urlset> → [{ loc, lastmod? }]. Regex/string work like the feed parser.
export function parseSitemap(xml) {
  return xml
    .split(/<url(?:\s[^>]*)?>/)
    .slice(1)
    .map((b) => b.split('</url>')[0])
    .map((block) => {
      const loc = tagText(block, 'loc');
      const raw = tagText(block, 'lastmod');
      const d = raw ? new Date(raw) : undefined;
      return { loc, lastmod: d && !Number.isNaN(d.getTime()) ? d : undefined };
    })
    .filter((u) => u.loc);
}

// Blog-index links in document order (listing pages put newest first), with
// anchor text as the title. Deduped by URL, pattern applied to the href as
// written (relative form).
export function extractLinks(html, { pattern, base }) {
  const re = new RegExp(pattern);
  const seen = new Set();
  const out = [];
  for (const m of html.matchAll(/<a\b[^>]*href="([^"#?]+)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = m[1];
    if (!re.test(href)) continue;
    const url = href.startsWith('http') ? href : `${base}${href}`;
    if (seen.has(url)) continue;
    seen.add(url);
    const text = snippet(m[2], 140);
    out.push({ url, text: text || humanizeSlug(url) });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Event identity and normalization.

// Tracking params and cosmetic URL differences must not fork an event's
// identity — the id is the dedupe key across sweeps and channels.
export function normalizeUrl(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    return raw.trim();
  }
  u.hash = '';
  const params = [...u.searchParams.keys()];
  for (const k of params) {
    if (/^(utm_|ref$|ref_|source$|fbclid|gclid)/i.test(k)) u.searchParams.delete(k);
  }
  u.hostname = u.hostname.toLowerCase();
  let s = u.toString();
  if (u.pathname !== '/' && s.endsWith('/')) s = s.slice(0, -1);
  return s;
}

export const eventId = (url) =>
  createHash('sha256').update(normalizeUrl(url)).digest('hex').slice(0, 12);

// The one place the event shape is decided. `ts` is the item's own timestamp
// when the source gives one, else the sweep time the caller passes.
export function normalizeEvent({ ts, source, channel, title, url, summary, author }) {
  const when = ts instanceof Date ? ts : new Date(ts);
  return {
    id: eventId(url),
    ts: when.toISOString(),
    week: isoWeekId(when),
    source,
    channel,
    title: String(title).trim(),
    url: normalizeUrl(url),
    ...(summary ? { summary } : {}),
    ...(author ? { author } : {}),
    entities: [],
    topics: [],
  };
}

// ---------------------------------------------------------------------------
// Community JSON → events. Each mapper is pure (fixture-testable) and returns
// possibly-empty arrays; the sweep supplies the fetch.

export function hnToEvents(json, { source = 'hackernews' } = {}) {
  return (json?.hits ?? [])
    .filter((h) => h.title && (h.url || h.objectID))
    .map((h) =>
      normalizeEvent({
        ts: h.created_at,
        source,
        channel: 'hn',
        title: h.title,
        url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
        summary: snippet(h.story_text ?? ''),
        author: h.author,
      })
    );
}

export function redditToEvents(json, { subreddit, keywords = [] } = {}) {
  const posts = (json?.data?.children ?? []).map((c) => c.data).filter((p) => p?.title);
  const wanted = keywords.length
    ? posts.filter((p) => {
        const hay = `${p.title} ${p.selftext ?? ''}`.toLowerCase();
        return keywords.some((k) => hay.includes(k.toLowerCase()));
      })
    : posts;
  return wanted.map((p) =>
    normalizeEvent({
      ts: new Date(p.created_utc * 1000),
      source: `r/${subreddit}`,
      channel: 'reddit',
      title: p.title,
      url: `https://www.reddit.com${p.permalink}`,
      summary: snippet(p.selftext ?? ''),
      author: p.author,
    })
  );
}

export function lobstersToEvents(json, { keywords = [] } = {}) {
  const stories = (Array.isArray(json) ? json : []).filter((s) => s?.title);
  const wanted = keywords.length
    ? stories.filter((s) => {
        const hay = `${s.title} ${(s.tags ?? []).join(' ')}`.toLowerCase();
        return keywords.some((k) => hay.includes(k.toLowerCase()));
      })
    : stories;
  return wanted.map((s) =>
    normalizeEvent({
      ts: s.created_at,
      source: 'lobsters',
      channel: 'lobsters',
      title: s.title,
      url: s.url || s.comments_url || `https://lobste.rs/s/${s.short_id}`,
      author: s.submitter_user,
    })
  );
}

export function bskyToEvents(json, { query } = {}) {
  return (json?.posts ?? [])
    .filter((p) => p?.record?.text && p?.uri)
    .map((p) => {
      // at://did:plc:xyz/app.bsky.feed.post/abc → a stable https URL.
      const [, did, , rkey] = p.uri.replace('at://', '').match(/^([^/]+)\/([^/]+)\/(.+)$/)?.slice(0) ?? [];
      const handle = p.author?.handle ?? did;
      return normalizeEvent({
        ts: p.record.createdAt ?? p.indexedAt,
        source: `bsky:${query}`,
        channel: 'bluesky',
        title: snippet(p.record.text, 120) ?? p.record.text.slice(0, 120),
        url: `https://bsky.app/profile/${handle}/post/${rkey ?? ''}`,
        summary: snippet(p.record.text),
        author: handle,
      });
    });
}

// ---------------------------------------------------------------------------
// DB replay. Append-only file, last line with an id wins — enrichment appends
// a fuller line rather than editing. Torn lines (a killed run mid-append)
// warn and skip, never throw: the log must always be readable.

export function readDb(text, { warn = console.warn } = {}) {
  const byId = new Map();
  let lineNo = 0;
  for (const line of text.split('\n')) {
    lineNo++;
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const rec = JSON.parse(trimmed);
      if (!rec?.id) continue;
      byId.set(rec.id, { ...byId.get(rec.id), ...rec });
    } catch {
      warn(`scout-db: skipping unparsable line ${lineNo}`);
    }
  }
  return byId;
}

export const dbFileFor = (date) => `signals/db/${isoWeekId(date)}.ndjson`;

export { isoWeekId };
