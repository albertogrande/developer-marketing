import test from 'node:test';
import assert from 'node:assert/strict';
import { renderHtml, renderInline, renderText } from '../lib/markdown.mjs';

test('inline spans render', () => {
  assert.equal(renderInline('**bold** and *em* and `code`'), '<strong>bold</strong> and <em>em</em> and <code>code</code>');
  assert.equal(
    renderInline('see [the guide](https://example.com/g)'),
    'see <a href="https://example.com/g">the guide</a>'
  );
});

test('nothing formats inside a code span', () => {
  assert.equal(renderInline('`a **b** c`'), '<code>a **b** c</code>');
});

test('html in the source is escaped, not passed through', () => {
  assert.equal(
    renderInline('<script>alert(1)</script>'),
    '&lt;script&gt;alert(1)&lt;/script&gt;'
  );
  assert.match(renderHtml('a <img src=x onerror=alert(1)> b'), /&lt;img/);
});

test('a hostile href is neutralised', () => {
  for (const hostile of ['javascript:alert(1)', 'data:text/html;base64,PHNjcmlwdD4=', 'vbscript:x']) {
    const html = renderInline(`[x](${hostile})`);
    assert.match(html, /<a href="#">x<\/a>/);
    assert.ok(!/javascript:|data:|vbscript:/.test(html), html);
  }
  assert.match(renderInline('[x](mailto:a@b.co)'), /href="mailto:a@b\.co"/);
  assert.match(renderInline('[x](https://a.co/b)'), /href="https:\/\/a\.co\/b"/);
});

test('blocks render', () => {
  const html = renderHtml(`# Title

A paragraph with a [link](https://example.com).

## Section

- one
- two

1. first
2. second

> a quote

---

\`\`\`
code block
\`\`\``);

  assert.match(html, /<h1>Title<\/h1>/);
  assert.match(html, /<h2>Section<\/h2>/);
  assert.match(html, /<ul><li>one<\/li><li>two<\/li><\/ul>/);
  assert.match(html, /<ol><li>first<\/li><li>second<\/li><\/ol>/);
  assert.match(html, /<blockquote>a quote<\/blockquote>/);
  assert.match(html, /<hr>/);
  assert.match(html, /<pre><code>code block<\/code><\/pre>/);
});

test('paragraph lines are joined, blank lines separate', () => {
  const html = renderHtml('one\ntwo\n\nthree');
  assert.equal(html, '<p>one two</p>\n<p>three</p>');
});

test('inline styles are applied where given', () => {
  const html = renderHtml('# T\n\ntext', { styles: { h1: 'color:red', p: 'margin:0' } });
  assert.match(html, /<h1 style="color:red">T<\/h1>/);
  assert.match(html, /<p style="margin:0">text<\/p>/);
});

test('plain text keeps the links visible', () => {
  const text = renderText('Read [the dive](https://example.com/d) today.');
  assert.match(text, /Read the dive <https:\/\/example\.com\/d> today\./);
});

test('plain text underlines headings and wraps prose', () => {
  const text = renderText(`# Heading

${'word '.repeat(40)}

- a list item
`);
  const lines = text.split('\n');
  assert.equal(lines[0], 'HEADING');
  assert.match(lines[1], /^=+$/);
  for (const line of lines) assert.ok(line.length <= 78, `line of ${line.length}: ${line}`);
  assert.ok(text.includes('  - a list item'));
});

test('an em dash and other punctuation survive both renderers', () => {
  const md = 'A sentence — with an em dash, "quotes" and a 90% figure.';
  assert.match(renderHtml(md), /—/);
  assert.match(renderText(md), /—/);
});
