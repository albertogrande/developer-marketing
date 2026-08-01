// isoWeekId is the weekly collection's literal filename and the signals
// filename — the promise is exact agreement with `date -u +%G-W%V`, year
// boundaries included. These cases pin the boundaries that break naive
// implementations.

import test from 'node:test';
import assert from 'node:assert/strict';
import { isoWeekId } from '../src/lib/dates.mjs';

const at = (s) => new Date(`${s}T12:00:00Z`);

test('mid-year weeks', () => {
  assert.equal(isoWeekId(at('2026-07-06')), '2026-W28');
  assert.equal(isoWeekId(at('2026-07-12')), '2026-W28', 'Sunday closes the week');
  assert.equal(isoWeekId(at('2026-07-13')), '2026-W29', 'Monday opens the next');
});

test('early January can belong to the previous ISO year', () => {
  assert.equal(isoWeekId(at('2027-01-01')), '2026-W53');
  assert.equal(isoWeekId(at('2027-01-03')), '2026-W53');
  assert.equal(isoWeekId(at('2027-01-04')), '2027-W01');
});

test('late December can belong to the next ISO year', () => {
  assert.equal(isoWeekId(at('2024-12-30')), '2025-W01');
  assert.equal(isoWeekId(at('2024-12-29')), '2024-W52');
});

test('week 53 years', () => {
  assert.equal(isoWeekId(at('2026-12-31')), '2026-W53');
  assert.equal(isoWeekId(at('2020-12-31')), '2020-W53');
});

test('single-digit weeks are zero-padded', () => {
  assert.equal(isoWeekId(at('2026-02-03')), '2026-W06');
});
