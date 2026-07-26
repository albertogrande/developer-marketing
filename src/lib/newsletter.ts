// The newsletter is in-house: our list, our service, our sender. Nothing here
// talks to Mailchimp, Substack or beehiiv, and no third-party script runs on
// the page — the form is a form.
//
// The capture endpoint is the one piece a static site on GitHub Pages cannot
// host itself, so it is configured at build time:
//
//   PUBLIC_NEWSLETTER_API=https://list.example.com   npm run build
//
// (Astro only exposes env vars prefixed PUBLIC_ to the client bundle.) Point it
// at the subscribe service in `service/` — see service/README.md. Unset, the
// call-to-action degrades honestly: it says the sign-up is not wired up yet and
// offers the feed instead of a form that would silently fail.

const RAW_API = (import.meta.env.PUBLIC_NEWSLETTER_API ?? '').trim();

// Trailing slashes make `${api}/subscribe` into a double-slash path that some
// routers 404 on. Normalize once, here.
export const NEWSLETTER_API = RAW_API.replace(/\/+$/, '');

/** Is a capture endpoint configured for this build? */
export const NEWSLETTER_LIVE = NEWSLETTER_API.length > 0;

export const SUBSCRIBE_URL = NEWSLETTER_LIVE ? `${NEWSLETTER_API}/subscribe` : '';

/** What the reader is signing up for. One place, so every surface agrees. */
export const NEWSLETTER = {
  name: 'The Week',
  cadence: 'Monday mornings',
  promise:
    'One short email a week: what actually moved in developer marketing, what it means, and every claim linked to its source.',
  volume: 'One email a week. No drip sequence, no upsells, no "quick question" follow-ups.',
} as const;
