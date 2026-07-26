// Adds the site's base path to root-relative links in markdown, at build time.
//
// Content should not encode where the site happens to be deployed. Frontmatter
// already works that way — a `related` href is written base-less and the
// components run it through withBase() — but markdown bodies had no such step,
// so writers had to type the base by hand:
//
//   as covered [last week](/developer-marketing/weekly/2026-W27)
//
// That is correct on GitHub Pages and a 404 anywhere else, which made moving the
// site a content migration instead of a config change. With this plugin the same
// link is written the way the frontmatter is:
//
//   as covered [last week](/weekly/2026-W27)
//
// and the build prefixes it. `scripts/check-refs.mjs` enforces the convention;
// between them, a link that is wrong fails the build rather than shipping.
//
// Only markdown link syntax is rewritten. Raw HTML in a body (<a href="/x">) is
// left alone, as it is by the link gate — content here does not use any, and an
// HTML link that needs the base can call withBase() from a component instead.

/** Walk an mdast, depth first. Small enough not to need unist-util-visit. */
function walk(node, visit) {
  visit(node);
  for (const child of node.children ?? []) walk(child, visit);
}

/**
 * @param {{base?: string}} options the site base, e.g. "/developer-marketing"
 *        or "/" when the site is served at the root
 */
export default function remarkBasePaths({ base = '/' } = {}) {
  const prefix = base === '/' ? '' : base.replace(/\/+$/, '');

  return function transform(tree) {
    if (!prefix) return; // served at the root: nothing to add
    walk(tree, (node) => {
      // `link` and `image` carry a url; `definition` is the target of a
      // reference-style link.
      if (node.type !== 'link' && node.type !== 'image' && node.type !== 'definition') return;
      const url = node.url;
      if (typeof url !== 'string') return;
      // Root-relative only. Absolute URLs, protocol-relative (//host), anchors,
      // mailto: and relative paths are all left exactly as written.
      if (!url.startsWith('/') || url.startsWith('//')) return;
      // Idempotent: a link that already carries the base is not double-prefixed.
      if (url === prefix || url.startsWith(`${prefix}/`)) return;
      node.url = prefix + url;
    });
  };
}
