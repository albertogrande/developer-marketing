// The two emails this list ever sends: a confirmation, and an issue.
//
// Every style is inline because Gmail strips <style> blocks, and the layout is
// one column of text because a newsletter that needs a grid is a landing page
// with delusions. No images, so nothing to block; no tracking pixel, so nothing
// to be ashamed of; no click-wrapped links, so a reader can see where a link
// goes before they tap it.

import { renderHtml, renderText, resolveAgainst } from './markdown.mjs';

const C = {
  bg: '#fbfaf8',
  panel: '#ffffff',
  fg: '#1a1a1a',
  muted: '#6b6b66',
  faint: '#908d84',
  rule: '#e3e1d9',
  accent: '#b45309',
};

const SERIF = "Charter, 'Bitstream Charter', Cambria, Georgia, serif";
const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

/** Inline CSS handed to the markdown renderer, tag by tag. */
export const EMAIL_STYLES = {
  p: `margin:0 0 16px;font-family:${SERIF};font-size:16px;line-height:1.62;color:${C.fg};`,
  h1: `margin:28px 0 12px;font-family:${SERIF};font-size:24px;line-height:1.2;color:${C.fg};`,
  h2: `margin:28px 0 10px;font-family:${SERIF};font-size:20px;line-height:1.25;color:${C.fg};`,
  h3: `margin:24px 0 8px;font-family:${SERIF};font-size:17px;line-height:1.3;color:${C.fg};`,
  h4: `margin:20px 0 8px;font-family:${MONO};font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:${C.muted};`,
  ul: `margin:0 0 16px;padding-left:22px;`,
  ol: `margin:0 0 16px;padding-left:22px;`,
  li: `margin:0 0 8px;font-family:${SERIF};font-size:16px;line-height:1.6;color:${C.fg};`,
  a: `color:${C.accent};text-decoration:underline;`,
  blockquote: `margin:0 0 16px;padding:2px 0 2px 14px;border-left:2px solid ${C.accent};font-family:${SERIF};font-size:16px;line-height:1.6;color:${C.muted};`,
  pre: `margin:0 0 16px;padding:12px 14px;background:${C.bg};border:1px solid ${C.rule};border-radius:4px;font-family:${MONO};font-size:13px;line-height:1.5;overflow-x:auto;`,
  hr: `border:0;border-top:1px solid ${C.rule};margin:26px 0;`,
};

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * The page furniture around a message body.
 * @param {{title: string, preheader?: string, kicker?: string, bodyHtml: string, footerHtml: string}} parts
 */
