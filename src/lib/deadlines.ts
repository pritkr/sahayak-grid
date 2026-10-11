// SPEC-016 v2 — deadline engine: pure, testable urgency tiers + tiered alerts.
// Tiers: critical (≤7d) → soon (≤30d) → open (else, incl. no-deadline) ; expired last.
// Sort puts actionable alerts first; missed deadlines sink to the bottom (still listed).

import type { Scheme } from '../data/schemes.js';

export type UrgencyTier = 'critical' | 'soon' | 'open' | 'expired';

export interface TieredAlert {
  scheme_id: string;
  name_hi: string;
  name_en?: string;
  deadline: string;
  window?: string;
  days_left: number | null;
  tier: UrgencyTier;
  tier_hi: string;
  mobile?: string;
}

/** Days left until end-of-day on the deadline (IST-agnostic, date-only math). Null = no deadline set. */
export function daysLeft(deadline?: string | null, now?: Date | string | number): number | null {
  if (!deadline || !String(deadline).trim()) return null;
  const t = now === undefined ? new Date() : new Date(now);
  const dl = new Date(String(deadline).trim() + 'T23:59:59');
  if (Number.isNaN(dl.getTime()) || Number.isNaN(t.getTime())) return null;
  // Date-only diff: compare calendar days so boundary tests (7/30) are DST-proof.
  const dayMs = 86400000;
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((startOfDay(dl) - startOfDay(t)) / dayMs);
}

/** Urgency tier: critical ≤7d, soon ≤30d, open else (incl. no-deadline), expired when past. */
export function urgencyTier(days: number | null): UrgencyTier {
  if (days === null) return 'open';
  if (days < 0) return 'expired';
  if (days <= 7) return 'critical';
  if (days <= 30) return 'soon';
  return 'open';
}

export function tierRank(t: UrgencyTier): number {
  return t === 'critical' ? 0 : t === 'soon' ? 1 : t === 'open' ? 2 : 3;
}

export function tierLabelHi(tier: UrgencyTier, days: number | null): string {
  if (tier === 'expired') return 'समय समाप्त';
  if (days === null) return 'तिथि जल्द घोषित होगी';
  if (tier === 'critical') return `सिर्फ ${days} दिन बचे!`;
  return `${days} दिन बचे`;
}

/** Parse a scheme's deadline + application window. Window is free text (may be absent). */
export function parseDeadline(s: Pick<Scheme, 'deadline' | 'window'>): { deadline: string; window: string | null } {
  const deadline = (s.deadline ?? '').trim();
  const w = typeof s.window === 'string' ? s.window.trim() : '';
  return { deadline, window: w ? w : null };
}

/** Build tiered alerts sorted by urgency (critical → soon → open → expired), then days-left. */
export function buildAlerts(
  schemes: Array<Pick<Scheme, 'id' | 'name_hi' | 'name_en' | 'deadline' | 'window'>>,
  opts?: { now?: Date | string | number; mobile?: string; limit?: number },
): TieredAlert[] {
  const now = opts?.now;
  const out: TieredAlert[] = schemes.map((s) => {
    const { deadline, window } = parseDeadline(s);
    const days = daysLeft(deadline || null, now);
    const tier = urgencyTier(days);
    return {
      scheme_id: s.id,
      name_hi: s.name_hi,
      name_en: s.name_en,
      deadline,
      window: window ?? undefined,
      days_left: days,
      tier,
      tier_hi: tierLabelHi(tier, days),
      mobile: opts?.mobile || undefined,
    };
  });
  out.sort((a, b) => {
    const r = tierRank(a.tier) - tierRank(b.tier);
    if (r !== 0) return r;
    const da = a.days_left ?? Number.MAX_SAFE_INTEGER;
    const db = b.days_left ?? Number.MAX_SAFE_INTEGER;
    return da - db;
  });
  return typeof opts?.limit === 'number' ? out.slice(0, opts.limit) : out;
}

/** Group alerts by tier for the /alerts page (preserves urgency order within groups). */
export function groupByTier(alerts: TieredAlert[]): Record<UrgencyTier, TieredAlert[]> {
  const g: Record<UrgencyTier, TieredAlert[]> = { critical: [], soon: [], open: [], expired: [] };
  for (const a of alerts) g[a.tier].push(a);
  return g;
}
