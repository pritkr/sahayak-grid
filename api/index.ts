import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { SCHEMES } from '../src/data/schemes.js';
import { buildAlerts } from '../src/lib/deadlines.js';

export type Env = {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  OTP_MODE?: string; // 'mock' default
};

const app = new Hono<{ Bindings: Env }>();
app.use('*', cors());

// In-memory demo store (real deploy: Supabase Postgres via REST). Exported for tests.
export const store = {
  profiles: new Map<string, Record<string, unknown>>(),
  consents: [] as Array<Record<string, unknown>>,
  queue: [] as Array<Record<string, unknown>>,
  otps: new Map<string, { code: string; exp: number }>(),
  seenOpIds: new Set<string>(), // idempotency keys for /sync replay
  alertsRead: [] as Array<Record<string, unknown>>,
  // v2 sync analytics (dev: in-memory; prod: sync_events table, see db/migration_v2.sql).
  stats: { syncAttempts: 0, synced: 0, duplicates: 0, failed: 0 },
};

export function resetStore(): void {
  store.profiles.clear();
  store.consents.length = 0;
  store.queue.length = 0;
  store.otps.clear();
  store.seenOpIds.clear();
  store.alertsRead.length = 0;
  store.stats.syncAttempts = 0;
  store.stats.synced = 0;
  store.stats.duplicates = 0;
  store.stats.failed = 0;
}

export function makeOtp(seed?: number): string {
  const n = seed !== undefined ? seed : Math.floor(100000 + Math.random() * 900000);
  return String(Math.abs(n) % 1000000).padStart(6, '0');
}

app.get('/health', (c) => c.json({ ok: true, service: 'sahayak-grid-api', time: new Date().toISOString() }));

// GET /schemes?q= — searchable seed mirror (PWA bundles the same data for offline use).
app.get('/schemes', (c) => {
  const q = (c.req.query('q') ?? '').toLowerCase().trim();
  if (!q) return c.json({ count: SCHEMES.length, schemes: SCHEMES });
  const hits = SCHEMES.filter((s) =>
    [s.name_hi, s.name_en, s.dept_hi, s.benefit_hi, ...s.tags_hi, ...s.tags_en, ...s.keywords]
      .join(' ').toLowerCase().includes(q),
  );
  return c.json({ count: hits.length, schemes: hits });
});

// POST /register { mobile, name, ...profile, consent?, client_uuid? }
// Direct (online) registration; offline clients queue this op and replay via /sync.
app.post('/register', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const mobile = String(body.mobile ?? '');
  if (!/^[6-9]\d{9}$/.test(mobile)) return c.json({ ok: false, error: 'invalid_mobile' }, 400);
  if (!body.name) return c.json({ ok: false, error: 'name_required' }, 400);
  const key = String(body.client_uuid ?? body.id ?? '');
  if (key && store.seenOpIds.has(`register:${mobile}:${key}`)) {
    return c.json({ ok: true, duplicate: true, mobile });
  }
  if (key) store.seenOpIds.add(`register:${mobile}:${key}`);
  if (body.consent) store.consents.push({ mobile, at: new Date().toISOString(), text: String(body.consent) });
  store.profiles.set(mobile, { mobile, verifiedAt: body.verifiedAt ?? new Date().toISOString(), ...body.profile, name: body.name });
  return c.json({ ok: true, mobile });
});

// POST /otp/send { mobile } -> { ok, demoOtp } (mock; production sends SMS)
app.post('/otp/send', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const mobile = String(body.mobile ?? '');
  if (!/^[6-9]\d{9}$/.test(mobile)) return c.json({ ok: false, error: 'invalid_mobile' }, 400);
  const code = makeOtp();
  store.otps.set(mobile, { code, exp: Date.now() + 5 * 60 * 1000 });
  return c.json({ ok: true, demoOtp: code, expiresInSec: 300 });
});

