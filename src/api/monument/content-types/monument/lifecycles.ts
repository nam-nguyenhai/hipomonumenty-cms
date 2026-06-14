/**
 * Triggers a Vercel rebuild whenever a published monument changes, so the cached /
 * ISR frontend picks up edits immediately instead of waiting out the cache TTL.
 *
 * Setup:
 *   1. Vercel → Project → Settings → Git → Deploy Hooks → create a hook for `main`.
 *   2. Strapi Cloud → Settings → Variables → set VERCEL_DEPLOY_HOOK_URL to that URL.
 *
 * Behaviour:
 *   - Fires on publish / republish (afterCreate/afterUpdate where publishedAt is set)
 *     and on delete. Plain draft saves (publishedAt = null) do NOT trigger a rebuild.
 *   - Debounced: bursts of edits within DEBOUNCE_MS collapse into a single rebuild.
 */
import process from 'node:process';

const DEBOUNCE_MS = 60_000;
let timer: NodeJS.Timeout | null = null;

function scheduleDeploy(reason: string) {
  const url = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!url) {
    strapi.log.warn('[deploy-hook] VERCEL_DEPLOY_HOOK_URL not set — skipping rebuild trigger');
    return;
  }

  if (timer) clearTimeout(timer);
  timer = setTimeout(async () => {
    timer = null;
    try {
      const res = await fetch(url, { method: 'POST' });
      strapi.log.info(`[deploy-hook] triggered Vercel rebuild (${reason}) → HTTP ${res.status}`);
    }
    catch (err) {
      strapi.log.error(`[deploy-hook] rebuild trigger failed: ${(err as Error).message}`);
    }
  }, DEBOUNCE_MS);
}

export default {
  afterCreate(event: { result?: { publishedAt?: string | null } }) {
    if (event.result?.publishedAt) scheduleDeploy('create');
  },
  afterUpdate(event: { result?: { publishedAt?: string | null } }) {
    if (event.result?.publishedAt) scheduleDeploy('update');
  },
  afterDelete() {
    scheduleDeploy('delete');
  },
};
