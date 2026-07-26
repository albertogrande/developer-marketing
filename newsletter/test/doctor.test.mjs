// The preflight's judgement calls, unit-tested. The network probes are not
// tested here — they measure the machine they run on, which is the point of
// them, and a test that asserts what a sandbox's DNS does would assert nothing.

import test from 'node:test';
import assert from 'node:assert/strict';
import { findSpf, describeDmarc, ptrMatches, volumeAdvice } from '../doctor.mjs';

test('SPF is picked out of a pile of TXT records', () => {
  // Node returns TXT as arrays of string chunks, which is how a long record
  // arrives on the wire.
  const records = [
    ['google-site-verification=abc'],
    ['v=spf1 include:_spf.example.com ', '-all'],
    ['some-other=thing'],
  ];
  assert.equal(findSpf(records), 'v=spf1 include:_spf.example.com -all');
  assert.equal(findSpf([['v=DMARC1; p=none']]), null);
  assert.equal(findSpf([]), null);
});

test('DMARC is read for what it actually asks receivers to do', () => {
  assert.deepEqual(describeDmarc(null), { present: false, policy: null, note: 'no _dmarc record' });

  const none = describeDmarc('v=DMARC1; p=none; rua=mailto:d@example.com');
  assert.equal(none.policy, 'none');
  assert.match(none.note, /only monitors/);
  assert.match(none.note, /with reporting/);

  const reject = describeDmarc('v=DMARC1; p=reject');
  assert.equal(reject.policy, 'reject');
  assert.match(reject.note, /no rua= reporting address/);

  const broken = describeDmarc('v=DMARC1; sp=none');
  assert.equal(broken.present, true);
  assert.equal(broken.policy, null);
});

test('a PTR only counts when it resolves back to the same address', () => {
  assert.equal(ptrMatches('mail.example.com', ['198.51.100.7'], '198.51.100.7'), true);
  // Points at a name that resolves somewhere else: receivers treat this as
  // unverified, which is worse than useless because it looks deliberate.
  assert.equal(ptrMatches('mail.example.com', ['203.0.113.9'], '198.51.100.7'), false);
  assert.equal(ptrMatches('mail.example.com', [], '198.51.100.7'), false);
  assert.equal(ptrMatches(null, ['198.51.100.7'], '198.51.100.7'), false);
});

test('volume advice: the daily cap bites before the monthly one', () => {
  const small = volumeAdvice(40);
  assert.equal(small.exceedsResendFreeDaily, false);
  assert.equal(small.exceedsResendFreeMonthly, false);

  // A weekly send goes out in one day, so 101 subscribers breaks the 100/day
  // cap while using a twentieth of the monthly allowance.
  const tipping = volumeAdvice(101);
  assert.equal(tipping.exceedsResendFreeDaily, true);
  assert.equal(tipping.exceedsResendFreeMonthly, false);
  assert.ok(tipping.monthly < 3000);

  const big = volumeAdvice(1000);
  assert.equal(big.monthly, 4300);
  assert.equal(big.exceedsResendFreeMonthly, true);
  // $0.10 per 1,000 recipients: a thousand subscribers is pocket change.
  assert.equal(big.sesMonthlyUsd, 0.43);
});
