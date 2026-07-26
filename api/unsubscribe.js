// Signed unsubscribe link, and RFC 8058 one-click from the mail client.
//
// The logic lives in newsletter/server.mjs, which also runs as a standalone
// service; this file only binds it to a URL. See newsletter/lib/vercel.mjs.
import { handler } from '../newsletter/lib/vercel.mjs';

export default { fetch: handler('/unsubscribe') };
