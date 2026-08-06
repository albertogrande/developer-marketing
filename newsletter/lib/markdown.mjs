// A deliberately small markdown renderer for email.
//
// The digests use a narrow subset — headings, paragraphs, links, emphasis,
// code, lists, blockquotes, rules — and email clients support even less than
// that, so a full CommonMark implementation would be dead weight. Anything
// unrecognised falls through as escaped text: worst case a reader sees a stray
// asterisk, never broken markup.
//
// Two outputs from one source: HTML for the multipart's HTML half, and a
// readable plain-text rendering for the half that people in mutt actually read.

const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Only http(s) and mailto survive; a "javascript:" href in a newsletter is
// exactly the kind of thing that gets a sending domain blocklisted.
const safeUrl = (url) => (/^(https?:|mailto:)/i.test(url.trim()) ? url.trim() : '#');

const SENTINEL = '\u0000';

/**
 * Site-internal links are written root-relative in the content ("/developer-
 * marketing/guide/…") because that is what works on the site. In an email there
 * is no site to be relative to, so they have to be absolute or they are dead.
 * @param {string} origin e.g. "https://thebeat.dev"
 */
export const resolveAgainst = (origin) => (href) =>
  href.startsWith('/') && !href.startsWith('//') ? `${origin.replace(/\/+$/, '')}${href}` : href;

/** Inline spans: code, links, strong, emphasis. Input is raw markdown. */
export function renderInline(
  md,
  { link = (href, text) => `<a href="${href}">${text}</a>`, resolve = (href) => href } = {}
) {
  // Pull code spans out first so nothing formats inside them.
  const codes = [];
  let text = String(md).replace(/`([^`]+)`/g, (_, code) => {
    codes.push(code);
    return `${SENTINEL}${codes.length - 1}${SENTINEL}`;
  });

  text = escapeHtml(text);
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => link(safeUrl(resolve(href)), label));
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s.,;:!?)]|$)/g, '$1<em>$2</em>');
  text = text.replace(/(^|[\s(])_([^_\n]+)_(?=[\s.,;:!?)]|$)/g, '$1<em>$2</em>');

  return text.replace(
    new RegExp(`${SENTINEL}(\\d+)${SENTINEL}`, 'g'),
    (_, i) => `<code>${escapeHtml(codes[Number(i)])}</code>`
  );
}

/**
 * Markdown → HTML.
 * @param {string} md
 * @param {object} [opts]
 * @param {Record<string,string>} [opts.styles]  inline CSS per tag, because Gmail
 *        strips <style> blocks and email has no cascade worth trusting.
 * @param {(href: string) => string} [opts.resolve]  see resolveAgainst()
 */
export function renderHtml(md, { styles = {}, resolve } = {}) {
  const style = (tag) => (styles[tag] ? ` style="${styles[tag]}"` : '');
  const inline = (s) =>
    renderInline(s, {
      resolve,
      link: (href, label) => `<a href="${href}"${style('a')}>${renderInline(label)}</a>`,
    });

  const lines = String(md).replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let i = 0;

  const takeWhile = (test) => {
    const block = [];
    while (i < lines.length && test(lines[i])) block.push(lines[i++]);
    return block;
  };

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    // Fenced code
    if (/^```/.test(line)) {
      i++;
      const body = takeWhile((l) => !/^```/.test(l));
      if (i < lines.length) i++; // closing fence
      out.push(`<pre${style('pre')}><code>${escapeHtml(body.join('\n'))}</code></pre>`);
      continue;
    }

    // Heading
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      out.push(`<h${level}${style(`h${level}`)}>${inline(heading[2].trim())}</h${level}>`);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^\s*([-*_])\s*\1\s*\1[\s\-*_]*$/.test(line)) {
      out.push(`<hr${style('hr')}>`);
      i++;
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const block = takeWhile((l) => /^>\s?/.test(l)).map((l) => l.replace(/^>\s?/, ''));
      out.push(`<blockquote${style('blockquote')}>${inline(block.join(' '))}</blockquote>`);
      continue;
    }

    // Lists (a blank line ends them; continuation lines are folded in)
    const bullet = /^\s*[-*+]\s+/;
    const ordered = /^\s*\d+[.)]\s+/;
    if (bullet.test(line) || ordered.test(line)) {
      const isOrdered = ordered.test(line) && !bullet.test(line);
      const marker = isOrdered ? ordered : bullet;
      const items = [];
      while (i < lines.length && lines[i].trim()) {
        if (marker.test(lines[i])) items.push(lines[i].replace(marker, ''));
        else if (items.length) items[items.length - 1] += ' ' + lines[i].trim();
        else break;
        i++;
      }
      const tag = isOrdered ? 'ol' : 'ul';
      out.push(
        `<${tag}${style(tag)}>` +
          items.map((it) => `<li${style('li')}>${inline(it.trim())}</li>`).join('') +
          `</${tag}>`
      );
      continue;
    }

    // Paragraph
    const para = takeWhile(
      (l) => l.trim() && !/^(#{1,4}\s|>\s?|```)/.test(l) && !bullet.test(l) && !ordered.test(l)
    );
    out.push(`<p${style('p')}>${inline(para.join(' '))}</p>`);
  }

  return out.join('\n');
}

/** Markdown → readable plain text. Links become "label <url>". */
export function renderText(md, { width = 78, resolve = (href) => href } = {}) {
  const lines = String(md).replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let i = 0;

  const wrap = (text, indent = '') => {
    const words = text.split(/\s+/).filter(Boolean);
    const wrapped = [];
    let line = indent;
    for (const word of words) {
      if (line.trim() && line.length + 1 + word.length > width) {
        wrapped.push(line);
        line = indent + word;
      } else {
        line = line.trim() ? `${line} ${word}` : line + word;
      }
    }
    if (line.trim()) wrapped.push(line);
    return wrapped;
  };

  const flatten = (s) =>
    String(s)
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => `${label} <${resolve(href)}>`)
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1$2')
      .replace(/(^|[\s(])_([^_\n]+)_/g, '$1$2');

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      if (out.length && out[out.length - 1] !== '') out.push('');
      i++;
      continue;
    }

    if (/^```/.test(line)) {
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) out.push('    ' + lines[i++]);
      if (i < lines.length) i++;
      out.push('');
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      const title = flatten(heading[2].trim());
      out.push(title.toUpperCase());
      out.push((heading[1].length === 1 ? '='.repeat(Math.min(title.length, width)) : '-'.repeat(Math.min(title.length, width))));
      out.push('');
      i++;
      continue;
    }

    if (/^\s*([-*_])\s*\1\s*\1[\s\-*_]*$/.test(line)) {
      out.push('-'.repeat(Math.min(40, width)), '');
      i++;
      continue;
    }

    if (/^>\s?/.test(line)) {
      out.push(...wrap(flatten(line.replace(/^>\s?/, '')), '  | '));
      i++;
      continue;
    }

    const listItem = line.match(/^\s*(?:[-*+]|\d+[.)])\s+(.*)$/);
    if (listItem) {
      const [first, ...rest] = wrap(flatten(listItem[1]), '');
      out.push(`  - ${first ?? ''}`);
      for (const r of rest) out.push(`    ${r.trim()}`);
      i++;
      continue;
    }

    const para = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,4}\s|>\s?|```)/.test(lines[i]) &&
      !/^\s*(?:[-*+]|\d+[.)])\s+/.test(lines[i])
    ) {
      para.push(lines[i++]);
    }
    out.push(...wrap(flatten(para.join(' '))), '');
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
