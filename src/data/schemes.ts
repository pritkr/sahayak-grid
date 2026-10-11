export interface Scheme {
  id: string;
  name_hi: string;
  name_en: string;
  dept_hi: string;
  dept_en: string;
  benefit_hi: string;
  benefit_en: string;
  amount: number; // annual INR, 0 if service-only
  deadline: string; // ISO date
  window?: string; // application window, free text (e.g. "01 Sep – 28 Sep 2026")
  tags_hi: string[];
  tags_en: string[];
  keywords: string[]; // roman transliterations for tolerant search
  eligibility: {
    minAge?: number;
    maxAge?: number;
    genders?: Array<'female' | 'male' | 'any'>;
    categories?: string[]; // SC/ST/OBC/EBC/General or [] = all
    maxIncome?: number; // annual INR
    studentOnly?: boolean;
    farmerOnly?: boolean;
    biharDomicile: boolean;
  };
}

export const SCHEMES: Scheme[] = [
  {
    id: 'mmkpy',
    name_hi: 'मुख्यमंत्री कन्या उत्थान योजना',
    name_en: 'Mukhyamantri Kanya Utthan Yojana',
    dept_hi: 'समाज कल्याण विभाग, बिहार',
    dept_en: 'Social Welfare Dept, Bihar',
    benefit_hi: 'बेटी के जन्म से स्नातक तक ₹54,100 किस्तों में',
    benefit_en: '₹54,100 in instalments from birth to graduation',
    amount: 54100,
    deadline: '2026-10-23',
    window: '01 Jul – 23 Oct 2026',
    tags_hi: ['बेटी', 'शिक्षा', 'महिला'],
    tags_en: ['girl', 'education', 'women'],
    keywords: ['kanya', 'utthan', 'beti', 'ladki', 'girl', 'mahila'],
    eligibility: { minAge: 0, maxAge: 25, genders: ['female'], categories: [], maxIncome: 300000, biharDomicile: true },
  },
  {
    id: 'mmbsy',
    name_hi: 'मुख्यमंत्री बालिका स्नातक प्रोत्साहन योजना',
    name_en: 'Balika Snatak Protsahan Yojana',
    dept_hi: 'शिक्षा विभाग, बिहार',
    dept_en: 'Education Dept, Bihar',
    benefit_hi: 'स्नातक उत्तीर्ण अविवाहित/विवाहित बेटियों को ₹50,000',
    benefit_en: '₹50,000 for graduate daughters',
    amount: 50000,
    deadline: '2026-10-10',
    window: '01 Sep – 10 Oct 2026',
    tags_hi: ['स्नातक', 'बेटी', 'छात्रवृत्ति'],
    tags_en: ['graduate', 'girl', 'scholarship'],
    keywords: ['balika', 'snatak', 'graduate', 'beti', 'scholarship', 'chatravriti'],
    eligibility: { minAge: 18, maxAge: 30, genders: ['female'], categories: [], studentOnly: true, biharDomicile: true },
  },
  {
    id: 'bssby',
    name_hi: 'बिहार स्टूडेंट क्रेडिट कार्ड योजना',
    name_en: 'Bihar Student Credit Card Yojana',
    dept_hi: 'शिक्षा विभाग, बिहार',
    dept_en: 'Education Dept, Bihar',
    benefit_hi: 'उच्च शिक्षा हेतु ₹4 लाख तक शिक्षा ऋण, आसान ब्याज',
    benefit_en: 'Up to ₹4 lakh education loan for higher studies',
    amount: 400000,
    deadline: '2027-03-31',
    window: '01 Jul 2026 – 31 Mar 2027',
    tags_hi: ['छात्र', 'ऋण', 'कॉलेज'],
    tags_en: ['student', 'loan', 'college'],
    keywords: ['student', 'credit', 'card', 'loan', 'rin', 'chhatra', 'college', 'bscc'],
    eligibility: { minAge: 17, maxAge: 35, genders: ['female', 'male', 'any'], categories: [], studentOnly: true, biharDomicile: true },
  },
  {
    id: 'mmsy',
    name_hi: 'मुख्यमंत्री स्वयं सहायता भत्ता योजना',
    name_en: 'Mukhyamantri Swayam Sahayata Bhatta',
    dept_hi: 'श्रम संसाधन विभाग, बिहार',
    dept_en: 'Labour Resources Dept, Bihar',
    benefit_hi: '12वीं पास बेरोजगार युवाओं को ₹1,000/माह, 2 वर्ष तक',
    benefit_en: '₹1,000/month for 2 years for unemployed 12th-pass youth',
    amount: 24000,
    deadline: '2026-09-28',
    window: '01 Sep – 28 Sep 2026',
    tags_hi: ['बेरोजगार', 'युवा', 'भत्ता'],
    tags_en: ['unemployed', 'youth', 'allowance'],
    keywords: ['swayam', 'sahayata', 'bhatta', 'berojgar', 'yuva', 'allowance', 'youth'],
    eligibility: { minAge: 20, maxAge: 25, genders: ['female', 'male', 'any'], categories: [], maxIncome: 300000, biharDomicile: true },
  },
  {
    id: 'pmayg',
    name_hi: 'प्रधानमंत्री आवास योजना – ग्रामीण',
    name_en: 'PM Awas Yojana – Gramin',
    dept_hi: 'ग्रामीण विकास विभाग',
    dept_en: 'Rural Development Dept',
    benefit_hi: 'पक्का घर हेतु ₹1.20 लाख + मनरेगा मजदूरी',
    benefit_en: '₹1.20 lakh for pucca house + MGNREGA wages',
    amount: 120000,
    deadline: '2027-01-31',
    window: '01 Apr 2026 – 31 Jan 2027',
    tags_hi: ['आवास', 'घर', 'ग्रामीण'],
    tags_en: ['housing', 'home', 'rural'],
    keywords: ['awas', 'aawas', 'ghar', 'housing', 'makaan', 'pmay', 'grameen', 'rural'],
    eligibility: { minAge: 18, maxAge: 99, genders: ['female', 'male', 'any'], categories: [], maxIncome: 200000, biharDomicile: true },
  },
  {
    id: 'pmkisan',
    name_hi: 'पीएम किसान सम्मान निधि',
    name_en: 'PM-KISAN Samman Nidhi',
    dept_hi: 'कृषि विभाग',
    dept_en: 'Agriculture Dept',
    benefit_hi: 'किसान परिवारों को ₹6,000/वर्ष तीन किस्तों में',
    benefit_en: '₹6,000/year to farmer families in 3 instalments',
    amount: 6000,
    deadline: '2026-10-16',
    window: '01 Aug – 16 Oct 2026',
    tags_hi: ['किसान', 'खेती', 'किस्त'],
    tags_en: ['farmer', 'agriculture', 'instalment'],
    keywords: ['kisan', 'farmer', 'kheti', 'pmkisan', ' Samman', 'krishi'],
    eligibility: { minAge: 18, maxAge: 99, genders: ['female', 'male', 'any'], categories: [], farmerOnly: true, biharDomicile: true },
  },
  {
    id: 'jbsy',
    name_hi: 'जीविका – बिहार आजीविका परियोजना (स्वयं सहायता समूह)',
    name_en: 'JEEViKA Livelihood Project (SHG)',
    dept_hi: 'ग्रामीण विकास विभाग, बिहार',
    dept_en: 'Rural Development Dept, Bihar',
    benefit_hi: 'महिला SHG को आसान ऋण + आजीविका प्रशिक्षण',
    benefit_en: 'Easy credit + livelihood training for women SHGs',
    amount: 0,
    deadline: '2026-12-15',
    window: '01 Oct – 15 Dec 2026',
    tags_hi: ['महिला', 'समूह', 'रोजगार'],
    tags_en: ['women', 'shg', 'livelihood'],
    keywords: ['jeevika', 'jivika', 'shg', 'samooh', 'mahila', 'women', 'rojgar', 'livelihood'],
    eligibility: { minAge: 18, maxAge: 60, genders: ['female'], categories: [], biharDomicile: true },
  },
  {
    id: 'mbaby',
    name_hi: 'मुख्यमंत्री अल्पसंख्यक रोजगार ऋण योजना',
    name_en: 'Minority Employment Loan Scheme',
    dept_hi: 'अल्पसंख्यक कल्याण विभाग, बिहार',
    dept_en: 'Minority Welfare Dept, Bihar',
    benefit_hi: 'स्वरोजगार हेतु ₹5 लाख तक ऋण, 5% ब्याज अनुदान',
    benefit_en: 'Up to ₹5 lakh self-employment loan, 5% subsidy',
    amount: 500000,
    deadline: '2026-10-01',
    window: '01 Aug – 01 Oct 2026',
    tags_hi: ['रोजगार', 'ऋण', 'अल्पसंख्यक'],
    tags_en: ['employment', 'loan', 'minority'],
    keywords: ['alpsankhyak', 'minority', 'rojgar', 'employment', 'loan', 'rin', 'swarojgar'],
    eligibility: { minAge: 18, maxAge: 50, genders: ['female', 'male', 'any'], categories: [], maxIncome: 600000, biharDomicile: true },
  },
];
