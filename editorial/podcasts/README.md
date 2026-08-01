# Episode notes

Internal editorial memory, one file per podcast episode. Not rendered on the
site — this is the corpus the scout and the weekly editor search when they need
to know whether a claim has come up before, who said it, and where to check it.

## What lives here, and what deliberately does not

**Here: the distilled note.** Topics, the claims with their timestamps, the
guests, two or three short attributed quotes, and an honest read of what the
episode is and is not evidence for. That is this site's own analysis and it is
committed like any other editorial file.

**Not here: the transcript.** Raw transcripts land in `.cache/transcripts/`,
which is gitignored, and are disposable. A transcript is the publisher's
copyrighted work; this repo publishes its own content under CC BY 4.0 and has no
right to apply that licence to somebody else's words. Storing them permanently
in a public repository would be redistribution, not reference.

So the transcript is a working artifact — fetch it, distil it, let it go. Quote
briefly with attribution and a timestamp; never reproduce an episode at length,
here or in a brief.

The distinction is also just better for the job: a note is ~400 words against a
transcript's ~8,000, already filtered to what matters to a developer-marketing
practitioner, and searchable with grep. At this scale — under a couple of
hundred episodes — plain files beat any embedding store, and there is nothing
to keep in sync.

## Working the queue

```bash
npm run podcast:transcripts -- --pending    # episodes with a transcript, no note
npm run podcast:transcripts -- --all        # fetch the whole back catalogue
npm run podcast:transcripts -- --days 2     # the daily sweep
```

`--pending` compares this directory against the feeds by filename, so a note
existing *is* the record that an episode is done. No index, nothing to
desynchronise.

The back catalogue is drained incrementally by the daily scout rather than in
one pass — see `.claude/skills/daily-scout/SKILL.md`. A missing note is never an
error; it only means that episode has not been reached yet.

## Note format

Frontmatter carries `show`, `episode`, `date`, `url`, `guests`, `host`,
`topics`, `candidates`, and `distilled` (when the note was written). The body
runs four sections: **What it covers**, **Claims worth checking** (each with a
timestamp and an honest label — measured, self-reported, or anecdotal),
**Quotes**, and **Why it matters here**, which ties the episode to a guide
section and says plainly where it is weak.

`candidates` is the promotion flag, mirroring the scout's ` · practice-candidate`
convention on signals — it lives in frontmatter so the weekly editor can grep
for it rather than read every note. Valid values:

- `practice` — the episode supports a `when X → do Y (because Z)` unit.
- `deep-dive` — a thread worth a long piece, especially if it recurs across
  several episodes.
- `example` — **rare**. Only when the episode points at an openable artifact,
  and then the artifact is the example and the episode is a supporting source.
- `skill` — an installable agent skill with a real install line.

Omit `candidates` entirely when an episode is worth remembering but promotes
nothing. Most episodes are that, and a note with no flag is still doing its job.

## What a note may not do

An episode note never patches the guide as fact. The guide records hard,
verified facts; a practitioner's experience is a position, however credible the
practitioner. It reaches the guide through a practice that names who said it, or
not at all.

Say what the episode is *not* evidence for. A practitioner's experience is worth
recording and is not a data point, and a note that blurs the two will eventually
put an unsupported claim into the guide.
