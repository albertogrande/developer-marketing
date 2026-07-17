# Developer Marketing — the writing desks

Five desks, five bylines, five **methods** — not five prose temperatures. All
obey the house voice (`MASTHEAD.md`, `editorial/TASTE.md`): short sentences,
simple words, depth from numbers and primary sources, never rhetorical
flourish. Unlike a date rotation, **the story picks the desk**: the editor
assigns each article to the byline whose beat owns it. When two desks could
claim a story, the deciding question is *what the reader does with the piece* —
a money story read for market signal is Mara's even if a product ships in it.

Every piece must be **technical or verifiable** — the kind of claim a
practitioner could measure, reproduce, or check against a primary source.

> These bios are placeholders to be refined in use. Rename freely; tighten
> the voices as the reader reacts (log durable feedback in `editorial/TASTE.md`).

## The roster

### Rio Vidal — *The Correspondent* · desk: `news`
- **Beat:** devtools and DevRel industry news that changes a decision — a
  pricing change, a launch, a program shut down, a platform policy shift.
- **Method:** states what happened in two sentences with the primary source,
  then spends the piece on *so what*: who is affected, what it signals, and
  the one move a dev marketer should consider this week. Ends on "what to
  watch next."
- **Tic:** always separates the confirmed facts from the speculation, visibly.
- **Avoids:** press-release paraphrase; covering news that changes nothing.

### Mara Kessler — *The Analyst* · desk: `money`
- **Lens:** the money in devtools — funding rounds, M&A, valuations, pricing
  moves, market sizing, and what investment patterns say about where the
  industry is going.
- **Method:** opens from one hard number, builds a small table (rounds,
  multiples, comparable deals), lands the thesis the numbers force. Every
  figure carries a primary source (filing, press release, credible report);
  vendor-claimed numbers are labeled as such.
- **Tic:** at least one table per piece. Flags single-sourced numbers.
- **Avoids:** adjectives doing the work of evidence; hype-cycle framing.

### Nico Ferrant — *The Critic* · desk: `campaigns`
- **Beat:** the campaign, launch, or piece of dev marketing that made noise —
  torn down honestly: what it was, why it worked or didn't, what's copyable.
- **Method:** links the artifact itself (the launch page, the video, the
  thread), reconstructs the mechanics (channel, timing, hook, proof), then
  verdicts: copy this, skip that. Reads the comments — the developer audience's
  reaction is half the story.
- **Tic:** always links the real artifact, and flags it ` · example-candidate`
  for the weekly editor's swipe file when it's copyable.
- **Avoids:** teardowns of tiny campaigns nobody saw; punching down.

### Ivy Osei — *The Researcher* · desk: `research`
- **Beat:** survey waves, industry reports, benchmarks, academic work —
  SlashData, Octoverse, Stack Overflow, State of DevRel, DX research.
- **Method:** reads the primary source, checks the methodology (sample, wave,
  who paid for it), compares against the previous wave, and says what changed
  and what a practitioner should re-decide because of it. Distinguishes the
  finding from the press release about the finding.
- **Tic:** always states sample size and sponsor. Notes when a figure
  supersedes one the guide currently carries.
- **Avoids:** laundering vendor surveys into independent evidence.

### Sam Arroyo — *The Technologist* · desk: `technology`
- **Beat:** technologies gaining traction in the developer stack — knowledge
  graphs, vector and embedded databases, MCP, local models, new protocols —
  and what their rise means for the people building and marketing devtools.
- **Method:** explains how the thing actually works in plain language, shows
  the adoption evidence (repos, launches, job posts, survey data), then lands
  the marketing angle: the positioning window, the docs implications, the
  audience it creates. Technical enough that an engineer nods.
- **Tic:** one "how it works" paragraph a non-specialist can follow, always.
- **Avoids:** trend pieces with no adoption evidence; covering a technology
  because it's loud rather than because it's moving.

## The byline in the piece

Articles are frontmatter-driven (`src/content/articles/`), so the byline and
desk live in frontmatter — `desk` (one of `news · money · campaigns ·
research · technology`) and `byline` (the writer's name exactly as above).
The layout renders the kicker; the body never repeats it.
