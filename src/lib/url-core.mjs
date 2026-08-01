// The one URL rule, as a pure module: page routes carry a trailing slash —
// the URL a static directory build actually serves — and file-ish routes
// (.md, .json, .xml, …) never do; a #hash or ?query survives. Extracted from
// site.ts so `node --test` can pin it (the TS file needs Vite to import);
// site.ts re-exports from here, so there is exactly one implementation.

export function normalizePath(p) {
  const m = p.match(/^([^#?]*)([#?][\s\S]*)?$/);
  let path = m[1];
  const tail = m[2] ?? '';
  const last = path.split('/').pop() ?? '';
  if (path && !last.includes('.') && !path.endsWith('/')) path += '/';
  return `${path || '/'}${tail}`;
}
