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
// vendor (the signals flags self-reported claims; the enum keeps that context
// queryable). `channel` is optional and defaults to 'rss'; set it when the
// feed is a different *kind of surface* rather than a different publisher —
// a launch tracker or a changelog.
//
// All feeds verified 2026-08-06; candidates that failed then
// (devrelweekly 525, draft.dev/leerob/netlify/resend/planetscale/markepear/
// slashdata 404s, commonroom no feed, reforge 500) are deliberately absent —
// re-verify before adding. The answer-engine sources were added and verified
// 2026-08-16; ahrefs (429/Cloudflare challenge — serves RSS to a browser, not
// to a scheduled job), Search Engine Journal and Search Engine Roundtable are
// deliberately absent: the first is unreliable, the other two duplicate Search
// Engine Land's beat at several times the volume.
//
// The operator and changelog blocks below were added 2026-08-16 to correct a
// measured imbalance: 77% of the event DB's first fortnight came from one HN
// pipe, because the vendor side of the watchlist was too small — not because
// HN was too loud (only 4% of that HN capture was off-beat). Vendor feeds are
// the low-volume, high-yield half of the corpus: 25–67% of their events reach
// published Signals, against ~2% of HN's. Verified 2026-08-16 by parsing each
// feed through parseAnyFeed; linear.app/rss.xml, blog.langchain.dev/rss/ and
// changelog.cursor.com/rss all answer 200 but yield zero parseable items, so
// they are deliberately absent — re-verify before adding.

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

  // Operators, second wave — the platforms and runtimes whose positioning
  // moves this beat. Cloudflare is here because three published signals cited
  // blog.cloudflare.com while it was not on the watchlist at all; the rest
  // close the gap between "what indie builders build on" (visible on HN) and
  // "what those platforms say about it" (previously invisible).
  { id: 'cloudflare-blog', name: 'Cloudflare blog', feed: 'https://blog.cloudflare.com/rss/', kind: 'operator', posture: 'vendor' },
  { id: 'openai-news', name: 'OpenAI news', feed: 'https://openai.com/news/rss.xml', kind: 'operator', posture: 'vendor' },
  { id: 'railway-blog', name: 'Railway blog', feed: 'https://blog.railway.com/rss.xml', kind: 'operator', posture: 'vendor' },
  { id: 'fly-blog', name: 'Fly.io blog', feed: 'https://fly.io/blog/feed.xml', kind: 'operator', posture: 'vendor' },
  { id: 'neon-blog', name: 'Neon blog', feed: 'https://neon.com/blog/rss.xml', kind: 'operator', posture: 'vendor' },
  { id: 'replit-blog', name: 'Replit blog', feed: 'https://blog.replit.com/feed.xml', kind: 'operator', posture: 'vendor' },
  { id: 'warp-blog', name: 'Warp blog', feed: 'https://www.warp.dev/blog/feed.xml', kind: 'operator', posture: 'vendor' },
  { id: 'val-town-blog', name: 'Val Town blog', feed: 'https://blog.val.town/rss.xml', kind: 'operator', posture: 'vendor' },
  { id: 'docker-blog', name: 'Docker blog', feed: 'https://www.docker.com/blog/feed/', kind: 'operator', posture: 'vendor' },
  { id: 'gitlab-blog', name: 'GitLab blog', feed: 'https://about.gitlab.com/atom.xml', kind: 'operator', posture: 'vendor' },
  // Runtimes and frameworks: quiet feeds (weeks between posts) kept because
  // when they do publish it is a release the whole beat reacts to.
  { id: 'bun-blog', name: 'Bun blog', feed: 'https://bun.com/rss.xml', kind: 'operator', posture: 'vendor' },
  { id: 'deno-blog', name: 'Deno blog', feed: 'https://deno.com/feed', kind: 'operator', posture: 'vendor' },
  { id: 'astro-blog', name: 'Astro blog', feed: 'https://astro.build/rss.xml', kind: 'operator', posture: 'vendor' },

  // Changelogs — a surface the watchlist had no coverage of at all. A blog is
  // where a devtool *announces* positioning; a changelog is where positioning
  // actually moves: tier renames, quota changes, deprecations. That is why
  // they carry their own channel — 'pricing' and 'deprecation' are event kinds
  // the DB has never once recorded, and this is the surface that produces them.
  { id: 'github-changelog', name: 'GitHub changelog', feed: 'https://github.blog/changelog/feed/', kind: 'operator', posture: 'vendor', channel: 'changelog' },
  { id: 'sentry-changelog', name: 'Sentry changelog', feed: 'https://sentry.io/changelog/feed.xml', kind: 'operator', posture: 'vendor', channel: 'changelog' },
  { id: 'railway-changelog', name: 'Railway changelog', feed: 'https://railway.com/changelog/rss.xml', kind: 'operator', posture: 'vendor', channel: 'changelog' },

  // Research & data.
  { id: 'slashdata-blog', name: 'SlashData blog', feed: 'https://www.slashdata.co/blog-feed.xml', kind: 'research', posture: 'independent' },

  // Answer engines — how developers (and their agents) discover tools through
  // AI search rather than a ten-blue-links page. The rest of the watchlist is
  // devtools-native and reports this only when a devtool ships something; these
  // three cover the discipline itself, so the beat has a source of its own.
  { id: 'search-engine-land', name: 'Search Engine Land', feed: 'https://searchengineland.com/feed', kind: 'newsletter', posture: 'independent' },
  { id: 'growth-memo', name: 'Growth Memo (Kevin Indig)', feed: 'https://www.growth-memo.com/feed', kind: 'practitioner', posture: 'independent' },
  { id: 'sparktoro', name: 'SparkToro (Rand Fishkin)', feed: 'https://sparktoro.com/blog/feed/', kind: 'research', posture: 'vendor' },

  // The practice itself — go-to-market for developer-first companies. Added
  // 2026-08-19 to correct a measured imbalance in what the *issue* has to
  // argue from, not in what the feed publishes: the watchlist was ~30 vendor
  // blogs against ~10 practitioner voices, and vendor blogs publish product
  // news, so the editor's raw material was overwhelmingly "who shipped what."
  // The weekly kept landing on devtools-industry theses because that is what
  // it was fed.
  //
  // These feeds mostly publish argument rather than events, which means most
  // of what they emit will never clear Step 3's promotion bar — and that is
  // the design, not a defect. Signals stays a complete event log; this block
  // exists so the editor has the practice to reason with when deciding what a
  // week of launches *meant*. Judge these sources by whether issues get
  // sharper, never by their promotion rate.
  //
  // All eight verified 2026-08-19 by fetching and parsing through parseAnyFeed,
  // with the 90-day volume checked so a dormant feed is not registered as a
  // daily no-op. Candidates that failed the same check and are deliberately
  // absent: getdx.com and developerrelations.com (404, and no <link
  // rel="alternate"> to autodiscover), a16z.com/feed and bvp.com/atlas (404;
  // both WordPress, both serving oEmbed only), devrelweekly.com (525 again,
  // unchanged since 2026-08-06), heavybit.com/library/rss.xml (404 — the live
  // path is /library/feed), and aprildunford.com/blog?format=rss (200 but zero
  // items; the Substack is where she actually publishes). Re-verify before
  // adding any of them. The New Stack (thenewstack.io/feed) passed the same
  // check — 26 items, publishing daily — and is left out on judgment: it is a
  // devtools-industry news firehose, and more industry news is the opposite of
  // what this block is for.
  { id: 'heavybit', name: 'Heavybit Library', feed: 'https://www.heavybit.com/library/feed', kind: 'practitioner', posture: 'independent' },
  { id: 'mkt1', name: 'MKT1 (Emily Kramer)', feed: 'https://mkt1.substack.com/feed', kind: 'practitioner', posture: 'independent' },
  { id: 'april-dunford', name: 'April Dunford — Positioning', feed: 'https://aprildunford.substack.com/feed', kind: 'practitioner', posture: 'independent' },
  { id: 'tomasz-tunguz', name: 'Tomasz Tunguz', feed: 'https://tomtunguz.com/index.xml', kind: 'practitioner', posture: 'independent' },
  { id: 'product-marketing-alliance', name: 'Product Marketing Alliance', feed: 'https://www.productmarketingalliance.com/rss/', kind: 'practitioner', posture: 'independent' },
  { id: 'productled', name: 'ProductLed', feed: 'https://productled.com/blog/rss.xml', kind: 'practitioner', posture: 'independent' },
  // The developer's own side of the same market — what the audience being
  // marketed to reads and says. Not marketing sources; the check on whether a
  // positioning claim survives contact with the people it is aimed at.
  { id: 'pragmatic-engineer', name: 'The Pragmatic Engineer', feed: 'https://newsletter.pragmaticengineer.com/feed', kind: 'newsletter', posture: 'independent' },
  { id: 'stackoverflow-blog', name: 'Stack Overflow blog', feed: 'https://stackoverflow.blog/feed/', kind: 'operator', posture: 'vendor' },

  // Launch trackers.
  { id: 'producthunt-devtools', name: 'Product Hunt — developer tools', feed: 'https://www.producthunt.com/feed?category=developer-tools', kind: 'newsletter', posture: 'independent', channel: 'producthunt' },
];

