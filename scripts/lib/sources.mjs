// Shared source-URL knowledge: extraction from content text (frontmatter
// `url:` fields, markdown links, bare links) and host-independence logic for
// the sourcing floors. Used by the liveness checker (check-sources.mjs), the
// referential-integrity gate (check-refs.mjs), and their tests, so the URL
// grammar and the meaning of "independent sources" live in one place.

// Extract every checkable URL from a content file's text.
export function extractUrls(text) {
  const urls = new Set();
  // frontmatter/source lists: url: https://…
  for (const m of text.matchAll(/\burl:\s*(https?:\/\/\S+)/g)) urls.add(m[1]);
  // markdown links: [label](https://…) — one level of balanced parens allowed
  // (Wikipedia-style /Foo_(bar) URLs must not be truncated at the first ')').
  for (const m of text.matchAll(/\]\((https?:\/\/(?:[^()\s]|\([^()\s]*\))+)\)/g)) urls.add(m[1]);
  // bare links in signals one-liners
  for (const m of text.matchAll(/(?<![("\]])\bhttps?:\/\/[^\s)"'<>\]]+/g)) urls.add(m[0]);
  return [...urls].map((u) => {
    u = u.replace(/[.,;:!?'"]+$/, '');
    // Trailing ')' is only cruft when unbalanced — /Foo_(bar) keeps its paren.
    while (u.endsWith(')') && (u.match(/\(/g) || []).length < (u.match(/\)/g) || []).length) {
      u = u.slice(0, -1);
    }
    return u;
  });
}

// Multi-label public suffixes where the registrable name is one label deeper
// than the usual two (blog.example.co.uk → example.co.uk). A handful is
// enough at this scale; the check is a floor, not a taxonomy.
const DEEP_SUFFIXES = new Set([
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk',
  'com.au', 'net.au', 'org.au',
  'co.jp', 'or.jp', 'ne.jp',
  'co.in', 'co.nz', 'com.br',
]);

// The registrable domain behind a URL: hostname minus subdomains, so
// blog.vendor.com and docs.vendor.com count as ONE source. Returns null for
// unparseable URLs.
export function registrableHost(url) {
  let hostname;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  const labels = hostname.replace(/^www\./, '').split('.');
  if (labels.length <= 2) return labels.join('.');
  const lastTwo = labels.slice(-2).join('.');
  const keep = DEEP_SUFFIXES.has(lastTwo) ? 3 : 2;
  return labels.slice(-keep).join('.');
}

// How many independent publishers a list of source URLs actually spans.
// Two links into the same registrable domain are one source — a vendor's
// blog corroborating the vendor's docs corroborates nothing.
export function independentHostCount(urls) {
  const hosts = new Set();
  for (const u of urls) {
    const h = registrableHost(u);
    if (h) hosts.add(h);
  }
  return hosts.size;
}
