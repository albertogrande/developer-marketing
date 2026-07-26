import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { SmtpClient, sendMail } from '../lib/smtp.mjs';

/**
 * A fake submission server. Records every command it is given and replies from
 * a script, so the client can be tested end to end without a real relay.
 */
function fakeSmtp({ ehlo = ['250-fake ESMTP', '250-PIPELINING', '250 SIZE 10240000'], reject } = {}) {
  const seen = { commands: [], data: '' };
  const server = net.createServer((socket) => {
    let buffer = '';
    let inData = false;
    socket.write('220 fake ESMTP ready\r\n');

    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');

      if (inData) {
        const end = buffer.indexOf('\r\n.\r\n');
        if (end === -1) return;
        seen.data = buffer.slice(0, end + 2);
        buffer = buffer.slice(end + 5);
        inData = false;
        socket.write('250 2.0.0 queued as ABC123\r\n');
      }

      for (;;) {
        const nl = buffer.indexOf('\r\n');
        if (nl === -1 || inData) return;
        const line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 2);
        seen.commands.push(line);
        const verb = line.split(' ')[0].toUpperCase();

        if (verb === 'EHLO') socket.write(ehlo.join('\r\n') + '\r\n');
        else if (verb === 'AUTH') socket.write('235 2.7.0 authenticated\r\n');
        else if (verb === 'MAIL') socket.write('250 2.1.0 sender ok\r\n');
        else if (verb === 'RCPT') {
          if (reject && line.includes(reject.recipient)) socket.write(`${reject.code} ${reject.message}\r\n`);
          else socket.write('250 2.1.5 recipient ok\r\n');
        } else if (verb === 'DATA') {
          socket.write('354 end with <CRLF>.<CRLF>\r\n');
          inData = true;
        } else if (verb === 'RSET') socket.write('250 2.0.0 reset\r\n');
        else if (verb === 'QUIT') {
          socket.write('221 2.0.0 bye\r\n');
          socket.end();
          return;
        } else socket.write('502 5.5.2 not implemented\r\n');
      }
    });
    socket.on('error', () => {});
  });
  return { server, seen };
}

const listen = (server) =>
  new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server.address().port)));

/**
 * Run a test against a fake relay and always tear it down. Without the finally,
 * one failing assertion leaves a listening server and an open socket behind, and
 * the whole test process hangs instead of reporting the failure.
 */
async function withRelay(options, fn) {
  const { server, seen } = fakeSmtp(options);
  const port = await listen(server);
  const clients = [];
  const connect = async (opts = {}) => {
    const client = new SmtpClient({ host: '127.0.0.1', port, name: 'test.local', timeoutMs: 4000, ...opts });
    clients.push(client);
    await client.connect();
    return client;
  };
  try {
    return await fn({ port, seen, connect });
  } finally {
    for (const client of clients) await client.quit().catch(() => {});
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  }
}

test('a message is delivered through the full SMTP conversation', async () => {
  const seen = await withRelay({}, async ({ port, seen }) => {
    await sendMail(
      { host: '127.0.0.1', port, name: 'test.local', timeoutMs: 4000 },
      { from: 'week@example.com', to: 'reader@example.org', raw: 'Subject: hi\r\n\r\nbody\r\n' }
    );
    return seen;
  });

  assert.deepEqual(
    seen.commands.filter((c) => !/^(AUTH|RSET)/.test(c)),
    ['EHLO test.local', 'MAIL FROM:<week@example.com>', 'RCPT TO:<reader@example.org>', 'DATA', 'QUIT']
  );
  assert.equal(seen.data, 'Subject: hi\r\n\r\nbody\r\n');
});

test('multiline EHLO replies are parsed into capabilities', async () => {
  // No STARTTLS advertised, so the client stays on the plain connection.
  await withRelay({ ehlo: ['250-fake', '250-AUTH PLAIN LOGIN', '250 8BITMIME'] }, async ({ connect }) => {
    const client = await connect();
    assert.ok(client.capabilities.has('8BITMIME'));
    assert.ok(client.capabilities.has('AUTH=PLAIN'), 'AUTH mechanisms are indexed individually');
    assert.ok(client.capabilities.has('AUTH=LOGIN'));
  });
});

test('credentials are never sent to a server without STARTTLS', async () => {
  await withRelay({ ehlo: ['250-fake', '250 AUTH PLAIN LOGIN'] }, async ({ connect }) => {
    await assert.rejects(
      () => connect({ user: 'me', pass: 'secret' }),
      /refusing to send credentials in the clear/
    );
  });
});

test('an advertised STARTTLS is always taken, never silently skipped', async () => {
  // The fake relay advertises STARTTLS but cannot actually do TLS, so the
  // upgrade fails — and the client must fail with it rather than carry on in
  // the clear.
  await withRelay({ ehlo: ['250-fake', '250 STARTTLS'] }, async ({ connect }) => {
    await assert.rejects(() => connect(), /STARTTLS|smtp:/);
  });
});

test('a lone dot in the body is stuffed, so the message is not truncated', async () => {
  const seen = await withRelay({}, async ({ port, seen }) => {
    await sendMail(
      { host: '127.0.0.1', port, name: 'test.local', timeoutMs: 4000 },
      { from: 'a@b.co', to: 'c@d.co', raw: 'Subject: s\r\n\r\nbefore\r\n.\r\nafter\r\n' }
    );
    return seen;
  });

  assert.ok(seen.data.includes('\r\n..\r\n'), 'the dot line is doubled on the wire');
  assert.ok(seen.data.includes('after'), 'the message did not end early');
});

test('a rejected recipient raises a permanent error the sender can classify', async () => {
  await withRelay(
    { reject: { recipient: 'blocked@', code: '550', message: '5.1.1 no such user' } },
    async ({ connect }) => {
      const client = await connect();
      await assert.rejects(
        () => client.send({ from: 'a@b.co', to: 'blocked@example.com', raw: 'Subject: s\r\n\r\nx\r\n' }),
        (err) => {
          assert.equal(err.name, 'SmtpError');
          assert.equal(err.code, 550);
          assert.equal(err.permanent, true);
          return true;
        }
      );

      // The session survives: RSET, and the next recipient still goes through.
      await client.reset();
      await client.send({ from: 'a@b.co', to: 'ok@example.com', raw: 'Subject: s\r\n\r\nx\r\n' });
    }
  );
});

test('a temporary rejection is not marked permanent', async () => {
  await withRelay(
    { reject: { recipient: 'busy@', code: '451', message: '4.3.0 try later' } },
    async ({ connect }) => {
      const client = await connect();
      await assert.rejects(
        () => client.send({ from: 'a@b.co', to: 'busy@example.com', raw: 'Subject: s\r\n\r\nx\r\n' }),
        (err) => err.code === 451 && err.permanent === false
      );
    }
  );
});

test('a connection refused surfaces as an error, not a hang', async () => {
  // Port 1 on loopback: nothing listens there.
  await assert.rejects(
    () => sendMail({ host: '127.0.0.1', port: 1, timeoutMs: 2000 }, { from: 'a@b.co', to: 'c@d.co', raw: 'x' }),
    /ECONNREFUSED|smtp:/
  );
});
