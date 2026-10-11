-- Sahayak Grid — seed data: 8 realistic Bihar schemes (Hindi + English).
-- Standalone seed: run AFTER db/schema.sql (it creates the tables).
-- Also safe to run on its own against the same schema (upserts by id).
--
-- Usage (Supabase SQL editor or psql):
--   \i db/schema.sql
--   \i db/seed.sql

insert into schemes (id, name_hi, name_en, dept_hi, benefit_hi, amount, deadline, window, tags_hi, keywords, eligibility) values
-- 1. Girl-child flagship: instalments from birth to graduation. [soon]
('mmkpy','मुख्यमंत्री कन्या उत्थान योजना','Mukhyamantri Kanya Utthan Yojana','समाज कल्याण विभाग, बिहार','बेटी के जन्म से स्नातक तक ₹54,100 किस्तों में',54100,'2026-10-23','01 Jul – 23 Oct 2026',array['बेटी','शिक्षा','महिला'],array['kanya','utthan','beti','ladki','girl','mahila'],jsonb_build_object('minAge',0,'maxAge',25,'genders',jsonb_build_array('female'),'maxIncome',300000,'biharDomicile',true)),
-- 2. One-time grant for graduate daughters. [soon]
('mmbsy','मुख्यमंत्री बालिका स्नातक प्रोत्साहन योजना','Balika Snatak Protsahan Yojana','शिक्षा विभाग, बिहार','स्नातक उत्तीर्ण बेटियों को ₹50,000 एकमुश्त',50000,'2026-10-10','01 Sep – 10 Oct 2026',array['स्नातक','बेटी','छात्रवृत्ति'],array['balika','snatak','graduate','beti','scholarship','chatravriti'],jsonb_build_object('minAge',18,'maxAge',30,'genders',jsonb_build_array('female'),'studentOnly',true,'biharDomicile',true)),
-- 3. Education loan for college students. [open]
('bssby','बिहार स्टूडेंट क्रेडिट कार्ड योजना','Bihar Student Credit Card Yojana','शिक्षा विभाग, बिहार','उच्च शिक्षा हेतु ₹4 लाख तक शिक्षा ऋण',400000,'2027-03-31','01 Jul 2026 – 31 Mar 2027',array['छात्र','ऋण','कॉलेज'],array['student','credit','card','loan','rin','chhatra','college','bscc'],jsonb_build_object('minAge',17,'maxAge',35,'genders',jsonb_build_array('female','male','any'),'studentOnly',true,'biharDomicile',true)),
-- 4. Monthly allowance for unemployed 12th-pass youth. [critical]
('mmsy','मुख्यमंत्री स्वयं सहायता भत्ता योजना','Mukhyamantri Swayam Sahayata Bhatta','श्रम संसाधन विभाग, बिहार','12वीं पास बेरोजगार युवाओं को ₹1,000/माह, 2 वर्ष तक',24000,'2026-09-28','01 Sep – 28 Sep 2026',array['बेरोजगार','युवा','भत्ता'],array['swayam','sahayata','bhatta','berojgar','yuva','allowance','youth'],jsonb_build_object('minAge',20,'maxAge',25,'genders',jsonb_build_array('female','male','any'),'maxIncome',300000,'biharDomicile',true)),
-- 5. Rural housing. [open]
('pmayg','प्रधानमंत्री आवास योजना – ग्रामीण','PM Awas Yojana – Gramin','ग्रामीण विकास विभाग','पक्का घर हेतु ₹1.20 लाख + मनरेगा मजदूरी',120000,'2027-01-31','01 Apr 2026 – 31 Jan 2027',array['आवास','घर','ग्रामीण'],array['awas','aawas','ghar','housing','makaan','pmay','grameen','rural'],jsonb_build_object('minAge',18,'maxAge',99,'genders',jsonb_build_array('female','male','any'),'maxIncome',200000,'biharDomicile',true)),
-- 6. Farmer income support. [soon]
('pmkisan','पीएम किसान सम्मान निधि','PM-KISAN Samman Nidhi','कृषि विभाग','किसान परिवारों को ₹6,000/वर्ष तीन किस्तों में',6000,'2026-10-16','01 Aug – 16 Oct 2026',array['किसान','खेती','किस्त'],array['kisan','farmer','kheti','pmkisan','krishi'],jsonb_build_object('minAge',18,'maxAge',99,'genders',jsonb_build_array('female','male','any'),'farmerOnly',true,'biharDomicile',true)),
-- 7. Women SHG livelihood (service-only benefit, amount 0). [open]
('jbsy','जीविका – बिहार आजीविका परियोजना (स्वयं सहायता समूह)','JEEViKA Livelihood Project (SHG)','ग्रामीण विकास विभाग, बिहार','महिला SHG को आसान ऋण + आजीविका प्रशिक्षण',0,'2026-12-15','01 Oct – 15 Dec 2026',array['महिला','समूह','रोजगार'],array['jeevika','jivika','shg','samooh','mahila','women','rojgar','livelihood'],jsonb_build_object('minAge',18,'maxAge',60,'genders',jsonb_build_array('female'),'biharDomicile',true)),
-- 8. Self-employment loan (minority welfare). [critical]
('mbaby','मुख्यमंत्री अल्पसंख्यक रोजगार ऋण योजना','Minority Employment Loan Scheme','अल्पसंख्यक कल्याण विभाग, बिहार','स्वरोजगार हेतु ₹5 लाख तक ऋण, 5% ब्याज अनुदान',500000,'2026-10-01','01 Aug – 01 Oct 2026',array['रोजगार','ऋण','अल्पसंख्यक'],array['alpsankhyak','minority','rojgar','employment','loan','rin','swarojgar'],jsonb_build_object('minAge',18,'maxAge',50,'genders',jsonb_build_array('female','male','any'),'maxIncome',600000,'biharDomicile',true))
on conflict (id) do update set
  name_hi = excluded.name_hi,
  name_en = excluded.name_en,
  dept_hi = excluded.dept_hi,
  benefit_hi = excluded.benefit_hi,
  amount = excluded.amount,
  deadline = excluded.deadline,
  window = excluded.window,
  tags_hi = excluded.tags_hi,
  keywords = excluded.keywords,
  eligibility = excluded.eligibility;
