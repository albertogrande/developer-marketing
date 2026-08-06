// Pins the scout event pipeline's pure logic: feed parsing across both
// syndication dialects, event identity (the dedupe key), the append-only
// replay, the community mappers, and the registry's own integrity. All
// offline — fixtures are inline strings, exactly like podcast-transcripts.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SOURCES,
  COMMUNITY,
  CHANNELS,
  EVENT_KINDS,
  SOURCE_KINDS,
  parseAnyFeed,
  snippet,
  normalizeUrl,
  eventId,
  normalizeEvent,
  hnToEvents,
  redditToEvents,
  lobstersToEvents,
  bskyToEvents,
  readDb,
  dbFileFor,
} from './lib/scout-sources.mjs';

const RSS = `<?xml version="1.0"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
  <title>Example Blog</title>
  <item>
    <title><![CDATA[Pricing v2 &amp; caps]]></title>
    <link>https://example.com/pricing-v2?utm_source=rss</link>
    <pubDate>Tue, 04 Aug 2026 09:00:00 GMT</pubDate>
    <description><![CDATA[<p>We changed <b>pricing</b> today.</p>]]></description>
    <dc:creator>Ana</dc:creator>
  </item>
  <item>
    <title>No date item</title>
    <link>https://example.com/undated</link>
  </item>
</channel>
</rss>`;

const ATOM = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom Blog</title>
  <entry>
    <title>Launch week day one</title>
    <link rel="alternate" href="https://atom.example.com/launch/"/>
    <published>2026-08-05T10:00:00Z</published>
    <summary>Short summary here.</summary>
    <author><name>Bo</name></author>
  </entry>
