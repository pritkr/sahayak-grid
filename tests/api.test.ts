import { describe, it, expect } from 'vitest';
import app, { store } from '../api/index.js';

describe('api', () => {
  it('GET /health ok', async () => {
    const r = await app.request('/health');
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.ok).toBe(true);
  });
  it('POST /otp/send rejects bad mobile', async () => {
    const r = await app.request('/otp/send', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mobile: '123' }) });
    expect(r.status).toBe(400);
  });
  it('OTP send -> verify roundtrip', async () => {
    const s = await app.request('/otp/send', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mobile: '9876543210' }) });
    const sj = await s.json();
    expect(sj.ok).toBe(true);
    const v = await app.request('/otp/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mobile: '9876543210', code: sj.demoOtp, consent: 'consent-hi-v1', profile: { name: 'Test' } }) });
    expect(v.status).toBe(200);
    expect(store.profiles.has('9876543210')).toBe(true);
  });
  it('wrong OTP rejected', async () => {
    await app.request('/otp/send', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mobile: '9123456780' }) });
    const v = await app.request('/otp/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mobile: '9123456780', code: '000000' }) });
    expect(v.status).toBe(401);
  });
  it('POST /sync stores op', async () => {
    const r = await app.request('/sync', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: 't1', type: 'register', payload: { a: 1 } }) });
    expect(r.status).toBe(200);
  });
  it('GET /analytics reflects store', async () => {
    const r = await app.request('/analytics');
    const j = await r.json();
    expect(j.ok).toBe(true);
    expect(j.verified).toBeGreaterThanOrEqual(1);
  });
});
