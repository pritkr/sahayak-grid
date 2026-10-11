import { describe, it, expect } from 'vitest';
import { daysLeft, urgency, urgencyLabelHi, makeOtp, verifyOtp, normalizeOtp, donutSegments } from '../src/lib/utils.js';

describe('deadlines', () => {
  it('daysLeft counts correctly', () => {
    expect(daysLeft('2026-12-31', '2026-12-01T00:00:00')).toBe(31);
  });
  it('urgency bands', () => {
    expect(urgency(-1)).toBe('over');
    expect(urgency(5)).toBe('urgent');
    expect(urgency(60)).toBe('soon');
    expect(urgency(200)).toBe('ok');
  });
  it('hindi label for urgent', () => {
    expect(urgencyLabelHi(5)).toContain('दिन');
  });
});

describe('otp', () => {
  it('makeOtp is 6 digits', () => expect(makeOtp(42)).toMatch(/^\d{6}$/));
  it('verifyOtp accepts match', () => expect(verifyOtp('123456', '123456')).toBe(true));
  it('verifyOtp rejects mismatch', () => expect(verifyOtp('123456', '654321')).toBe(false));
  it('normalizeOtp converts Devanagari digits', () => expect(normalizeOtp('१२३४५६')).toBe('123456'));
});

describe('donut', () => {
  it('returns one path per value', () => expect(donutSegments([3, 5])).toHaveLength(2));
  it('paths are SVG move commands', () => {
    for (const d of donutSegments([2, 6])) expect(d.startsWith('M')).toBe(true);
  });
});
