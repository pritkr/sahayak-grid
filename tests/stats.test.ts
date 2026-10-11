import { describe, it, expect, beforeEach } from 'vitest';
import app, { store, resetStore } from '../api/index.js';

beforeEach(() => resetStore());

describe('GET /alerts tiered ordering', () => {
  it('returns all 8 schemes, critical first and expired last', async () => {
    const r = await app.request('/alerts');
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.ok).toBe(true);
    expect(j.count).toBe(8);
    const tiers = j.alerts.map((a: { tier: string }) => a.tier);
    const rank = (t: string) => ['critical', 'soon', 'open', 'expired'].indexOf(t);
    expect([...tiers].sort((a, b) => rank(a) - rank(b))).toEqual(tiers);
    expect(j.alerts[0].tier).toBe('critical');
    for (const a of j.alerts) {
      expect(a.tier_hi).toContain(a.tier === 'expired' ? 'समाप्त' : 'दिन बचे');
      expect(typeof a.days_left).toBe('number');
    }
  });
  it('?mobile= is echoed onto each alert', async () => {
    const r = await app.request('/alerts?mobile=9876543210');
    const j = await r.json();
    expect(j.alerts.every((a: { mobile?: string }) => a.mobile === '9876543210')).toBe(true);
  });
});

describe('sync analytics + GET /stats', () => {
  it('fresh store reports zeros', async () => {
    const j = await (await app.request('/stats')).json();
    expect(j).toMatchObject({ ok: true, queued: 0, replayed: 0, failed: 0, duplicates: 0, attempts: 0 });
  });
  it('bad op increments attempts + failed', async () => {
    const r = await app.request('/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nope: true }),
    });
    expect(r.status).toBe(400);
    const j = await (await app.request('/stats')).json();
    expect(j).toMatchObject({ attempts: 1, failed: 1, replayed: 0 });
  });
  it('replay of the same op id counts a duplicate, not a replay', async () => {
    const op = { id: 'op1', client_uuid: 'uuid-1', type: 'register', payload: { mobile: '9876543210', name: 'T' } };
    const once = await app.request('/sync', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(op) });
    expect((await once.json()).duplicate).toBeFalsy();
    const twice = await app.request('/sync', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(op) });
    expect((await twice.json()).duplicate).toBe(true);
    const j = await (await app.request('/stats')).json();
    expect(j).toMatchObject({ attempts: 2, replayed: 1, duplicates: 1, queued: 1 });
  });
  it('register ops materialise into profiles (verified grows)', async () => {
    await app.request('/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: 'r1', type: 'register', payload: { mobile: '9123456780', name: 'Field Test' } }),
    });
    expect(store.profiles.has('9123456780')).toBe(true);
    const j = await (await app.request('/stats')).json();
    expect(j.verified).toBe(1);
    expect(j.queued).toBe(1);
  });
});
