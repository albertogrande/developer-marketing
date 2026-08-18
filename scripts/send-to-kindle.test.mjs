import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, recipientsFrom, subjectFor, bodyFor, sendIssue } from './send-to-kindle.mjs';

test('arguments parse, and an unknown one is refused rather than ignored', () => {
  assert.deepEqual(parseArgs([]), { week: '', dryRun: false });
  assert.deepEqual(parseArgs(['--week', '2026-W32']), { week: '2026-W32', dryRun: false });
  assert.deepEqual(parseArgs(['--dry-run']), { week: '', dryRun: true });
  assert.throws(() => parseArgs(['--weekk', '2026-W32']), /unknown argument/);
});

test('KINDLE_ADDRESS carries one or several devices', () => {
  assert.deepEqual(recipientsFrom('a@kindle.com'), ['a@kindle.com']);
  assert.deepEqual(recipientsFrom(' a@kindle.com , b@kindle.com '), ['a@kindle.com', 'b@kindle.com']);
  assert.deepEqual(recipientsFrom(''), []);
  assert.deepEqual(recipientsFrom(undefined), []);
});

test('the mail names the issue, and the body links the canonical page', () => {
  const issue = { title: 'A commodity, priced', summary: 'One sentence.' };
  assert.equal(subjectFor(issue, '2026-W32'), 'The Beat — 2026-W32: A commodity, priced');
  assert.match(bodyFor(issue, '2026-W32'), /https:\/\/thebeat\.dev\/issues\/2026-W32/);
});

test('an unconfigured KINDLE_ADDRESS is a successful no-op, not a failure', async () => {
  const before = process.env.KINDLE_ADDRESS;
  delete process.env.KINDLE_ADDRESS;
  try {
    const lines = [];
    const result = await sendIssue({ week: '2026-W32' }, (l) => lines.push(l));
    assert.deepEqual(result, { sent: 0, skipped: true });
    assert.match(lines.join('\n'), /KINDLE_ADDRESS is not set/);
  } finally {
    if (before !== undefined) process.env.KINDLE_ADDRESS = before;
  }
});

test('--dry-run resolves and builds the issue but sends nothing', async () => {
  const before = process.env.KINDLE_ADDRESS;
  process.env.KINDLE_ADDRESS = 'reader@kindle.com';
  try {
    const lines = [];
    const result = await sendIssue({ week: '2026-W32', dryRun: true }, (l) => lines.push(l));
    assert.equal(result.sent, 0);
    assert.equal(result.dryRun, true);
    const log = lines.join('\n');
    // the document is built before the decision not to send it, so a broken
    // issue fails the dry run too
    assert.match(log, /the-beat-2026-W32\.html/);
    assert.match(log, /reader@kindle\.com/);
  } finally {
    if (before === undefined) delete process.env.KINDLE_ADDRESS;
    else process.env.KINDLE_ADDRESS = before;
  }
});

test('a week with no issue file fails loudly instead of substituting another', async () => {
  const before = process.env.KINDLE_ADDRESS;
  process.env.KINDLE_ADDRESS = 'reader@kindle.com';
  try {
    await assert.rejects(() => sendIssue({ week: '2026-W99', dryRun: true }, () => {}), /no issue at/);
  } finally {
    if (before === undefined) delete process.env.KINDLE_ADDRESS;
    else process.env.KINDLE_ADDRESS = before;
  }
});
