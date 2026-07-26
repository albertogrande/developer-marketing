// The transport seam: which pipe gets picked, and what each one puts on the
// wire. The Resend transport is tested against a stub fetch — a unit test of the
// request we send, not of their API.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createTransport, isTemporary, MailError } from '../lib/transport.mjs';

const baseConfig = (over = {}) => ({
  transport: 'dry-run',
  siteUrl: 'https://example.test/developer-marketing',
  dataDir: mkdtempSync(join(tmpdir(), 'nl-tr-')),
  fromEmail: 'week@example.test',
  fromName: 'The Week',
  replyTo: '',
  listId: 'the-week.example.test',
  smtp: { host: '', port: 587, user: '', pass: '', secure: false, rejectUnauthorized: true, timeoutMs: 5000 },
  resend: { apiKey: '', baseUrl: 'https://api.resend.example' },
  ...over,
});

const MESSAGE = {
  to: 'reader@example.org',
  subject: 'The Week: something moved',
  text: 'plain body',
  html: '<p>html body</p>',
  headers: {
    'List-Unsubscribe': '<https://list.example.test/unsubscribe?t=abc>',
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    'X-Idempotency-Key': '2026-W30:sub-1',
  },
};

test('the transport is inferred from what is configured', () => {
  assert.equal(createTransport(baseConfig()).name, 'dry-run');
  assert.equal(createTransport(baseConfig({ transport: 'smtp', smtp: { ...baseConfig().smtp, host: 'smtp.x' } })).name, 'smtp');
  assert.equal(
    createTransport(baseConfig({ transport: 'resend', resend: { apiKey: 're_x', baseUrl: 'https://api.resend.example' } })).name,
    'resend'
  );
});

test('a transport with missing credentials fails loudly, not silently', () => {
  assert.throws(() => createTransport(baseConfig({ transport: 'resend' })), /RESEND_API_KEY/);
  assert.throws(() => createTransport(baseConfig({ transport: 'smtp' })), /SMTP_HOST/);
  assert.throws(() => createTransport(baseConfig({ transport: 'carrier-pigeon' })), /unknown MAIL_TRANSPORT/);
});

test('dry run writes a complete message to the outbox', async () => {
  const config = baseConfig();
  const transport = createTransport(config);
  const result = await transport.send(MESSAGE);
  assert.equal(result.transport, 'dry-run');

  const files = readdirSync(join(config.dataDir, 'outbox'));
  assert.equal(files.length, 1);
  const eml = readFileSync(join(config.dataDir, 'outbox', files[0]), 'utf8');
  assert.match(eml, /^From: The Week <week@example\.test>/m);
  assert.match(eml, /^List-Unsubscribe-Post: List-Unsubscribe=One-Click$/m);
  assert.match(eml, /multipart\/alternative/);
});

test('resend gets the fields, the headers and the bearer token', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return { ok: true, status: 200, json: async () => ({ id: 'msg_123' }) };
  };
  const config = baseConfig({
    transport: 'resend',
    replyTo: 'hello@example.test',
    resend: { apiKey: 're_test_key', baseUrl: 'https://api.resend.example' },
  });

  const result = await createTransport(config, () => {}, { fetchImpl }).send(MESSAGE);
  assert.equal(result.id, 'msg_123');
  assert.equal(calls.length, 1);

  const [{ url, init }] = calls;
  assert.equal(url, 'https://api.resend.example/emails');
  assert.equal(init.method, 'POST');
  assert.equal(init.headers.authorization, 'Bearer re_test_key');
  // One issue to one address is one send, however many times the job re-runs.
  assert.equal(init.headers['Idempotency-Key'], '2026-W30:sub-1');

  const body = JSON.parse(init.body);
  assert.equal(body.from, 'The Week <week@example.test>');
  assert.deepEqual(body.to, ['reader@example.org']);
  assert.equal(body.subject, MESSAGE.subject);
  assert.equal(body.text, MESSAGE.text);
  assert.equal(body.html, MESSAGE.html);
  assert.equal(body.reply_to, 'hello@example.test');
  // The unsubscribe headers must survive the API, or one-click stops working.
  assert.equal(body.headers['List-Unsubscribe'], MESSAGE.headers['List-Unsubscribe']);
  assert.equal(body.headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click');
});

test('a plain-text-only message stays plain text through the API', async () => {
  let body;
  const fetchImpl = async (_url, init) => {
    body = JSON.parse(init.body);
    return { ok: true, status: 200, json: async () => ({ id: 'x' }) };
  };
  const config = baseConfig({ transport: 'resend', resend: { apiKey: 're_x', baseUrl: 'https://api.resend.example' } });
  await createTransport(config, () => {}, { fetchImpl }).send({ ...MESSAGE, html: undefined });
  assert.equal('html' in body, false);
  assert.equal(body.text, 'plain body');
});

test('resend failures are classified so the sender knows whether to retry', async () => {
  const config = baseConfig({ transport: 'resend', resend: { apiKey: 're_x', baseUrl: 'https://api.resend.example' } });
  const attempt = (status, payload = {}) =>
    createTransport(config, () => {}, {
      fetchImpl: async () => ({ ok: false, status, statusText: 'err', json: async () => payload }),
    }).send(MESSAGE);

  // Rate limited or their fault → try again.
  for (const status of [429, 500, 502, 503]) {
    await assert.rejects(() => attempt(status), (err) => {
      assert.equal(err.name, 'MailError');
      assert.equal(err.permanent, false, `${status} should be temporary`);
      assert.equal(isTemporary(err), true);
      return true;
    });
  }
  // Our fault → never retry, drop the recipient and log it.
  for (const status of [401, 403, 422]) {
    await assert.rejects(() => attempt(status, { message: 'nope' }), (err) => {
      assert.equal(err.permanent, true, `${status} should be permanent`);
      return true;
    });
  }
});

test('a network fault is temporary, not a dropped subscriber', async () => {
  const config = baseConfig({ transport: 'resend', resend: { apiKey: 're_x', baseUrl: 'https://api.resend.example' } });
  await assert.rejects(
    () =>
      createTransport(config, () => {}, {
        fetchImpl: async () => {
          throw new Error('ECONNRESET');
        },
      }).send(MESSAGE),
    (err) => err instanceof MailError && err.permanent === false
  );
});

test('a malformed success body still counts as sent', async () => {
  const config = baseConfig({ transport: 'resend', resend: { apiKey: 're_x', baseUrl: 'https://api.resend.example' } });
  const result = await createTransport(config, () => {}, {
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('not json');
      },
    }),
  }).send(MESSAGE);
  assert.equal(result.transport, 'resend');
  assert.equal(result.id, undefined);
});
