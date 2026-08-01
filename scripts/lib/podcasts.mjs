// The podcast watch list and the pure parsing helpers behind
// `npm run podcast:transcripts`. One module so the feed registry, the scout's
// skill file and the fetch tool can't drift apart — same reason the route
// table lives in ./routes.mjs.
//
// WHY THIS EXISTS: the scout reads show notes, it does not listen. Show notes
// are a summary written by the publisher's marketing; they are not evidence.
// When a publisher ships a real transcript, a claim from an episode becomes
// checkable and quotable like any written source.
//
// WHAT IT DELIBERATELY DOES NOT DO: it never commits a transcript. A transcript
// is a copy of someone else's copyrighted work. This repo is public and its own
// content is CC BY 4.0 — a license it has no right to apply to a third party's
// words. Transcripts land in a gitignored cache, are used to verify a fact or
// lift a short attributed quote, and are then disposable. Quoting briefly with
// attribution is ordinary journalism; republishing whole transcripts is not.

// The fixed watch list. `transcripts` records what was observed when the feed
// was last checked, so a run that finds nothing is a change worth noticing
// rather than a silent gap.
export const PODCASTS = [
  {
    id: 'scaling-devtools',
    name: 'Scaling DevTools',
    feed: 'https://feeds.transistor.fm/scaling-devtools',
    // Transistor emits <podcast:transcript> in txt/vtt/srt/json for nearly
    // every episode — but only once transcription finishes, which lags
    // publication by a few days. The newest episode routinely has none.
    transcripts: 'rss-tag',
  },
  {
    id: 'latent-space',
    name: 'Latent Space',
    feed: 'https://api.substack.com/feed/podcast/1084089.rss',
    // No RSS tag; the Substack episode page carries the transcript inline.
    transcripts: 'on-page',
  },
  {
    id: 'pragmatic-engineer',
    name: 'The Pragmatic Engineer',
    feed: 'https://newsletter.pragmaticengineer.com/feed',
    transcripts: 'on-page',
  },
  {
    id: 'devtools-fm',
    name: 'devtools.fm',
    feed: 'https://www.devtools.fm/rss.xml',
    // Publishes irregularly — month-long gaps are normal, not an outage.
    transcripts: 'none',
  },
];

const PODCAST_NS = 'podcast:transcript';

// Transcript formats worth having, best first.
//
// vtt wins over plain text even though plain text needs no conversion: the
// publisher's .txt carries speaker labels but no timestamps, and a claim
// without a timestamp is one a reader cannot go check against the audio.
// Converting vtt is cheap; recovering a lost timestamp is impossible.
const TYPE_RANK = ['text/vtt', 'application/x-subrip', 'text/plain'];

const unwrap = (s) =>
  s
    .replace(/^<!\[CDATA\[/, '')
    .replace(/\]\]>$/, '')
    .trim();

const tagText = (block, tag) => {
  const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`));
  return m ? unwrap(m[1]) : undefined;
};

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`));
  return m ? m[1] : undefined;
};

// Minimal RSS reader. A dependency-free regex pass is enough here because the
// shape consumed is tiny and fixed (title, link, date, enclosure, transcript)
// and every field is validated by the caller before use.
export function parseFeed(xml) {
  const channel = xml.split('<item>');
  const feedTitle = tagText(channel[0] ?? '', 'title');
  const items = channel.slice(1).map((raw) => {
    const block = raw.split('</item>')[0];
    const transcripts = [...block.matchAll(new RegExp(`<${PODCAST_NS}[^>]*>`, 'g'))]
      .map(([tag]) => ({ type: attr(tag, 'type'), url: attr(tag, 'url') }))
      .filter((t) => t.url);
    const enclosureTag = block.match(/<enclosure[^>]*>/)?.[0];
    const pub = tagText(block, 'pubDate');
    const date = pub ? new Date(pub) : undefined;
    return {
      title: tagText(block, 'title'),
      link: tagText(block, 'link'),
      date: date && !Number.isNaN(date.getTime()) ? date : undefined,
      audio: enclosureTag ? attr(enclosureTag, 'url') : undefined,
      transcripts,
    };
  });
  return { feedTitle, items };
}

