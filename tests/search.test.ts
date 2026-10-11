import { describe, it, expect } from 'vitest';
import { searchSchemes, normalize, foldRoman } from '../src/lib/search.js';

describe('search', () => {
  it('empty query returns all 8', () => expect(searchSchemes('')).toHaveLength(8));
  it('hindi query finds Kanya', () => {
    expect(searchSchemes('कन्या').some((s) => s.id === 'mmkpy')).toBe(true);
  });
  it('roman "kanya" finds Kanya (transliteration tolerant)', () => {
    expect(searchSchemes('kanya').some((s) => s.id === 'mmkpy')).toBe(true);
  });
  it('"awas" finds housing scheme', () => {
    expect(searchSchemes('awas').some((s) => s.id === 'pmayg')).toBe(true);
  });
  it('"loan" finds credit-card / employment schemes', () => {
    const ids = searchSchemes('loan').map((s) => s.id);
    expect(ids).toContain('bssby');
  });
  it('gibberish returns empty', () => {
    expect(searchSchemes('zzzqqq999')).toHaveLength(0);
  });
  it('normalize strips punctuation', () => {
    expect(normalize('  Kanya! ')).toBe('kanya');
  });
  it('foldRoman maps beti -> बेटी', () => {
    expect(foldRoman('beti')).toContain('बेटी');
  });
});
