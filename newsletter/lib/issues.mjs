// Reading an issue out of the site's own content. The newsletter is not a
// separate publication: it is `src/content/issues/<YYYY-Www>.md` delivered to
// people who asked for it, so there is one text to keep correct and the archive
// on the web is exactly what landed in the inbox.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

const WEEKLY_DIR = 'src/content/issues';

/** Newest first. Filenames are ISO week ids, so they sort lexicographically. */
export function listIssues(dir = WEEKLY_DIR) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /^\d{4}-W\d{2}\.mdx?$/.test(f))
    .map((f) => f.replace(/\.mdx?$/, ''))
    .sort()
    .reverse();
}

export function latestIssueId(dir = WEEKLY_DIR) {
  return listIssues(dir)[0] ?? null;
}

/**
 * @param {string} week  ISO week id, e.g. "2026-W29"
 * @returns {{week: string, title: string, summary: string, date: Date, body: string,
 *            sources: {label:string,url:string}[], related: {label:string,href:string}[]}}
 */
export function loadIssue(week, dir = WEEKLY_DIR) {
  if (!/^\d{4}-W\d{2}$/.test(week)) throw new Error(`issues: "${week}" is not an ISO week id (YYYY-Www)`);
  const path = join(dir, `${week}.md`);
  if (!existsSync(path)) throw new Error(`issues: no issue at ${path}`);

  const raw = readFileSync(path, 'utf8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) throw new Error(`issues: ${path} has no frontmatter`);
  const data = parseYaml(match[1]) ?? {};
  const body = raw.slice(match[0].length).trim();

  if (!data.title) throw new Error(`issues: ${path} has no title`);
  if (!body) throw new Error(`issues: ${path} has an empty body`);

  return {
    week: data.week || week,
    title: String(data.title),
    summary: String(data.summary || ''),
    date: data.date ? new Date(data.date) : new Date(),
    body,
    sources: Array.isArray(data.sources) ? data.sources : [],
    related: Array.isArray(data.related) ? data.related : [],
  };
}
