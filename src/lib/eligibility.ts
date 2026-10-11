import { SCHEMES, type Scheme } from '../data/schemes.js';

export interface Profile {
  age: number;
  gender: 'female' | 'male' | 'any';
  category: string;
  income: number;
  isStudent: boolean;
  isFarmer: boolean;
  domicileBihar: boolean;
}

export function checkEligibility(scheme: Scheme, p: Profile): { eligible: boolean; reasons_hi: string[] } {
  const reasons: string[] = [];
  const e = scheme.eligibility;
  if (!p.domicileBihar && e.biharDomicile) reasons.push('बिहार निवासी होना आवश्यक');
  if (e.minAge !== undefined && p.age < e.minAge) reasons.push(`आयु ${e.minAge}+ होनी चाहिए`);
  if (e.maxAge !== undefined && p.age > e.maxAge) reasons.push(`आयु ${e.maxAge} तक ही`);
  if (e.genders && !e.genders.includes('any') && !e.genders.includes(p.gender)) reasons.push('लिंग शर्त पूरी नहीं');
  if (e.maxIncome !== undefined && p.income > e.maxIncome) reasons.push(`आय ₹${e.maxIncome.toLocaleString('en-IN')} से कम हो`);
  if (e.studentOnly && !p.isStudent) reasons.push('केवल विद्यार्थी हेतु');
  if (e.farmerOnly && !p.isFarmer) reasons.push('केवल किसान परिवार हेतु');
  return { eligible: reasons.length === 0, reasons_hi: reasons };
}

export function eligibleSchemes(p: Profile): Scheme[] {
  return SCHEMES.filter((s) => checkEligibility(s, p).eligible);
}

export function totalBenefit(schemes: Scheme[]): number {
  return schemes.reduce((a, s) => a + (s.amount || 0), 0);
}
