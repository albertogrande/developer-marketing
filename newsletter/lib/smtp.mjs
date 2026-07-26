// A small SMTP client: connect, EHLO, STARTTLS, AUTH, MAIL/RCPT/DATA, QUIT.
//
// The relay is a dumb pipe — the list, the templates and the sending logic are
// ours — so the client only has to speak enough of RFC 5321 to hand a finished
// message to a submission server on port 587 or 465. It keeps one connection
// open across many recipients, which is what a mail server wants and what makes
// a 2,000-message send take minutes instead of an afternoon.
//
// Deliberately unsupported: pipelining, CHUNKING, XOAUTH2, connection pooling.
// Add them when a real send is actually too slow, not before.

import net from 'node:net';
import tls from 'node:tls';
import { createHmac } from 'node:crypto';

const CRLF = '\r\n';

export class SmtpError extends Error {
  constructor(message, { code = 0, command = '', response = '' } = {}) {
    super(message);
    this.name = 'SmtpError';
    this.code = code;
    this.command = command;
    this.response = response;
    // 4xx is "try again later", 5xx is "this will never work".
    this.permanent = code >= 500 && code < 600;
  }
}

export class SmtpClient {
  /**
   * @param {object} opts
   * @param {string} opts.host
   * @param {number} opts.port
   * @param {boolean} [opts.secure]              implicit TLS (port 465)
   * @param {string} [opts.user]
   * @param {string} [opts.pass]
   * @param {boolean} [opts.rejectUnauthorized]
   * @param {number} [opts.timeoutMs]
   * @param {string} [opts.name]                 what we announce in EHLO
   * @param {(line: string) => void} [opts.log]
   */
  constructor(opts) {
    this.opts = { secure: false, rejectUnauthorized: true, timeoutMs: 20_000, name: 'localhost', ...opts };
    this.socket = null;
    this.buffer = '';
    this.pending = null; // { resolve, reject, command }
    this.capabilities = new Set();
    this.closed = false;
  }