</feed>`;

test('parseAnyFeed reads RSS items with CDATA titles, entities decoded, and creators', () => {
  const { feedTitle, items } = parseAnyFeed(RSS);
  assert.equal(feedTitle, 'Example Blog');
  assert.equal(items.length, 2);
  assert.equal(items[0].title, 'Pricing v2 & caps');
  assert.equal(items[0].link, 'https://example.com/pricing-v2?utm_source=rss');
  assert.equal(items[0].date.toISOString(), '2026-08-04T09:00:00.000Z');
  assert.equal(items[0].summary, 'We changed pricing today.');
  assert.equal(items[0].author, 'Ana');
  assert.equal(items[1].date, undefined, 'undated items survive parsing; the sweep decides');
});

test('parseAnyFeed reads Atom entries, including the href attribute link form', () => {
  const { items } = parseAnyFeed(ATOM);
  assert.equal(items.length, 1);
  assert.equal(items[0].title, 'Launch week day one');
  assert.equal(items[0].link, 'https://atom.example.com/launch/');
  assert.equal(items[0].date.toISOString(), '2026-08-05T10:00:00.000Z');
  assert.equal(items[0].author, 'Bo');
});

test('snippet strips tags, collapses whitespace, and caps length with an ellipsis', () => {
  assert.equal(snippet('<p>a  b</p>'), 'a b');
  const long = snippet(`<div>${'x'.repeat(400)}</div>`);
  assert.equal(long.length, 300);
  assert.ok(long.endsWith('…'));
  assert.equal(snippet(''), undefined, 'empty input yields no summary field');
});

test('normalizeUrl drops tracking params, hashes and trailing slashes — but keeps real query params', () => {
  assert.equal(
    normalizeUrl('https://Example.com/post/?utm_source=x&utm_campaign=y#top'),
    'https://example.com/post'
  );
  assert.equal(normalizeUrl('https://example.com/a?page=2'), 'https://example.com/a?page=2');
});

test('eventId is stable across cosmetic URL variants — the dedupe key must not fork', () => {
  assert.equal(eventId('https://example.com/post?utm_source=rss'), eventId('https://example.com/post/'));
  assert.notEqual(eventId('https://example.com/a'), eventId('https://example.com/b'));
});

test('normalizeEvent stamps id, ISO ts, the ISO week, and empty enrichment fields', () => {
  const ev = normalizeEvent({
    ts: new Date('2026-08-04T09:00:00Z'),
    source: 'stripe-blog',
    channel: 'rss',
    title: '  Pricing v2  ',
    url: 'https://example.com/pricing-v2?utm_source=rss',
  });
  assert.equal(ev.week, '2026-W32');
  assert.equal(ev.title, 'Pricing v2');
  assert.equal(ev.url, 'https://example.com/pricing-v2');
  assert.deepEqual(ev.entities, []);
  assert.deepEqual(ev.topics, []);
  assert.ok(!('summary' in ev), 'absent summary stays absent, not null');
});

test('hnToEvents links comment-only stories to their HN page', () => {
  const events = hnToEvents({
    hits: [
      { title: 'Show HN: Tool', url: 'https://tool.dev', created_at: '2026-08-05T12:00:00Z', author: 'pg', objectID: '1' },
      { title: 'Ask HN: DevRel?', url: null, created_at: '2026-08-05T13:00:00Z', author: 'x', objectID: '42' },
    ],
  });
  assert.equal(events.length, 2);
  assert.equal(events[1].url, 'https://news.ycombinator.com/item?id=42');
  assert.equal(events[0].channel, 'hn');
});

test('redditToEvents keyword-filters when asked and links the permalink', () => {
  const json = {
    data: {
      children: [
        { data: { title: 'Our devtool launch', selftext: '', permalink: '/r/SaaS/1', created_utc: 1754500000, author: 'a' } },
        { data: { title: 'Unrelated gardening', selftext: '', permalink: '/r/SaaS/2', created_utc: 1754500000, author: 'b' } },
      ],
    },
  };
  const filtered = redditToEvents(json, { subreddit: 'SaaS', keywords: ['devtool'] });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].url, 'https://www.reddit.com/r/SaaS/1');
  const all = redditToEvents(json, { subreddit: 'SaaS', keywords: [] });
  assert.equal(all.length, 2, 'no keywords means take the whole subreddit');
});

test('lobstersToEvents matches keywords against title and tags', () => {
  const json = [
    { title: 'A new API gateway', tags: ['networking'], url: 'https://x.dev/a', created_at: '2026-08-05T10:00:00Z', short_id: 's1', submitter_user: 'u' },
    { title: 'Fungi of Patagonia', tags: ['science'], url: 'https://x.dev/b', created_at: '2026-08-05T10:00:00Z', short_id: 's2', submitter_user: 'u' },
  ];
  const events = lobstersToEvents(json, { keywords: ['api'] });
  assert.equal(events.length, 1);
  assert.equal(events[0].channel, 'lobsters');
});

test('bskyToEvents builds a stable https URL from the at:// uri', () => {
  const events = bskyToEvents(
    {
      posts: [
        {
          uri: 'at://did:plc:abc/app.bsky.feed.post/xyz9',
          record: { text: 'DevRel is measurement now', createdAt: '2026-08-05T10:00:00Z' },
          author: { handle: 'ana.bsky.social' },
        },
      ],
    },
    { query: 'devrel' }
  );
  assert.equal(events.length, 1);
  assert.equal(events[0].url, 'https://bsky.app/profile/ana.bsky.social/post/xyz9');
});

test('readDb replays last-write-wins by id and skips torn lines without throwing', () => {
  const warns = [];
  const text = [
    JSON.stringify({ id: 'a', ts: '2026-08-04T00:00:00Z', url: 'https://x/a', title: 'raw' }),
    JSON.stringify({ id: 'a', entities: ['stripe'], event: 'pricing' }),
    '{"id":"b","ts":"2026-08-04T00:0', // torn mid-append
  ].join('\n');
  const db = readDb(text, { warn: (m) => warns.push(m) });
  assert.equal(db.size, 1);
  const a = db.get('a');
  assert.equal(a.title, 'raw', 'enrichment merges over the raw line, not replaces it');
  assert.deepEqual(a.entities, ['stripe']);
  assert.equal(warns.length, 1);
});

test('dbFileFor uses the ISO week of the event, matching signals/ naming', () => {
  assert.equal(dbFileFor(new Date('2026-08-04T09:00:00Z')), 'signals/db/2026-W32.ndjson');
});

test('registry integrity: unique ids, https feeds, valid kind and posture enums', () => {
  const ids = new Set();
  for (const s of SOURCES) {
    assert.ok(s.id && s.name, `source missing id/name: ${JSON.stringify(s)}`);
    assert.ok(!ids.has(s.id), `duplicate source id ${s.id}`);
    ids.add(s.id);
    assert.match(s.feed, /^https:\/\//, `${s.id}: feed must be https`);
    assert.ok(SOURCE_KINDS.includes(s.kind), `${s.id}: bad kind ${s.kind}`);
    assert.ok(['independent', 'vendor'].includes(s.posture), `${s.id}: bad posture`);
  }
  assert.ok(COMMUNITY.hnQueries.length > 0 && COMMUNITY.subreddits.length > 0);
  assert.ok(CHANNELS.includes('search') && CHANNELS.includes('manual'), 'model write-path channels exist');
  assert.ok(EVENT_KINDS.includes('other'), 'the enum has an honest fallback');
});

test('entities.json parses and every entry passes the gate rules', async () => {
  const { readFileSync } = await import('node:fs');
  const reg = JSON.parse(readFileSync('signals/entities.json', 'utf8'));
  const aliases = new Set();
  for (const [slug, ent] of Object.entries(reg)) {
    if (slug.startsWith('_')) continue;
    assert.match(slug, /^[a-z0-9][a-z0-9-]*$/, `slug ${slug}`);
    assert.ok(ent.name, `${slug} has a name`);
    assert.ok(['company', 'tool', 'person', 'protocol', 'show'].includes(ent.kind), `${slug} kind`);
    for (const a of ent.aliases ?? []) {
      assert.ok(!aliases.has(a), `alias "${a}" unique`);
      aliases.add(a);
    }
  }
});

test('parseSitemap extracts locs with valid lastmods and tolerates undated urls', async () => {
  const { parseSitemap } = await import('./lib/scout-sources.mjs');
  const XML = `<?xml version="1.0"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://x.dev/blog/a</loc><lastmod>2026-08-05</lastmod></url>
  <url><loc>https://x.dev/blog/b</loc></url>
  <url><loc>https://x.dev/blog/c</loc><lastmod>not-a-date</lastmod></url>
