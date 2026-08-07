// Unit tests for the deterministic half of the jobs sweep. Ported from the
// source repo's merge.test.ts, trimmed to this board's scope: no batches, no
// EU gate — region is a classification, remote-only is the only gate.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalUrl,
  jobId,
  identityKey,
  collapseByIdentity,
  classifyRegion,
  validateIncoming,
  mergeJobs,
  isClosedPageBody,
  parseGreenhousePosting,
} from './jobs-merge.mjs';

const NOW = '2026-08-09';

const incoming = (over = {}) => ({
  title: 'Head of Marketing',
  company: 'Acme',
  companyUrl: 'https://acme.dev',
  location: 'Remote (worldwide)',
  remote: 'remote',
  region: 'worldwide',
  category: 'marketing-leadership',
  tags: [],
  salary: null,
  url: 'https://jobs.ashbyhq.com/acme/1111-aaaa',
  source: 'search',
  summary: '',
  postedAt: null,
  ...over,
});

const stored = (over = {}) => ({
  ...incoming(),
  id: jobId(over.url ?? incoming().url),
  firstSeenAt: '2026-08-02',
  lastSeenAt: '2026-08-02',
  missedRuns: 0,
  ...over,
});

test('canonicalUrl strips tracking params, www and trailing slash', () => {
  assert.equal(
    canonicalUrl('https://www.acme.dev/jobs/1/?utm_source=x&gh_src=y'),
    'https://acme.dev/jobs/1',
  );
});

test('identityKey collapses company punctuation/word-order variants', () => {
  const a = identityKey({ company: 'DataHub (Acryl Data)', title: 'Head of Marketing' });
  const b = identityKey({ company: 'Acryl Data (DataHub)', title: 'Head of Marketing' });
  assert.equal(a, b);
});

test('collapseByIdentity keeps the employer JD over the aggregator listing', () => {
  const jd = stored({ url: 'https://jobs.ashbyhq.com/acme/1111-aaaa', firstSeenAt: '2026-08-03' });
  const agg = stored({
    id: 'agg1',
    url: 'https://weworkremotely.com/remote-jobs/acme-head-of-marketing',
    firstSeenAt: '2026-08-01',
  });
  const out = collapseByIdentity([jd, agg]);
  assert.equal(out.length, 1);
  assert.equal(out[0].url, jd.url);
  assert.equal(out[0].firstSeenAt, '2026-08-01'); // oldest history survives
});

test('classifyRegion: worldwide default, EU and US markers, other', () => {
  assert.equal(classifyRegion('Remote'), 'worldwide');
  assert.equal(classifyRegion('Remote — anywhere'), 'worldwide');
  assert.equal(classifyRegion('Remote (Europe, CET ±2)'), 'eu');
  assert.equal(classifyRegion('Remote — US only'), 'usa');
  assert.equal(classifyRegion('San Francisco, CA (Remote)'), 'usa');
  assert.equal(classifyRegion('Remote, LATAM'), 'other');
});

test('validateIncoming drops non-remote and bad categories, derives region', () => {
  assert.ok(validateIncoming(incoming({ remote: 'hybrid' })).reason);
  assert.ok(validateIncoming(incoming({ category: 'devrel' })).reason);
  const v = validateIncoming(incoming({ region: undefined, location: 'Remote (US timezones, EST)' }));
  assert.equal(v.job.region, 'usa');
});

test('mergeJobs refreshes a re-found role and resets its miss counter', async () => {
  const prev = stored({ missedRuns: 1 });
  const out = await mergeJobs([prev], [incoming({ salary: '$180k' })], NOW);
  assert.equal(out.length, 1);
  assert.equal(out[0].salary, '$180k');
  assert.equal(out[0].missedRuns, 0);
  assert.equal(out[0].lastSeenAt, NOW);
  assert.equal(out[0].firstSeenAt, '2026-08-02');
});

test('mergeJobs ages an unconfirmed role out after two missed weekly runs', async () => {
  const prev = stored();
  const afterOne = await mergeJobs([prev], [], NOW);
  assert.equal(afterOne.length, 1);
  assert.equal(afterOne[0].missedRuns, 1);
  const afterTwo = await mergeJobs(afterOne, [], NOW);
  assert.equal(afterTwo.length, 0);
});

test('mergeJobs drops immediately on authoritative dead, keeps on live', async () => {
  const dead = await mergeJobs([stored()], [], NOW, async () => 'dead');
  assert.equal(dead.length, 0);
  const live = await mergeJobs([stored({ missedRuns: 1 })], [], NOW, async () => 'live');
  assert.equal(live.length, 1);
  assert.equal(live[0].missedRuns, 0);
});

test('an incoming employer JD upgrades a stored aggregator URL in place', async () => {
  const agg = stored({ url: 'https://remoteok.com/remote-jobs/12345-acme-head-of-marketing' });
  const out = await mergeJobs([agg], [incoming()], NOW);
  assert.equal(out.length, 1);
  assert.equal(out[0].url, incoming().url);
  assert.equal(out[0].firstSeenAt, '2026-08-02');
});

test('isClosedPageBody matches only unambiguous closed wording', () => {
  assert.ok(isClosedPageBody('<p>This position is no longer open.</p>'));
  assert.ok(!isClosedPageBody('<p>We closed our Series B! Applications open.</p>'));
});

test('parseGreenhousePosting routes the EU stack separately', () => {
  assert.deepEqual(parseGreenhousePosting('https://job-boards.eu.greenhouse.io/acme/jobs/123'), {
    eu: true,
    org: 'acme',
    id: '123',
  });
  assert.equal(parseGreenhousePosting('https://acme.dev/jobs/1'), null);
});
