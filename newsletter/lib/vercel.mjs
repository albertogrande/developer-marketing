// Serverless front door. Runs the same routes as the standalone server, so
// there is one implementation and one set of tests behind both deployments.
//
// Vercel's convention for a project with no framework is a top-level api/
// directory whose files export `{ async fetch(request) }` — Web Request in, Web
// Response out. The routes in server.mjs are Node-style (`req`, `res`), which is
// what a long-lived HTTP server needs. This is the translation between them:
// enough of Node's http API for those handlers to run unmodified, and no more.
//
// Rewriting the routes in Request/Response style would delete this file, and one
// day that may be worth doing. Today it would mean rewriting the one part of the
// system that is already tested end to end, so the shim wins.

import { createContext, createRouter } from '../server.mjs';

/** Node's `req`, as far as the routes actually use it. */
function toNodeRequest(request, { body, pathname }) {
  const headers = Object.create(null);
  for (const [name, value] of request.headers) headers[name.toLowerCase()] = value;

  // Vercel routes /api/subscribe here; the routes know it as /subscribe.
  const url = new URL(request.url);
  const search = url.search || '';

  const listeners = new Map();
  return {
    method: request.method,
    url: pathname + search,
    headers,
    // Only used for rate limiting, and only when TRUST_PROXY is off — behind
    // Vercel the real address is in x-forwarded-for, which the routes read.
    socket: { remoteAddress: headers['x-forwarded-for']?.split(',')[0]?.trim() || '' },

    // readBody() consumes the request as a stream. The body has already been
    // read into memory by the platform, so replay it on the next tick.
    on(event, handler) {
      listeners.set(event, handler);
      if (event === 'end') {
        queueMicrotask(() => {
          if (body) listeners.get('data')?.(Buffer.from(body));
          listeners.get('end')?.();
        });
      }
      return this;
    },
    destroy() {},
  };
}

/** Node's `res`, collecting what the routes write into one Web Response. */
function createResponseCollector() {
  const headers = new Headers();
  let status = 200;
  let settled;
  const done = new Promise((resolve) => {
    settled = resolve;
  });

  const res = {
    headersSent: false,
    setHeader(name, value) {
      headers.set(name, String(value));
    },
    getHeader(name) {
      return headers.get(name);
    },
    writeHead(code, extra = {}) {
      status = code;
      for (const [name, value] of Object.entries(extra)) headers.set(name, String(value));
      res.headersSent = true;
      return res;
    },
    end(body = '') {
      res.headersSent = true;
      // 204 and 304 must not carry a body, and fetch() enforces it.
      const empty = status === 204 || status === 304;
      settled(new Response(empty ? null : body || null, { status, headers }));
      return res;
    },
  };

  return { res, done };
}

// The context is expensive to build (a store connection, a transport) and a warm
// function instance handles many requests, so it is created once per instance
// and reused. A cold start pays for it exactly once.
let contextPromise;
const getContext = () => (contextPromise ??= createContext());

/**
 * Wrap one route as a Vercel Function.
 *
 * @param {string} pathname the route as server.mjs knows it, e.g. "/subscribe"
 * @returns {(request: Request) => Promise<Response>}
 */
export function handler(pathname) {
  return async function fetchHandler(request) {
    let context;
    try {
      context = await getContext();
    } catch (err) {
      // A misconfigured deployment must not look like a working one: fail loudly
      // in the logs and tell the caller it was our fault, not theirs.
      contextPromise = undefined; // let the next invocation try again
      console.error(`newsletter: ${err.message}`);
      return Response.json({ ok: false, error: 'service is not configured' }, { status: 503 });
    }

    // The body has to be read here: the shim replays it, and a stream cannot be
    // replayed. GET and HEAD have none.
    const body = request.method === 'GET' || request.method === 'HEAD' ? '' : await request.text();

    const route = createRouter(context);
    const { res, done } = createResponseCollector();
    await route(toNodeRequest(request, { body, pathname }), res);
    // A handler that returned without responding would hang the function; the
    // routes always answer, but a 500 is better than a timeout if one ever does.
    if (!res.headersSent) res.end(JSON.stringify({ ok: false, error: 'no response' }));
    return done;
  };
}

// Exported for the tests, which drive the shim without a live platform.
export const __internals = { toNodeRequest, createResponseCollector };
