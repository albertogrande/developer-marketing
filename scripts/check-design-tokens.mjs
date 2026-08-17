#!/usr/bin/env node
// Design-token gate. The stylesheet grew as six appended layers with no scale:
// ~276 font-size declarations across ~35 values, px in main.scss and rem in the
// scoped <style> blocks, and two custom properties (--mono, --amber) that were
// referenced 26 times but never declared anywhere. The fallbacks hid that last
// one for months: the text rendered in the browser's default monospace and in
// an amber that ignored the theme toggle, and nothing looked broken enough to
// notice.
//
// This runs in `npm run build` next to check-refs, so drift fails the build.
//
// Checks:
//   1. every var(--x) reference resolves to a custom property declared in
//      main.scss — the check that would have caught --mono and --amber
//   2. font-size is a var(--fs-*) token, `inherit`, or a relative `em`
//      (inline code sizes against its container by design)
//   3. border-radius is a var(--r-*) token, a percentage, or 0
//   4. line-height is a var(--lh-*) token or the unitless reset `1`
//
// There is deliberately no allowlist: per CLAUDE.md, if a change breaks a
// gate, fix the change, not the gate. Adding a genuinely new step means adding
// a token, which is the point.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const STYLESHEET = 'src/styles/main.scss';

/** Every .astro file under `dir`, recursively. */
function astroFiles(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) astroFiles(p, out);
    else if (e.endsWith('.astro')) out.push(p);
  }
  return out;
}

/**
 * Strip everything that is not a <style> block, keeping line numbers intact so
 * a violation reports the line the author actually edits. Astro components mix
 * markup, frontmatter and TypeScript with CSS in one file; only the CSS is ours
 * to police.
 */
function styleBlocksOnly(src) {
  const out = src.split('\n').map(() => '');
  const lines = src.split('\n');
  let inStyle = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!inStyle && /<style[^>]*>/.test(line)) {
      inStyle = true;
      out[i] = line.slice(line.indexOf('>') + 1);
      if (/<\/style>/.test(line)) { out[i] = line; inStyle = false; }
      continue;
    }
    if (inStyle && /<\/style>/.test(line)) {
      out[i] = line.slice(0, line.indexOf('</style>'));
      inStyle = false;
      continue;
    }
    if (inStyle) out[i] = line;
  }
  return out;
}

/** Strip /* *​/ and // comments so a commented-out literal is not a violation. */
function decomment(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
             .replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length));
}

const RULES = [
  {
    prop: 'font-size',
    ok: (v) => /^var\(--fs-[a-z0-9-]+\)$/.test(v) || v === 'inherit' || /^[\d.]+em$/.test(v),
    want: 'a var(--fs-*) token (or a relative em for inline code)',
  },
  {
    prop: 'border-radius',
    ok: (v) => /^var\(--r-[a-z0-9-]+\)$/.test(v) || /%$/.test(v) || v === '0',
    want: 'a var(--r-*) token, a percentage, or 0',
  },
  {
    prop: 'line-height',
    ok: (v) => /^var\(--lh-[a-z0-9-]+\)$/.test(v) || v === '1',
    want: 'a var(--lh-*) token',
  },
];

/**
 * Collect every token problem under `root`.
 *
 * Exported and root-relative so the gate's wiring is testable, not just its
 * rules — a bug in how this walks files makes the gate pass vacuously while
 * the suite stays green, and it runs on every build and every unattended
 * writer commit.
 *
 * @returns {{problems: string[], counts: object}}
 */
export function checkDesignTokens(root = ROOT) {
  const problems = [];
  const sheet = readFileSync(join(root, STYLESHEET), 'utf8');

  // 1. undefined custom properties.
  // Anchor on `{` / `;` / line start, not line start alone: the token block
  // packs several short declarations per line, and a line-anchored pattern
  // silently sees only the first — which is how this gate's own first run
  // reported --r-md and --r-lg as undefined.
  const declared = new Set([...sheet.matchAll(/(?:^|[;{])\s*(--[a-z0-9-]+)\s*:/gim)].map((m) => m[1]));

  const sources = [
    [STYLESHEET, decomment(sheet).split('\n')],
    ...astroFiles(join(root, 'src')).map((f) => [
      relative(root, f),
      styleBlocksOnly(decomment(readFileSync(f, 'utf8'))),
    ]),
  ];

  let declarations = 0;
  for (const [file, lines] of sources) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const at = `${file}:${i + 1}`;

      for (const ref of line.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)) {
        if (!declared.has(ref[1])) {
          problems.push(`${at}: var(${ref[1]}) is never declared — did you mean one of the tokens in ${STYLESHEET}?`);
        }
      }

      for (const { prop, ok, want } of RULES) {
        for (const d of line.matchAll(new RegExp(`(?:^|[;{\\s])${prop}\\s*:\\s*([^;{}]+)`, 'gi'))) {
          const value = d[1].trim().replace(/\s*!important$/, '');
          declarations++;
          if (!ok(value)) problems.push(`${at}: ${prop}: ${value} — use ${want}`);
        }
      }
    }
  }

  return {
    problems,
    counts: { tokens: declared.size, files: sources.length, declarations },
  };
}

// CLI: thin wrapper. `import.meta.main` is not available on Node 20, so guard
// on argv[1] instead — importing this module must never exit the process.
const invokedDirectly =
  process.argv[1] && process.argv[1].endsWith('check-design-tokens.mjs');
if (invokedDirectly) {
  const { problems, counts: c } = checkDesignTokens();
  if (problems.length) {
    console.error('check-design-tokens: styles drifted off the token scale:');
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(
    `check-design-tokens: ok — ${c.declarations} sized declarations across ${c.files} files, all on the ${c.tokens} declared tokens.`
  );
}
