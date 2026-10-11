import { describe, it, expect } from 'vitest';
import { SCHEMES } from '../src/data/schemes.js';
import { checkEligibility, eligibleSchemes, totalBenefit } from '../src/lib/eligibility.js';

const girl21 = { age: 21, gender: 'female' as const, category: 'OBC', income: 120000, isStudent: true, isFarmer: false, domicileBihar: true };

describe('seed data', () => {
  it('has 8 schemes', () => expect(SCHEMES).toHaveLength(8));
  it('every scheme has Hindi name + deadline', () => {
    for (const s of SCHEMES) {
      expect(s.name_hi.length).toBeGreaterThan(2);
      expect(new Date(s.deadline).getTime()).not.toBeNaN();
    }
  });
});

describe('eligibility', () => {
  it('girl student 21 is eligible for Kanya Utthan', () => {
    const s = SCHEMES.find((x) => x.id === 'mmkpy')!;
    expect(checkEligibility(s, girl21).eligible).toBe(true);
  });
  it('male is not eligible for Kanya Utthan', () => {
    const s = SCHEMES.find((x) => x.id === 'mmkpy')!;
    expect(checkEligibility(s, { ...girl21, gender: 'male' }).eligible).toBe(false);
  });
  it('non-student rejected from credit card scheme', () => {
    const s = SCHEMES.find((x) => x.id === 'bssby')!;
    expect(checkEligibility(s, { ...girl21, isStudent: false }).eligible).toBe(false);
  });
  it('non-farmer rejected from PM-KISAN', () => {
    const s = SCHEMES.find((x) => x.id === 'pmkisan')!;
    expect(checkEligibility(s, girl21).eligible).toBe(false);
    expect(checkEligibility(s, { ...girl21, isFarmer: true }).eligible).toBe(true);
  });
  it('non-domicile rejected everywhere', () => {
    expect(eligibleSchemes({ ...girl21, domicileBihar: false })).toHaveLength(0);
  });
  it('totalBenefit sums amounts', () => {
    expect(totalBenefit(SCHEMES.slice(0, 2))).toBe(54100 + 50000);
  });
});