// ---------------------------------------------------------------------------
// Feedless sources, two shapes. SITEMAPS: sites whose sitemap.xml carries
// <lastmod> — as window-filterable as a feed, just without titles (we
// humanize the slug; the scout's triage has the URL). CRAWLS: sites with
// neither feed nor dated sitemap — the blog index page is fetched, links
// matching the pattern are extracted with their anchor text, and *only URLs
// never seen before* become events (ts = capture time, same honesty rule as
// a late-surfaced signal). First contact with a crawl source seeds
// signals/db/.crawl-seen.json silently instead of flooding the log with the
// site's whole back catalogue.

export const SITEMAPS = [
  { id: 'reforge-blog', name: 'Reforge blog', sitemap: 'https://www.reforge.com/sitemap.xml', include: '^https://www\.reforge\.com/blog/.+', kind: 'practitioner', posture: 'independent' },
  // leerob.com publishes posts at bare top-level slugs, so the include pattern
  // has to be broad; the exclude list carries the site's non-post pages. Note
  // this sitemap stamps every <loc> with the build time, so on each deploy the
  // whole site re-enters the window — harmless only because dedupe now spans
  // every week file (see scout-sweep.mjs), which is what stopped it appending
  // 21 duplicate events a second time.
  { id: 'leerob', name: 'Lee Robinson', sitemap: 'https://leerob.com/sitemap.xml', include: '^https://leerob\.com/[a-z0-9-]+$', exclude: '^https://leerob\.com/(writing|stack|uses|work|links|vercel|bio|bookmarks|beliefs|bronco)$', kind: 'practitioner', posture: 'independent' },
];