// POST /otp/verify { mobile, code, consent } -> { ok, token }
app.post('/otp/verify', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const mobile = String(body.mobile ?? '');
  const code = String(body.code ?? '');
  const rec = store.otps.get(mobile);
  if (!rec || rec.exp < Date.now() || rec.code !== code) return c.json({ ok: false, error: 'bad_otp' }, 401);
  store.otps.delete(mobile);
  if (body.consent) store.consents.push({ mobile, at: new Date().toISOString(), text: String(body.consent) });
  store.profiles.set(mobile, { mobile, verifiedAt: new Date().toISOString(), ...(body.profile ?? {}) });
  return c.json({ ok: true, token: `demo_${mobile}_${Date.now()}` });
});

// POST /verify-otp — plan-canonical alias of /otp/verify (mock 6-digit OTP).
app.post('/verify-otp', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const mobile = String(body.mobile ?? '');
  const code = String(body.code ?? body.otp ?? '');
  const rec = store.otps.get(mobile);
  if (!rec || rec.exp < Date.now() || rec.code !== code) return c.json({ ok: false, error: 'bad_otp' }, 401);
  store.otps.delete(mobile);
  if (body.consent) store.consents.push({ mobile, at: new Date().toISOString(), text: String(body.consent) });
  store.profiles.set(mobile, { mobile, verifiedAt: new Date().toISOString(), ...(body.profile ?? {}) });
  return c.json({ ok: true, token: `demo_${mobile}_${Date.now()}` });
});

// GET /alerts?mobile= — v2 tiered deadline alerts: critical (≤7d) → soon (≤30d) → open → expired.
app.get('/alerts', (c) => {
  const mobile = c.req.query('mobile') ?? '';
  const alerts = buildAlerts(SCHEMES, { mobile: mobile || undefined });
  return c.json({ ok: true, count: alerts.length, alerts });
});

// POST /sync { id/client_uuid, type, payload } — replay endpoint for the offline queue.
// Idempotent: re-sending the same op id returns { ok: true, duplicate: true }.
app.post('/sync', async (c) => {
  const op = await c.req.json().catch(() => null);
  store.stats.syncAttempts++;
  if (!op || !op.type) {
    store.stats.failed++;
    return c.json({ ok: false, error: 'bad_op' }, 400);
  }
  const key = String(op.client_uuid ?? op.id ?? '');
  if (key && store.seenOpIds.has(`sync:${key}`)) {
    store.stats.duplicates++;
    return c.json({ ok: true, id: op.id ?? null, duplicate: true });
  }
  if (key) store.seenOpIds.add(`sync:${key}`);
  store.stats.synced++;
  // Materialise register ops into profiles so replay converges server state.
  if (op.type === 'register' && op.payload && typeof op.payload === 'object') {
    const p = op.payload as Record<string, unknown>;
    const mobile = String(p.mobile ?? '');
    if (/^[6-9]\d{9}$/.test(mobile)) {
      store.profiles.set(mobile, { ...p, mobile, verifiedAt: p.verifiedAt ?? new Date().toISOString() });
      if (p.consent) store.consents.push({ mobile, at: new Date().toISOString(), text: String(p.consent) });
    }
  }
  if (op.type === 'alert_read') store.alertsRead.push({ ...op, receivedAt: new Date().toISOString() });
  store.queue.push({ ...op, receivedAt: new Date().toISOString() });
  return c.json({ ok: true, id: op.id ?? null });
});

app.get('/analytics', (c) => c.json({
  ok: true,
  queued: store.queue.length,
  verified: store.profiles.size,
  consents: store.consents.length,
}));

// GET /stats — v2 field analytics: offline sync impact (queued/replayed/failed).
// Powers the /stats SVG dashboard. queued = server queue depth right now.
app.get('/stats', (c) => c.json({
  ok: true,
  queued: store.queue.length,
  replayed: store.stats.synced,
  failed: store.stats.failed,
  duplicates: store.stats.duplicates,
  attempts: store.stats.syncAttempts,
  verified: store.profiles.size,
  consents: store.consents.length,
}));

export default app;
