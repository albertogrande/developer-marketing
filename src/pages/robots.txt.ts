import type { APIRoute } from 'astro';
import { absUrl } from '../lib/site';

// robots.txt, generated so the Sitemap line always matches where this build
// is actually served (site.config.mjs). Served at the domain root on Vercel —
// where crawlers actually read it. Policy: everything public, machine
// endpoints included, AI crawlers welcome — this site is written to be read
// by agents as much as by people. The explicit stanzas are the statement of
// intent per bot family (training, search-index, and user-triggered fetchers
// alike): all allowed.

const BOTS = [
  '# OpenAI: training / ChatGPT Search index / user-triggered fetches',
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  '# Anthropic: training / Claude search index / user-triggered fetches',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  '# Perplexity: index / user-triggered fetches',
  'PerplexityBot',
  'Perplexity-User',
  '# Google: Gemini grounding/training opt-in (AI Overviews use normal Googlebot)',
  'Google-Extended',
  '# Apple Intelligence',
  'Applebot-Extended',
  '# Microsoft / Bing (feeds Copilot and ChatGPT Search)',
  'bingbot',
  '# Meta AI',
  'meta-externalagent',
  '# Common Crawl (feeds many research corpora)',
  'CCBot',
];

export const GET: APIRoute = () => {
  const lines = [
    '# Everything public, machine endpoints included, AI crawlers welcome.',
    `# Start here: ${absUrl('/llms.txt')} and ${absUrl('/api.json')}`,
    '',
  ];
  for (const b of BOTS) {
    if (b.startsWith('#')) {
      lines.push(b);
    } else {
      lines.push(`User-agent: ${b}`, 'Allow: /', '');
    }
  }
  lines.push('User-agent: *', 'Allow: /', '');
  lines.push(`Sitemap: ${absUrl('/sitemap-index.xml')}`);
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