export const CRAWLS = [
  { id: 'markepear', name: 'Markepear', page: 'https://www.markepear.dev/blog', base: 'https://www.markepear.dev', linkPattern: '^/blog/[a-z0-9-]+$', take: 12, kind: 'practitioner', posture: 'independent' },
  { id: 'draft-dev', name: 'Draft.dev', page: 'https://draft.dev/learn', base: 'https://draft.dev', linkPattern: '^/learn/[a-z0-9-]+$', take: 12, kind: 'practitioner', posture: 'independent' },
  // An AEO platform's own blog: vendor research on citation patterns, so read
  // it as data *about the vendor's incentives* as much as about AI search.
  { id: 'profound', name: 'Profound', page: 'https://www.tryprofound.com/blog', base: 'https://www.tryprofound.com', linkPattern: '^/blog/[a-z0-9-]+$', take: 12, kind: 'research', posture: 'vendor' },
];

// ---------------------------------------------------------------------------
// Community firehoses, scoped by query — the watchlist captures matches, not
// the whole site. Reddit and Bluesky refuse some datacenter networks with a
// 403; the sweep tolerates that (failures reported, never fatal).

export const COMMUNITY = {
  // Algolia HN API — always fetchable, exact timestamps.
  hnQueries: [
    'devrel',
    '"developer marketing"',
    '"developer experience"',
    'documentation',
    'devtools pricing',
    // The answer-engine beat. Phrases, not the bare acronyms: "GEO" is mostly
    // geography and "AEO" is mostly noise, so they cost triage more than they
    // return. llms.txt is unambiguous and is where devtools argue about this.
    'llms.txt',
    '"answer engine"',
    '"AI search"',
  ],
  // Show HN is where the small launches the signals exists for land.
  hnShowQueries: ['devtool', 'developer', 'API', 'CLI', 'SDK'],
  // r/devrel is small — take it whole; the big ones are keyword-filtered.
  subreddits: [
    { name: 'devrel', mode: 'all' },
    { name: 'marketing', mode: 'filtered' },
    { name: 'SaaS', mode: 'filtered' },
    { name: 'ExperiencedDevs', mode: 'filtered' },
  ],
  // Applied to filtered subreddits and to Lobsters' newest stream. Plain
  // lowercase substring match, so every entry must be distinctive on its own:
  // 'geo' would match geospatial and geometry, 'aeo' matches little at all.
  keywords: [
    'developer', 'devrel', 'devtool', 'api', 'sdk', 'docs', 'documentation', 'open source', 'pricing', 'launch',
    'llms.txt', 'answer engine', 'ai search', 'ai overviews',
  ],
  // Registered practitioners, not a query: app.bsky.feed.searchPosts is behind
  // bot protection and 403s without a token, while getAuthorFeed is public.
  // Every handle here was checked for a post in the last 30 days — a silent
  // account is a job that runs daily and returns nothing, which is the exact
  // failure this list replaces. `mode: 'all'` is for accounts that only ever
  // post about the practice; personal feeds are keyword-filtered because most
  // of what a practitioner posts is not about their practice.
  bskyAuthors: [
    { handle: 'devrelpatterns.com', mode: 'all' },       // Developer Relations Activity Patterns
    { handle: 'seldo.com', mode: 'filtered' },           // Laurie Voss — Head of DevRel, Arize; ex-Netlify, npm
    { handle: 'bnb.im', mode: 'filtered' },              // tierney cyren — developer advocate
    { handle: 'philna.sh', mode: 'filtered' },           // Phil Nash — DX engineer, Resend
    { handle: 'rachelandrew.co.uk', mode: 'filtered' },  // Rachel Andrew — content lead, Chrome DevRel
    { handle: 'tomayac.com', mode: 'filtered' },         // Thomas Steiner — DevRel engineer, Google
    { handle: 'paul.kinlan.me', mode: 'filtered' },      // Paul Kinlan — lead, Chrome DevRel
    { handle: 'wesley83.bsky.social', mode: 'filtered' },// Wesley Faulkner — DevRel practitioner
    { handle: 'kjaymiller.com', mode: 'filtered' },      // Jay Miller — staff developer advocate, Aiven
    { handle: 'blackgirlbytes.bsky.social', mode: 'filtered' }, // Rizel Scarlett — OSS DevRel, Block
    { handle: 'lukestahl.bsky.social', mode: 'filtered' },      // Luke Stahl — product & developer marketing, Webflow
  ],
};

