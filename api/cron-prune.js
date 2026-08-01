// Daily prune of unconfirmed addresses past the confirmation window — the
// serverless half of the privacy page's "an unconfirmed address is dropped,
// not kept warm". Scheduled by vercel.json; Vercel authenticates the call
// with `Authorization: Bearer $CRON_SECRET`, which the route verifies.
//
// The logic lives in newsletter/server.mjs (/admin/prune); this file only
// binds it to a URL. See newsletter/lib/vercel.mjs.
import { handler } from '../newsletter/lib/vercel.mjs';

export default { fetch: handler('/admin/prune') };
