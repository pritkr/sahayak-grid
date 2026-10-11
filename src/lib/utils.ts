// Deadline helpers — pure, testable.

export function daysLeft(deadlineISO: string, nowISO?: string): number {
  const now = nowISO ? new Date(nowISO) : new Date();
  const dl = new Date(deadlineISO + (deadlineISO.length === 10 ? 'T23:59:59' : ''));
  const ms = dl.getTime() - now.getTime();
  return Math.ceil(ms / 86400000);
}

export function urgency(days: number): 'over' | 'urgent' | 'soon' | 'ok' {
  if (days < 0) return 'over';
  if (days <= 30) return 'urgent';
  if (days <= 90) return 'soon';
  return 'ok';
}

export function urgencyLabelHi(days: number): string {
  const u = urgency(days);
  if (u === 'over') return 'समय समाप्त';
  if (u === 'urgent') return `सिर्फ ${days} दिन बचे!`;
  if (u === 'soon') return `${days} दिन बचे`;
  return `${days} दिन बचे`;
}

// 6-digit OTP: mock generator + verifier (dev/demo only — real OTP via SMS provider server-side).
export function makeOtp(seed?: number): string {
  const n = seed !== undefined ? seed : Math.floor(100000 + Math.random() * 900000);
  return String(Math.abs(n) % 1000000).padStart(6, '0');
}

export function verifyOtp(expected: string, input: string): boolean {
  return normalizeOtp(input) === normalizeOtp(expected);
}

export function normalizeOtp(s: string): string {
  return s.replace(/[^\d०-९]/g, '').replace(/[०-९]/g, (d) => '०१२३४५६७८९'.indexOf(d).toString()).slice(0, 6);
}

// Donut-chart segments for result analytics (pure SVG math).
export function donutSegments(values: number[], radius = 40, cx = 50, cy = 50): string[] {
  const total = values.reduce((a, b) => a + b, 0) || 1;
  let angle = -90;
  return values.map((v) => {
    const frac = v / total;
    const a0 = (angle * Math.PI) / 180;
    angle += frac * 360;
    const a1 = (angle * Math.PI) / 180;
    const large = frac > 0.5 ? 1 : 0;
    const x0 = cx + radius * Math.cos(a0), y0 = cy + radius * Math.sin(a0);
    const x1 = cx + radius * Math.cos(a1), y1 = cy + radius * Math.sin(a1);
    if (frac <= 0 || frac >= 1) return '';
    return `M ${cx} ${cy} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${radius} ${radius} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
  });
}