// Valid enums — the enrich tool validates against these, and agents filter on
// them, so extend deliberately (same rule as the site's schema vocabularies).
export const CHANNELS = ['rss', 'changelog', 'hn', 'reddit', 'lobsters', 'bluesky', 'producthunt', 'crawl', 'search', 'manual'];
export const EVENT_KINDS = ['launch', 'release', 'funding', 'acquisition', 'pricing', 'deprecation', 'research', 'campaign', 'content', 'discussion', 'podcast', 'hiring', 'other'];
export const ENTITY_KINDS = ['company', 'tool', 'person', 'protocol', 'show'];
export const SOURCE_KINDS = ['practitioner', 'operator', 'newsletter', 'research', 'podcast'];

// Topics were free text for the DB's first fortnight and drifted exactly the
// way this repo's other vocabularies are enum'd to prevent: 38 slugs across 51
// enriched events, with `agents` / `agent-tooling` / `agent-infra` splitting one
// thread, and `aeo` — the slug daily-scout/SKILL.md mandates stamping "even
// when the event is filed under another beat" — never once used, while its
// synonyms `ai-search` and `crawlers` were. An agent filtering on a topic gets
// a silently short answer when that happens, so the list is closed now.
//
// Extending it is a deliberate edit here plus a line in the scout's skill.
export const TOPICS = [
  // Discovery and the answer-engine beat.
  'aeo', 'docs', 'content', 'distribution', 'marketplace',
  // Agents: the umbrella, then the distinct sub-threads worth filtering apart.
  'agents', 'ai-coding-agents', 'agent-skills', 'agent-tooling', 'agent-governance',
  'agent-safe-docs', 'agents-md', 'mcp',
  // Commercial.
  'pricing', 'plg', 'funding', 'valuation', 'metrics', 'roi', 'org-design', 'pmm', 'hiring',
  // Engineering and product surface.
  'devtools', 'sdk', 'infrastructure', 'open-source', 'ai-contributions', 'security',
  'compliance', 'governance', 'testing', 'code-review', 'browser-automation',
  'dogfooding', 'launches',
];

// Retired slugs → the canonical one. Kept so the enrich tool can tell the
// model *which* topic to use instead of just refusing, and so a reader of old
// events knows where a thread went. Never delete a row: the DB still holds
// events stamped with the left-hand side.
export const TOPIC_ALIASES = {
  'ai-search': 'aeo',
  crawlers: 'aeo',
  'agent-infra': 'agent-tooling',
  'pre-action-authz': 'agent-governance',
  authorization: 'agent-governance',
  'ai-era': 'agents',
};