export function shell({ title, preheader = '', kicker = '', bodyHtml, footerHtml }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:${C.bg};">
${
  preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>`
    : ''
}
<div style="max-width:640px;margin:0 auto;padding:28px 20px 40px;">
  <div style="font-family:${MONO};font-size:13px;color:${C.muted};padding-bottom:14px;border-bottom:1px solid ${C.rule};">
    <span style="color:${C.accent};">$</span> dev marketing${kicker ? ` <span style="color:${C.faint};">·</span> ${esc(kicker)}` : ''}
  </div>
  <div style="padding-top:22px;">
${bodyHtml}
  </div>
  <div style="margin-top:34px;padding-top:14px;border-top:1px solid ${C.rule};font-family:${MONO};font-size:12px;line-height:1.7;color:${C.faint};">
${footerHtml}
  </div>
</div>
</body>
</html>`;
}

/**
 * Double opt-in. Deliberately boring: one sentence, one link, and the plain
 * statement that ignoring it ends the matter.
 */
export function confirmEmail({ siteUrl, confirmUrl, listName = 'The Week' }) {
  const bodyHtml = `
    <h1 style="${EMAIL_STYLES.h1}">Confirm your subscription</h1>
    <p style="${EMAIL_STYLES.p}">Someone — hopefully you — asked for <b>${esc(listName)}</b>, the weekly
      developer-marketing digest from <a href="${esc(siteUrl)}" style="${EMAIL_STYLES.a}">${esc(
        siteUrl.replace(/^https?:\/\//, '')
      )}</a>. Confirm and the first issue arrives on Monday.</p>
    <p style="margin:0 0 20px;">
      <a href="${esc(confirmUrl)}" style="display:inline-block;padding:10px 18px;background:${C.fg};color:#fff;
         font-family:${MONO};font-size:14px;text-decoration:none;border-radius:4px;">Confirm subscription</a>
    </p>
    <p style="${EMAIL_STYLES.p}">If the button does not work, paste this into your browser:<br>
      <span style="font-family:${MONO};font-size:12px;color:${C.muted};word-break:break-all;">${esc(confirmUrl)}</span></p>
    <p style="${EMAIL_STYLES.p}"><b>Not you?</b> Ignore this email. Nothing further will be sent and the
      unconfirmed address is deleted — there is no list to be on until you click.</p>`;

  const footerHtml = `One email a week, nothing else. No tracking pixels, no click tracking.<br>
    The list is self-hosted: <a href="${esc(siteUrl)}/newsletter" style="color:${C.faint};">how it works</a>.`;

  const text = `Confirm your subscription
========================

Someone - hopefully you - asked for ${listName}, the weekly developer-marketing
digest from ${siteUrl}.

Confirm here:
${confirmUrl}

Not you? Ignore this email. Nothing further will be sent, and an address that is
never confirmed is deleted.

--
One email a week. No tracking pixels, no click tracking.
${siteUrl}/newsletter`;

  return {
    subject: `Confirm your subscription to ${listName}`,
    html: shell({ title: 'Confirm your subscription', kicker: 'confirm', bodyHtml, footerHtml }),
    text,
  };
}

/**
 * One issue. The body is the published digest, rendered for mail — not a teaser
 * that makes the reader click through to be counted.
 *
 * @param {object} args
 * @param {{week: string, title: string, summary: string, body: string, sources?: {label:string,url:string}[]}} args.issue
 * @param {string} args.siteUrl
 * @param {string} args.webUrl           canonical URL of this issue
 * @param {string} args.unsubscribeUrl   signed, per-recipient
 * @param {string} [args.listName]
 */
export function issueEmail({ issue, siteUrl, webUrl, unsubscribeUrl, listName = 'The Week' }) {
  // The digest links to guide sections as "/developer-marketing/guide/…". Those
  // resolve on the site and nowhere else, so they are absolutised here — against
  // the origin, since the path already carries the site's base.
  const resolve = resolveAgainst(new URL(siteUrl).origin);

  const bodyHtml = `
    <h1 style="${EMAIL_STYLES.h1}">${esc(issue.title)}</h1>
    <p style="margin:0 0 22px;font-family:${SERIF};font-size:17px;line-height:1.5;color:${C.muted};">${esc(
      issue.summary
    )}</p>
${renderHtml(issue.body, { styles: EMAIL_STYLES, resolve })}
${
  issue.sources?.length
    ? `<h4 style="${EMAIL_STYLES.h4}">Sources — check it yourself</h4><ol style="${EMAIL_STYLES.ol}">` +
      issue.sources
        .map(
          (s) =>
            `<li style="${EMAIL_STYLES.li}"><a href="${esc(s.url)}" style="${EMAIL_STYLES.a}">${esc(
              s.label
            )}</a></li>`
        )
        .join('') +
      '</ol>'
    : ''
}
    <p style="margin:26px 0 0;font-family:${MONO};font-size:13px;">
      <a href="${esc(webUrl)}" style="${EMAIL_STYLES.a}">read this issue on the web →</a>
    </p>`;

  const footerHtml = `${esc(listName)} · ${esc(issue.week)} · one email a week from
    <a href="${esc(siteUrl)}" style="color:${C.faint};">${esc(siteUrl.replace(/^https?:\/\//, ''))}</a><br>
    No tracking pixels and no click tracking: we cannot tell whether you opened this.<br>
    <a href="${esc(unsubscribeUrl)}" style="color:${C.faint};text-decoration:underline;">Unsubscribe</a> —
    one click, no questions asked.`;

  const text = `${issue.title}
${'='.repeat(Math.min(issue.title.length, 78))}

${issue.summary}

${renderText(issue.body, { resolve })}
${
  issue.sources?.length
    ? `\nSOURCES - CHECK IT YOURSELF\n${issue.sources.map((s, i) => `  ${i + 1}. ${s.label}\n     ${s.url}`).join('\n')}\n`
    : ''
}
Read on the web: ${webUrl}

--
${listName} · ${issue.week} · ${siteUrl}
No tracking pixels, no click tracking.
Unsubscribe: ${unsubscribeUrl}`;

  return {
    subject: `${listName}: ${issue.title}`,
    html: shell({
      title: issue.title,
      preheader: issue.summary,
      kicker: issue.week,
      bodyHtml,
      footerHtml,
    }),
    text,
  };
}
