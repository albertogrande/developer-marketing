// Optional egress proxy for the fetch-heavy tools. Reddit and several
// watchlist feeds (Search Engine Land, the Substacks, Latent Space) 403
// GitHub's runner IPs while answering the identical request through a proxy —
// an IP-reputation block, not a broken URL (BACKLOG.md has the verification).
//
// Deliberately keyed to SCOUT_PROXY_URL rather than HTTPS_PROXY: local and
// sandboxed runs often carry a general-purpose proxy in the standard
// variables, and the sweep must not silently change transport because of one.
// No secret set → no-op, so the wiring can ship ahead of the decision.
//
// The undici import is lazy for the same reason pg's is in the newsletter:
// the dependency is only touched on the path that needs it.
export async function useScoutProxy() {
  const url = process.env.SCOUT_PROXY_URL;
  if (!url) return false;
  const { setGlobalDispatcher, ProxyAgent } = await import('undici');
  // npm undici and Node's built-in fetch share the dispatcher slot via
  // Symbol.for, so this reroutes every global fetch in the process.
  setGlobalDispatcher(new ProxyAgent(url));
  return true;
}