// Resolve a topic to its canonical slug, or undefined if it is not in the
// vocabulary at all.
export const canonicalTopic = (t) =>
  TOPICS.includes(t) ? t : TOPIC_ALIASES[t] && TOPICS.includes(TOPIC_ALIASES[t]) ? TOPIC_ALIASES[t] : undefined;

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

// Deterministic entity matching over an event's own words.
//
// `entities` is the model's curated judgment and stays that way. The problem it
// cannot solve alone is coverage: the scout enriches "a handful of events a day"
// by design, which left 96% of the first fortnight's corpus entity-blind — 42 of
// 62 registered entities had zero events, including ones whose titles plainly
// named them. autoEntities fills that gap: every registered name or alias that
// appears, as a word, in an event's title or summary.
//
// This is derived at read time and never stored. Freezing it would mean a
// migration now and a stale corpus later — registering an entity should light
// up the events that already named it, not just future ones. The cost is one
// pass over the log per query, which is milliseconds at this size.
//
// The result stays in its own field, `entitiesAuto`, and never merges into
// `entities`. Auto matches are routing metadata, not claims — "Meta" inside
// "meta description" is a real false positive this produces — and folding them
// together would launder a substring match into curated judgment.
export function autoEntities(text, registry = {}) {
  const hay = ` ${String(text ?? '').toLowerCase()} `;
  const hits = new Set();
  for (const [slug, ent] of Object.entries(registry)) {
    if (slug.startsWith('_')) continue;
    const needles = [ent?.name, ...(ent?.aliases ?? [])].filter((n) => typeof n === 'string' && n.length >= 3);
    for (const n of needles) {
      // Word-ish boundaries, but tolerant of the punctuation real names carry
      // ('Next.js', 'Val Town', 'r/devrel'): anything that is not a letter or
      // digit may sit either side.
      const esc = n.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`(^|[^a-z0-9])${esc}([^a-z0-9]|$)`, 'i').test(hay)) {
        hits.add(slug);
        break;
      }
    }
  }
  return [...hits].sort();
}

// Every event, plus the entities its own words name. The read-time half of the
// pair above — query and stats both go through this so "what has Vercel been
// doing?" means the same thing in both.
export const attachAutoEntities = (events, registry = {}) =>
  events.map((e) => {
    const auto = autoEntities(`${e.title ?? ''} ${e.summary ?? ''}`, registry);
    return auto.length ? { ...e, entitiesAuto: auto } : e;
  });

// The event contract, in one place because it was previously restated in four
// and they were free to disagree: normalizeEvent below, the allow-list in
// scout-enrich, the allow-list in check-editorial, and the field list in the
// /intel skill.
//
// A week file holds two line shapes:
//
//   full event      { id, ts, week, source, channel, title, url,
//                     summary?, author?, points?, comments?, entities[], topics[] }
//   enrichment line { id, ...ENRICHABLE_FIELDS }   — appended, merged on replay
//
// So a line is not an event, and the same id may appear in several lines and
// in more than one week file. Always read through readDbFiles.
//
// Note the event-kind field is `event`, not `kind`. Published signals in
// src/content/signals/ carry their own `kind` in frontmatter with a different
// vocabulary; conflating them is the trap this comment exists to close.
export const ENRICHABLE_FIELDS = ['entities', 'event', 'topics'];

// Derived at read time, never stored — see autoEntities.
export const DERIVED_FIELDS = ['entitiesAuto'];

// The one place the event shape is decided. `ts` is the item's own timestamp
// when the source gives one, else the sweep time the caller passes.
//
// `points`/`comments` are the source's own engagement counters where it
// publishes them. They exist for analysis — "did this land or sink?" is not
// answerable without them — and are explicitly *not* a promotion criterion:
// ranking capture by reach is what drops the indie tail the Signals feed
// exists for (MASTHEAD.md). Nothing in the publish path reads them.
export function normalizeEvent({ ts, source, channel, title, url, summary, author, points, comments }) {
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
    ...(Number.isFinite(points) ? { points } : {}),
    ...(Number.isFinite(comments) ? { comments } : {}),
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
        // Already in the Algolia payload; the sweep used to discard them.
        points: h.points,
        comments: h.num_comments,
      })
    );
}

