import { SCHEMES, type Scheme } from '../data/schemes.js';

// Hindi transliteration-tolerant search: normalise roman + devanagari, substring match.
const ROMAN_MAP: Record<string, string> = {
  aa: 'ा', ee: 'ी', oo: 'ू', ai: 'ै', au: 'ौ',
  a: '', e: '', i: '', o: '', u: '',
};

export function normalize(q: string): string {
  return q
    .toLowerCase()
    .normalize('NFC')
    .replace(/[ँंः़]/g, '')
    .replace(/[^a-z\u0900-\u097F0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Rough roman->devanagari folding so "kanya" also matches "कन्या".
const FOLD: Array<[RegExp, string]> = [
  [/kanya|kanyaa/g, 'कन्या'],
  [/beti|betee|ladki|ladkee/g, 'बेटी'],
  [/awas|aawas/g, 'आवास'],
  [/kisan|kisaan/g, 'किसान'],
  [/chhatra|chatra/g, 'छात्र'],
  [/rojgar|rozgar/g, 'रोजगार'],
  [/rin|loan|karz/g, 'ऋण'],
  [/snatak|graduate/g, 'स्नातक'],
  [/mahila|aurat|women|woman/g, 'महिला'],
  [/ghar|makaan|makan|housing|home/g, 'घर'],
  [/shiksha|shikchha|education|padhai/g, 'शिक्षा'],
  [/yojana|yojna|scheme/g, 'योजना'],
];

export function foldRoman(q: string): string {
  let s = ' ' + q + ' ';
  for (const [re, dev] of FOLD) s = s.replace(re, dev);
  return s;
}

export function searchSchemes(query: string): Scheme[] {
  const nq = normalize(query);
  if (!nq) return SCHEMES;
  const folded = foldRoman(nq);
  const tokens = folded.split(' ').filter(Boolean);
  const scored = SCHEMES.map((s) => {
    const hay = normalize(
      [s.name_hi, s.name_en, s.dept_hi, s.dept_en, s.benefit_hi, s.benefit_en, ...s.tags_hi, ...s.tags_en, ...s.keywords].join(' ') +
        ' ' +
        foldRoman([s.name_en, ...s.tags_en, ...s.keywords].join(' ').toLowerCase()),
    );
    let score = 0;
    for (const t of tokens) {
      if (!t) continue;
      if (hay.includes(t)) score += t.length >= 4 ? 2 : 1;
    }
    return { s, score };
  }).filter((x) => x.score > 0);
  scored.sort((a, b) => b.score - a.score);
  return scored.map((x) => x.s);
}
