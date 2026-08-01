import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PODCASTS,
  parseFeed,
  pickTranscript,
  withinDays,
  vttToText,
  transcriptToText,
  shortStamp,
  cacheName,
  noteName,
} from './lib/podcasts.mjs';

// A feed shaped like the real ones: one episode with transcripts in several
// formats, one without (the newest episode routinely has none — transcription
// lags publication).
const FEED = `<?xml version="1.0"?>
<rss xmlns:podcast="https://podcastindex.org/namespace/1.0">
<channel>
<title>Test Show</title>
<item>
  <title><![CDATA[Newest, no transcript yet]]></title>
  <link>https://example.com/ep2</link>
  <pubDate>Tue, 28 Jul 2026 08:21:56 +0100</pubDate>
  <enclosure url="https://media.example.com/2.mp3" type="audio/mpeg" length="123"/>
</item>
<item>
  <title>Older, transcribed</title>
  <link>https://example.com/ep1</link>
  <pubDate>Fri, 10 Jul 2026 14:04:00 +0000</pubDate>
  <enclosure url="https://media.example.com/1.mp3" type="audio/mpeg" length="456"/>
  <podcast:transcript url="https://example.com/1.vtt" type="text/vtt"/>
  <podcast:transcript url="https://example.com/1.srt" type="application/x-subrip"/>
  <podcast:transcript url="https://example.com/1.txt" type="text/plain"/>
</item>
</channel>
</rss>`;

test('parseFeed pulls title, link, date, audio and transcripts per item', () => {
  const { feedTitle, items } = parseFeed(FEED);
  assert.equal(feedTitle, 'Test Show');
  assert.equal(items.length, 2);
  assert.equal(items[0].title, 'Newest, no transcript yet'); // CDATA unwrapped
  assert.equal(items[0].transcripts.length, 0);
  assert.equal(items[1].link, 'https://example.com/ep1');
  assert.equal(items[1].audio, 'https://media.example.com/1.mp3');
  assert.equal(items[1].transcripts.length, 3);
  assert.equal(items[1].date.toISOString().slice(0, 10), '2026-07-10');
});

test('parseFeed survives a feed with no items', () => {
  const { items } = parseFeed('<rss><channel><title>Empty</title></channel></rss>');
  assert.deepEqual(items, []);
});

test('pickTranscript prefers vtt over plain text, because plain text has no timestamps', () => {
  const all = parseFeed(FEED).items[1].transcripts;
  assert.equal(pickTranscript(all).type, 'text/vtt');
  assert.equal(pickTranscript(all.filter((t) => t.type !== 'text/vtt')).type, 'application/x-subrip');
  // Plain text is still better than nothing when it is all the publisher ships.
  assert.equal(pickTranscript(all.filter((t) => t.type === 'text/plain')).type, 'text/plain');
  assert.equal(pickTranscript([]), undefined);
});

test('withinDays keeps only episodes inside the window', () => {
  const { items } = parseFeed(FEED);
  const now = new Date('2026-07-29T00:00:00Z');
  assert.equal(withinDays(items, 2, now).length, 1); // only the 07-28 episode
  assert.equal(withinDays(items, 30, now).length, 2);
  assert.equal(withinDays(items, 1, new Date('2026-08-05T00:00:00Z')).length, 0);
});

test('withinDays ignores items with an unparseable date', () => {
  const { items } = parseFeed(
    '<rss><channel><item><title>x</title><pubDate>not a date</pubDate></item></channel></rss>'
  );
  assert.equal(items[0].date, undefined);
  assert.equal(withinDays(items, 365, new Date('2026-07-29T00:00:00Z')).length, 0);
});

test('vttToText keeps a timestamp per speaker turn by default', () => {
  const vtt = [
    'WEBVTT',
    '',
    '00:14:20.480 --> 00:14:25.000',
    '<v Kim>Awareness is the wrong single metric.',
    '',
    '01:02:03.000 --> 01:02:09.000',
    '<v Jack>Say more about that.',
    '',
  ].join('\n');
  const text = vttToText(vtt);
  // A quote is only checkable if the reader can find it in the audio.
  assert.match(text, /\[14:20\] Kim: Awareness is the wrong single metric\./);
  // Past an hour the hour component has to survive.
  assert.match(text, /\[01:02:03\] Jack: Say more about that\./);
  assert.doesNotMatch(text, /-->/);
});