  #debug(direction, text) {
    if (!this.opts.log) return;
    for (const line of text.split(CRLF)) {
      if (line) this.opts.log(`${direction} ${line}`);
    }
  }

  #attach(socket) {
    this.socket = socket;
    // No setEncoding: a plain socket in string mode cannot be handed to
    // tls.connect() for the STARTTLS upgrade. SMTP replies are ASCII, so
    // decoding each chunk here is safe.
    socket.setTimeout(this.opts.timeoutMs);
    socket.on('data', (chunk) => this.#onData(chunk.toString('utf8')));
    socket.on('timeout', () => this.#fail(new SmtpError('smtp: socket timeout')));
    socket.on('error', (err) => this.#fail(new SmtpError(`smtp: ${err.message}`)));
    socket.on('close', () => {
      if (!this.closed) this.#fail(new SmtpError('smtp: connection closed by server'));
    });
  }

  #fail(err) {
    this.closed = true;
    const pending = this.pending;
    this.pending = null;
    if (pending) pending.reject(err);
  }

  // A reply is one or more lines; every line but the last has a '-' after the
  // status code: "250-PIPELINING" … "250 STARTTLS".
  #onData(chunk) {
    this.buffer += chunk;
    for (;;) {
      const end = this.buffer.indexOf(CRLF);
      if (end === -1) return;
      const line = this.buffer.slice(0, end);
      const rest = this.buffer.slice(end + 2);
      if (/^\d{3}-/.test(line)) {
        // Continuation: hold it and wait for the terminating line.
        this.buffer = rest;
        this.#lines = (this.#lines || []).concat(line);
        continue;
      }
      this.buffer = rest;
      const lines = (this.#lines || []).concat(line);
      this.#lines = null;
      const text = lines.join(CRLF);
      this.#debug('<', text);
      const code = Number(line.slice(0, 3));
      const pending = this.pending;
      this.pending = null;
      if (!pending) continue; // unsolicited (a greeting we are not waiting on)
      if (code >= 400) {
        pending.reject(
          new SmtpError(`smtp: ${pending.command || 'server'} rejected (${code})`, {
            code,
            command: pending.command,
            response: text,
          })
        );
      } else {
        pending.resolve({ code, text, lines });
      }
    }
  }

  #lines = null;

  #expect(command) {
    if (this.pending) return Promise.reject(new SmtpError('smtp: overlapping commands'));
    return new Promise((resolve, reject) => {
      this.pending = { resolve, reject, command };
    });
  }

  async #send(command, { secret = false } = {}) {
    if (!this.socket) throw new SmtpError('smtp: not connected');
    const waiter = this.#expect(command.split(' ')[0]);
    this.#debug('>', secret ? '<credentials>' : command);
    this.socket.write(command + CRLF);
    return waiter;
  }

  async connect() {
    const { host, port, secure, rejectUnauthorized, timeoutMs } = this.opts;
    const greeting = this.#expect('greeting');
    // The socket can fail before anyone awaits the greeting; mark it handled so
    // a connect error surfaces as a connect error, not an unhandled rejection.
    greeting.catch(() => {});
    const socket = secure
      ? tls.connect({ host, port, servername: host, rejectUnauthorized })
      : net.connect({ host, port });
    socket.setTimeout(timeoutMs);
    this.#attach(socket);
    await new Promise((resolve, reject) => {
      const onReady = () => resolve();
      socket.once(secure ? 'secureConnect' : 'connect', onReady);
      socket.once('error', reject);
    });
    await greeting;
    await this.#ehlo();

    if (!secure && this.capabilities.has('STARTTLS')) {
      await this.#send('STARTTLS');
      await this.#upgrade();
      await this.#ehlo();
    } else if (!secure && this.opts.user) {
      throw new SmtpError('smtp: server does not offer STARTTLS — refusing to send credentials in the clear');
    }

    if (this.opts.user) await this.#authenticate();
    return this;
  }

  async #ehlo() {
    const reply = await this.#send(`EHLO ${this.opts.name}`);
    this.capabilities = new Set(
      reply.lines
        .slice(1)
        .map((l) => l.slice(4).trim().toUpperCase())
        .filter(Boolean)
    );
    // "AUTH PLAIN LOGIN" is one capability line; index the mechanisms too.
    for (const cap of [...this.capabilities]) {
      if (cap.startsWith('AUTH ')) for (const m of cap.slice(5).split(/\s+/)) this.capabilities.add(`AUTH=${m}`);
    }
    return reply;
  }

  async #upgrade() {
    const plain = this.socket;
    plain.removeAllListeners('data');
    plain.removeAllListeners('error');
    plain.removeAllListeners('close');
    plain.removeAllListeners('timeout');
    const secured = tls.connect({
      socket: plain,
      servername: this.opts.host,
      rejectUnauthorized: this.opts.rejectUnauthorized,
    });
    await new Promise((resolve, reject) => {
      secured.once('secureConnect', resolve);
      secured.once('error', reject);
    });
    this.buffer = '';
    this.#attach(secured);
  }

  async #authenticate() {
    const { user, pass } = this.opts;
    const b64 = (s) => Buffer.from(s, 'utf8').toString('base64');

    if (this.capabilities.has('AUTH=PLAIN') || !this.capabilities.has('AUTH=LOGIN')) {
      await this.#send(`AUTH PLAIN ${b64(`\0${user}\0${pass}`)}`, { secret: true });
      return;
    }
    await this.#send('AUTH LOGIN');
    await this.#send(b64(user), { secret: true });
    await this.#send(b64(pass), { secret: true });
  }

  /**
   * Hand one message to the relay.
   * @param {object} envelope
   * @param {string} envelope.from     envelope sender (bounces come back here)
   * @param {string} envelope.to
   * @param {string} envelope.raw      complete RFC 5322 message
   */
  async send({ from, to, raw }) {
    await this.#send(`MAIL FROM:<${from}>`);
    await this.#send(`RCPT TO:<${to}>`);
    await this.#send('DATA');
    const body = dotStuff(raw.endsWith(CRLF) ? raw : raw + CRLF);
    const waiter = this.#expect('DATA-payload');
    this.#debug('>', `<message: ${Buffer.byteLength(body)} bytes>`);
    this.socket.write(body + '.' + CRLF);
    return waiter;
  }

  /** RSET between recipients when one is rejected, so the session survives. */
  async reset() {
    await this.#send('RSET');
  }

  async quit() {
    if (!this.socket || this.closed) return;
    try {
      await this.#send('QUIT');
    } catch {
      // A relay that hangs up on QUIT has still done its job.
    } finally {
      this.closed = true;
      this.socket.end();
      this.socket.destroy();
    }
  }
}

/** RFC 5321 §4.5.2: a line of a single "." would end the message early. */
export function dotStuff(message) {
  return message.replace(/^\./gm, '..');
}

/** CRAM-MD5, kept for relays that still insist on it. Unused by default. */
export function cramMd5(user, pass, challengeB64) {
  const challenge = Buffer.from(challengeB64, 'base64').toString('utf8');
  const digest = createHmac('md5', pass).update(challenge).digest('hex');
  return Buffer.from(`${user} ${digest}`, 'utf8').toString('base64');
}

/** One-shot convenience wrapper: connect, send a single message, quit. */
export async function sendMail(smtp, envelope) {
  const client = new SmtpClient(smtp);
  await client.connect();
  try {
    return await client.send(envelope);
  } finally {
    await client.quit();
  }
}