// Best available transcript, or undefined when the publisher shipped none.
export function pickTranscript(transcripts = []) {
  for (const type of TYPE_RANK) {
    const hit = transcripts.find((t) => t.type === type);
    if (hit) return hit;
  }
  return transcripts[0];
}

// Episodes published within `days` of `now`. The scout asks "what shipped in
// the last ~24h", so this is the whole windowing logic.
export function withinDays(items, days, now = new Date()) {
  const cutoff = now.getTime() - days * 86400000;
  return items.filter((i) => i.date && i.date.getTime() >= cutoff);
}

// `00:14:20.480` / `00:14:20,480` → `14:20`, dropping a leading zero hour so
// the common case reads like a player's position indicator.
export const shortStamp = (raw) => {
  const m = String(raw).match(/(\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, h, mm, ss] = m;
  return h === '00' ? `${mm}:${ss}` : `${h}:${mm}:${ss}`;
};

// WebVTT → readable text. Drops the header and cue numbers, and turns
// `<v Speaker>` voice spans into a `Speaker:` prefix so a quote can be
// attributed to whoever actually said it. Consecutive lines from one speaker
// join into a paragraph.
//
// Timestamps are kept by default and prefixed to each speaker turn. They are
// the whole point of caching a transcript: "the guest says X" is hearsay,
// "the guest says X at 14:20" is a claim a reader can go check against the
// audio. Pass { timestamps: false } for prose-only output.
export function vttToText(vtt, { timestamps = true } = {}) {
  const lines = String(vtt).split(/\r?\n/);
  const out = [];
  let speaker = null;
  let pending = null; // start time of the cue currently being read
  for (const line of lines) {
    const t = line.trim();
    if (!t || t === 'WEBVTT' || t.startsWith('NOTE ')) continue;
    if (t.includes('-->')) {
      pending = shortStamp(t.split('-->')[0]);
      continue;
    }
    if (/^\d+$/.test(t)) continue; // cue number
    const voice = t.match(/^<v\s+([^>]+)>([\s\S]*)$/);
    const text = (voice ? voice[2] : t).replace(/<\/?[^>]+>/g, '').trim();
    if (!text) continue;
    const who = voice ? voice[1].trim() : null;
    const stamp = timestamps && pending ? `[${pending}] ` : '';
    if (who && who !== speaker) {
      speaker = who;
      out.push(`\n${stamp}${who}: ${text}`);
    } else if (!out.length) {
      out.push(`${stamp}${text}`);
    } else if (who) {
      out[out.length - 1] += ` ${text}`;
    } else {
      // No voice span: keep turns separate so a stamped line stays findable.
      out.push(`${stamp}${text}`);
    }
  }
  return out.join('\n').trim();
}

// SubRip → readable text. Same shape as WebVTT minus the header and voice
// spans, so it reuses the same pass.
export function srtToText(srt, opts) {
  return vttToText(String(srt), opts);
}

export function transcriptToText(body, type, opts) {
  if (type === 'text/vtt') return vttToText(body, opts);
  if (type === 'application/x-subrip') return srtToText(body, opts);
  return String(body).trim();
}

const stem = (podcastId, date, title) =>
  `${date.toISOString().slice(0, 10)}-${podcastId}-${String(title ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)}`;

// A stable, filesystem-safe cache name for one episode's raw transcript.
export const cacheName = (podcastId, date, title) => `${stem(podcastId, date, title)}.txt`;

// The distilled note for the same episode. Same stem, different extension and
// directory, so "does this episode already have a note?" is a file-exists check
// with no index to keep in sync.
export const noteName = (podcastId, date, title) => `${stem(podcastId, date, title)}.md`;
