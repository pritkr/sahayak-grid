import { describe, it, expect } from 'vitest';
import { SCHEMES } from '../src/data/schemes.js';
import {
  daysLeft,
  urgencyTier,
  tierLabelHi,
  parseDeadline,
  buildAlerts,
  groupByTier,
} from '../src/lib/deadlines.js';

// Fixed "today" in the Sep-2026 field season so stagger assertions are deterministic.
const NOW = '2026-09-26T12:00:00';

describe('daysLeft', () => {
  it('counts calendar days (date-only math)', () => {
    expect(daysLeft('2026-12-31', '2026-12-01T00:00:00')).toBe(30);
  });
  it('boundary: exactly 7 days out', () => {
    expect(daysLeft('2026-10-03', NOW)).toBe(7);
  });
  it('boundary: exactly 30 days out', () => {
    expect(daysLeft('2026-10-26', NOW)).toBe(30);
  });
  it('expired deadline goes negative', () => {
    expect(daysLeft('2026-09-20', NOW)).toBeLessThan(0);
  });
  it('no-deadline schemes return null', () => {
    expect(daysLeft(null, NOW)).toBeNull();
    expect(daysLeft('', NOW)).toBeNull();
    expect(daysLeft(undefined, NOW)).toBeNull();
  });
  it('garbage deadline returns null', () => {
    expect(daysLeft('not-a-date', NOW)).toBeNull();
  });
});

describe('urgencyTier boundaries', () => {
  it('critical at exactly 7d, soon at 8d', () => {
    expect(urgencyTier(7)).toBe('critical');
    expect(urgencyTier(8)).toBe('soon');
  });
  it('soon at exactly 30d, open at 31d', () => {
    expect(urgencyTier(30)).toBe('soon');
    expect(urgencyTier(31)).toBe('open');
  });
  it('negative is expired, null is open', () => {
    expect(urgencyTier(-1)).toBe('expired');
    expect(urgencyTier(null)).toBe('open');
  });
  it('Hindi labels carry "दिन बचे"', () => {
    expect(tierLabelHi('critical', 3)).toContain('दिन बचे');
    expect(tierLabelHi('soon', 20)).toContain('दिन बचे');
    expect(tierLabelHi('expired', -2)).toBe('समय समाप्त');
    expect(tierLabelHi('open', null)).toContain('घोषित');
  });
});

describe('parseDeadline', () => {
  it('keeps deadline + window, nulls blank window', () => {
    expect(parseDeadline({ deadline: '2026-10-01', window: '01 Aug – 01 Oct 2026' })).toEqual({
      deadline: '2026-10-01',
      window: '01 Aug – 01 Oct 2026',
    });
    expect(parseDeadline({ deadline: '2026-10-01' }).window).toBeNull();
  });
});

describe('buildAlerts tiered ordering', () => {
  it('sorts critical → soon → open → expired, then by days-left', () => {
    const alerts = buildAlerts(
      [
        { id: 'open1', name_hi: 'ओपन', deadline: '2027-03-31' },
        { id: 'exp1', name_hi: 'समाप्त', deadline: '2026-09-01' },
        { id: 'crit1', name_hi: 'जरूरी', deadline: '2026-09-28' },
        { id: 'soon1', name_hi: 'जल्द', deadline: '2026-10-16' },
        { id: 'crit2', name_hi: 'जरूरी2', deadline: '2026-10-01' },
        { id: 'nodl', name_hi: 'बिना तिथि', deadline: '' },
      ],
      { now: NOW },
    );
    expect(alerts.map((a) => a.scheme_id)).toEqual(['crit1', 'crit2', 'soon1', 'open1', 'nodl', 'exp1']);
    expect(alerts.map((a) => a.tier)).toEqual(['critical', 'critical', 'soon', 'open', 'open', 'expired']);
  });
  it('seed staggers 2 critical / 3 soon / 3 open on 2026-09-26', () => {
    const alerts = buildAlerts(SCHEMES, { now: NOW });
    const g = groupByTier(alerts);
    expect(g.critical.map((a) => a.scheme_id).sort()).toEqual(['mbaby', 'mmsy']);
    expect(g.soon.map((a) => a.scheme_id).sort()).toEqual(['mmbsy', 'mmkpy', 'pmkisan']);
    expect(g.open).toHaveLength(3);
    expect(g.expired).toHaveLength(0);
    // Most urgent overall: mmsy (2 days left) comes first.
    expect(alerts[0].scheme_id).toBe('mmsy');
    expect(alerts[0].days_left).toBe(2);
  });
  it('groupByTier preserves urgency order within groups', () => {
    const g = groupByTier(buildAlerts(SCHEMES, { now: NOW }));
    const days = g.soon.map((a) => a.days_left as number);
    expect([...days].sort((a, b) => a - b)).toEqual(days);
  });
});