</urlset>`;
  const urls = parseSitemap(XML);
  assert.equal(urls.length, 3);
  assert.equal(urls[0].lastmod.toISOString().slice(0, 10), '2026-08-05');
  assert.equal(urls[1].lastmod, undefined);
  assert.equal(urls[2].lastmod, undefined, 'a garbage lastmod is treated as undated, not NaN');
});

test('extractLinks keeps document order, dedupes, applies the pattern, and uses anchor text', async () => {
  const { extractLinks } = await import('./lib/scout-sources.mjs');
  const HTML = `
    <a href="/blog/newest-post"><h3>The newest post</h3></a>
    <a href="/blog/older-post">Older post</a>
    <a href="/blog/newest-post">dup</a>
    <a href="/about">not a post</a>
    <a href="/blog/feed.xml">feed</a>`;
  const links = extractLinks(HTML, { pattern: '^/blog/[a-z0-9-]+$', base: 'https://x.dev' });
  assert.equal(links.length, 2);
  assert.equal(links[0].url, 'https://x.dev/blog/newest-post');
  assert.equal(links[0].text, 'The newest post');
  assert.equal(links[1].url, 'https://x.dev/blog/older-post');
});

test('humanizeSlug turns a URL slug into a readable title', async () => {
  const { humanizeSlug } = await import('./lib/scout-sources.mjs');
  assert.equal(humanizeSlug('https://x.dev/blog/api-marketing-guide'), 'Api marketing guide');
});

test('sitemap and crawl registries pass the same integrity rules as SOURCES', async () => {
  const { SITEMAPS, CRAWLS, SOURCE_KINDS } = await import('./lib/scout-sources.mjs');
  for (const s of SITEMAPS) {
    assert.ok(s.id && s.sitemap.startsWith('https://') && s.include, s.id);
    assert.ok(SOURCE_KINDS.includes(s.kind), s.id);
  }
  for (const s of CRAWLS) {
    assert.ok(s.id && s.page.startsWith('https://') && s.linkPattern && s.base && s.take > 0, s.id);
    assert.ok(SOURCE_KINDS.includes(s.kind), s.id);
  }
});