test('vttToText omits timestamps when asked for prose only', () => {
  const vtt = ['WEBVTT', '', '00:14:20.480 --> 00:14:25.000', '<v Kim>Awareness is the wrong metric.', ''].join('\n');
  assert.equal(vttToText(vtt, { timestamps: false }), 'Kim: Awareness is the wrong metric.');
});

test('vttToText attributes lines to the speaker and joins their turn', () => {
  const vtt = [
    'WEBVTT',
    '',
    '00:00:00.000 --> 00:00:10.480',
    '<v Kim>Thinking about it in a narrow scope does a disservice.',
    '',
    '00:00:10.560 --> 00:00:35.770',
    '<v Jack>Today I am talking with Kim.',
    '',
    '00:00:36.000 --> 00:00:40.000',
    '<v Jack>She breaks down her flywheel.',
    '',
  ].join('\n');
  const text = vttToText(vtt, { timestamps: false });
  assert.match(text, /^Kim: Thinking about it/);
  // Consecutive lines from one speaker join into a paragraph, so a quote is
  // not split mid-sentence by a cue boundary.
  assert.match(text, /Jack: Today I am talking with Kim\. She breaks down her flywheel\./);
  assert.doesNotMatch(text, /-->/);
  assert.doesNotMatch(text, /WEBVTT/);
});

test('vttToText drops cue numbers, NOTE blocks and inline markup', () => {
  const vtt = ['WEBVTT', '', 'NOTE recorded live', '', '1', '00:00:01.000 --> 00:00:02.000', 'Plain <b>line</b>', ''].join('\n');
  assert.equal(vttToText(vtt, { timestamps: false }), 'Plain line');
  assert.equal(vttToText(vtt), '[00:01] Plain line');
});

test('shortStamp drops a zero hour and keeps a real one', () => {
  assert.equal(shortStamp('00:14:20.480'), '14:20');
  assert.equal(shortStamp('01:02:03,000'), '01:02:03');
  assert.equal(shortStamp('nonsense'), null);
});

test('noteName mirrors cacheName so "has a note?" is a file-exists check', () => {
  const args = ['scaling-devtools', new Date('2026-07-10T14:04:00Z'), 'Kim Maida on the DevRel Flywheel'];
  assert.equal(cacheName(...args).replace(/\.txt$/, ''), noteName(...args).replace(/\.md$/, ''));
  assert.match(noteName(...args), /\.md$/);
});

test('transcriptToText dispatches by declared type and leaves plain text alone', () => {
  assert.equal(transcriptToText('  already plain  ', 'text/plain'), 'already plain');
  assert.match(
    transcriptToText('1\n00:00:01,000 --> 00:00:02,000\nSubrip line\n', 'application/x-subrip'),
    /Subrip line/
  );
});

test('cacheName is dated, filesystem-safe and bounded', () => {
  const name = cacheName('scaling-devtools', new Date('2026-07-10T14:04:00Z'), 'Kim Maida on the DevRel Flywheel, AI & More!');
  assert.match(name, /^2026-07-10-scaling-devtools-kim-maida-on-the-devrel-flywheel-ai-more\.txt$/);
  assert.doesNotMatch(name, /[^a-z0-9.-]/);
  const long = cacheName('x', new Date('2026-01-01T00:00:00Z'), 'w'.repeat(500));
  assert.ok(long.length < 90);
});

test('every configured podcast has an id, a feed URL and a transcript posture', () => {
  const ids = new Set();
  for (const p of PODCASTS) {
    assert.ok(p.id && p.name, `podcast missing id/name: ${JSON.stringify(p)}`);
    assert.match(p.feed, /^https:\/\//, `${p.id}: feed must be https`);
    assert.ok(['rss-tag', 'on-page', 'none'].includes(p.transcripts), `${p.id}: unknown transcripts posture`);
    assert.ok(!ids.has(p.id), `duplicate podcast id: ${p.id}`);
    ids.add(p.id);
  }
});