// Reddit's public JSON endpoints (www and old, /new.json and the OAuth host)
// answer 403 to every unauthenticated caller, so the four subreddit jobs sat
// dark from the day they were registered. The per-subreddit Atom feed is the
// one public surface Reddit still serves without a token — same posts, same
// order, minus the score and comment counters. Those counters are dropped
// rather than guessed: normalizeEvent omits a counter it was not given, and an
// invented number would be worse than an absent one.
export function redditToEvents(xml, { subreddit, keywords = [] } = {}) {
  const items = parseAnyFeed(xml).items;
  const wanted = keywords.length
    ? items.filter((i) => {
        const hay = `${i.title} ${snippet(i.summary ?? '') ?? ''}`.toLowerCase();
        return keywords.some((k) => hay.includes(k.toLowerCase()));
      })
    : items;
  return wanted
    .filter((i) => i.date)
    .map((i) =>
      normalizeEvent({
        ts: i.date,
        source: `r/${subreddit}`,
        channel: 'reddit',
        title: i.title,
        url: i.link,
        // Reddit escapes the post body, so one snippet() pass strips the tags
        // and the next decodes them back into visible markup. Re-running it on
        // the decoded text is what actually leaves prose.
        summary: snippet(i.summary ?? ''),
        // Reddit writes the author as "/u/name"; the DB stores bare handles.
        author: i.author?.replace(/^\/u\//, ''),
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
      // This mapper passed no summary at all, so every Lobsters event was
      // title-only — a structural blank, not a thin feed.
      summary: snippet(s.description ?? ''),
      author: s.submitter_user,
      points: s.score,
      comments: s.comment_count,
    })
  );
}

// app.bsky.feed.searchPosts sits behind Bluesky's bot protection and answers
// 403 to every unauthenticated caller, which is why the five search jobs never
// produced an event. getAuthorFeed is still public, so the channel is a
// registered list of practitioners instead of a query — narrower reach, but
// reach that actually works. Accepts both payload shapes: getAuthorFeed wraps
// each post in a feed entry, searchPosts returned a flat `posts` array.
export function bskyToEvents(json, { source, keywords = [] } = {}) {
  const posts = Array.isArray(json?.feed)
    // A repost carries someone else's post under `reason`; the account we
    // registered did not write it, so it is not their signal.
    ? json.feed.filter((f) => !f?.reason).map((f) => f?.post)
    : (json?.posts ?? []);

  return posts
    .filter((p) => p?.record?.text && p?.uri)
    .filter((p) => {
      if (!keywords.length) return true;
      const hay = p.record.text.toLowerCase();
      return keywords.some((k) => hay.includes(k.toLowerCase()));
    })
    .map((p) => {
      // at://did:plc:xyz/app.bsky.feed.post/abc → a stable https URL.
      const [, did, , rkey] = p.uri.replace('at://', '').match(/^([^/]+)\/([^/]+)\/(.+)$/)?.slice(0) ?? [];
      const handle = p.author?.handle ?? did;
      return normalizeEvent({
        ts: p.record.createdAt ?? p.indexedAt,
        source: source ?? `bsky:${handle}`,
        channel: 'bluesky',
        title: snippet(p.record.text, 120) ?? p.record.text.slice(0, 120),
        url: `https://bsky.app/profile/${handle}/post/${rkey ?? ''}`,
        summary: snippet(p.record.text),
        author: handle,
        points: p.likeCount,
        comments: p.replyCount,
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

// The whole log as one map, merged across week files in filename order.
//
// readDb merges by id *within* a file, which is not the same thing: an event's
// file is chosen by its own timestamp, so a source that restamps a URL puts the
// same id in two week files. Per-file replay then yields it twice, and every
// consumer that flattened `readDb` per file counted it twice — that is why a
// 1,150-event corpus reported 1,184. Merge across files, always, so line count
// never has to equal event count.
export function readDbFiles(files, { read, warn = console.warn } = {}) {
  const byId = new Map();
  const fileOf = new Map();
  for (const file of files) {
    for (const [id, rec] of readDb(read(file), { warn })) {
      byId.set(id, { ...byId.get(id), ...rec });
      fileOf.set(id, file);
    }
  }
  return { byId, fileOf };
}

export const dbFileFor = (date) => `signals/db/${isoWeekId(date)}.ndjson`;

// Every week file, oldest first. One definition so the tools cannot disagree
// about what "the DB" is.
export const DB_FILE_RE = /^\d{4}-W\d{2}\.ndjson$/;

export { isoWeekId };
