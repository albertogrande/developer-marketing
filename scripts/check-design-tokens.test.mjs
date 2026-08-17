// Wiring tests for the design-token gate.
//
// The gate exists because a stylesheet drifts silently: --mono and --amber were
// referenced 26 times and declared nowhere, and because both call sites passed a
// fallback, nothing looked broken enough to notice for months. A gate that
// passes vacuously reproduces exactly that failure, so these tests assert what
// it CATCHES, not merely that it permits the real tree. Each builds a minimal
// tree under a temp root, breaks exactly one thing, and requires a matching
// problem back.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkDesignTokens } from './check-design-tokens.mjs';

const TOKENS = `:root {
  --font-mono: monospace;
  --accent: #b45309;
  --fs-ui: 0.8125rem;  --fs-body: 1.1875rem;
  --lh-prose: 1.65;
  --r-sm: 3px;  --r-md: 4px;
}
`;

/**
 * A minimal, clean tree. Callers pass extra/overriding files to break one thing.
 * @param {Record<string,string>} files  path → content
 */
function fixture(files = {}) {
  const root = mkdtempSync(join(tmpdir(), 'check-tokens-'));
  const write = (rel, body) => {
    mkdirSync(join(root, rel, '..'), { recursive: true });
    writeFileSync(join(root, rel), body);
  };
  write('src/styles/main.scss', `${TOKENS}\nbody { font-size: var(--fs-body); }\n`);
  write('src/pages/ok.astro', '<p>hi</p>\n<style>\n  .a { font-size: var(--fs-ui); }\n</style>\n');
  for (const [rel, body] of Object.entries(files)) write(rel, body);
  return root;
}

const run = (files) => {
  const root = fixture(files);
  try {
    return checkDesignTokens(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

const matching = (problems, re) => problems.filter((p) => re.test(p));

test('a clean tree passes and reports what it inspected', () => {
  const { problems, counts } = run();
  assert.deepEqual(problems, []);
  assert.ok(counts.tokens >= 7, 'counts the declared tokens');
  assert.ok(counts.declarations >= 2, 'counts the declarations it checked');
});

test('catches a var() that is never declared — the --mono/--amber bug', () => {
  const { problems } = run({
    'src/pages/bad.astro': '<style>\n  .a { font-family: var(--mono, monospace); }\n</style>\n',
  });
  assert.equal(matching(problems, /bad\.astro:2: var\(--mono\) is never declared/).length, 1);
});

test('a fallback value does not excuse an undeclared token', () => {
  // Both real call sites passed one, which is precisely why nothing looked broken.
  const { problems } = run({
    'src/pages/bad.astro': '<style>\n  .a { color: var(--amber, #d08b1e); }\n</style>\n',
  });
  assert.equal(matching(problems, /var\(--amber\) is never declared/).length, 1);
});

test('declarations packed several to a line are all seen', () => {
  // The gate's own first run reported --r-md and --r-lg as undefined because a
  // line-anchored pattern saw only the first declaration on the token line.
  const { problems } = run({
    'src/pages/ok2.astro': '<style>\n  .a { border-radius: var(--r-md); }\n</style>\n',
  });
  assert.deepEqual(matching(problems, /--r-md/), []);
});

test('catches a raw font-size in the stylesheet and in a scoped block', () => {
  const { problems } = run({
    'src/styles/main.scss': `${TOKENS}\n.a { font-size: 13.5px; }\n`,
    'src/pages/bad.astro': '<style>\n  .b { font-size: 0.82rem; }\n</style>\n',
  });
  assert.equal(matching(problems, /main\.scss:\d+: font-size: 13\.5px/).length, 1);
  assert.equal(matching(problems, /bad\.astro:2: font-size: 0\.82rem/).length, 1);
});

test('allows em font-size, which inline code needs', () => {
  const { problems } = run({
    'src/pages/ok2.astro': '<style>\n  code { font-size: 0.84em; }\n</style>\n',
  });
  assert.deepEqual(matching(problems, /font-size/), []);
});

test('catches raw border-radius and line-height, allowing % and the unitless reset', () => {
  const { problems } = run({
    'src/pages/bad.astro':
      '<style>\n  .a { border-radius: 7px; }\n  .b { line-height: 1.42; }\n' +
      '  .c { border-radius: 50%; }\n  .d { line-height: 1; }\n</style>\n',
  });
  assert.equal(matching(problems, /bad\.astro:2: border-radius: 7px/).length, 1);
  assert.equal(matching(problems, /bad\.astro:3: line-height: 1\.42/).length, 1);
  assert.deepEqual(matching(problems, /bad\.astro:[45]/), []);
});

test('!important does not smuggle a raw value past the gate', () => {
  const { problems } = run({
    'src/pages/bad.astro': '<style>\n  .a { font-size: 0.85rem !important; }\n</style>\n',
  });
  assert.equal(matching(problems, /font-size: 0\.85rem/).length, 1);
});

test('ignores markup and frontmatter outside <style>', () => {
  // An .astro file is markup, TypeScript and CSS in one; only the CSS is ours.
  const { problems } = run({
    'src/pages/bad.astro':
      '---\nconst css = "font-size: 13px";\n---\n<div style="font-size: 11px">x</div>\n' +
      '<style>\n  .a { font-size: var(--fs-ui); }\n</style>\n',
  });
  assert.deepEqual(problems, []);
});

test('ignores commented-out declarations', () => {
  const { problems } = run({
    'src/styles/main.scss': `${TOKENS}\n/* .a { font-size: 13px; } */\n// .b { font-size: 14px; }\n`,
  });
  assert.deepEqual(problems, []);
});

test('reports the line the author edits', () => {
  const { problems } = run({
    'src/pages/bad.astro': '<p>x</p>\n\n\n<style>\n\n  .a { font-size: 12px; }\n</style>\n',
  });
  assert.equal(matching(problems, /bad\.astro:6:/).length, 1);
});
