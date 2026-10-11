-- Sahayak Grid — Supabase / Postgres schema
-- Run in Supabase SQL editor. RLS enabled; anon can read schemes, writes via service role / edge function after OTP verify.

create table if not exists schemes (
  id text primary key,
  name_hi text not null,
  name_en text not null,
  dept_hi text not null,
  benefit_hi text not null,
  amount integer not null default 0,
  deadline date not null,
  tags_hi text[] not null default '{}',
  keywords text[] not null default '{}',
  eligibility jsonb not null default '{}'
);

create table if not exists profiles (
  mobile text primary key check (mobile ~ '^[6-9][0-9]{9}$'),
  name text not null,
  age integer not null check (age between 0 and 120),
  gender text not null default 'female',
  income integer not null default 0,
  is_student boolean not null default false,
  is_farmer boolean not null default false,
  domicile_bihar boolean not null default true,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists consent_log (
  id bigint generated always as identity primary key,
  mobile text not null references profiles(mobile) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists alerts (
  id bigint generated always as identity primary key,
  scheme_id text not null references schemes(id),
  mobile text not null references profiles(mobile) on delete cascade,
  remind_on date not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table schemes enable row level security;
alter table profiles enable row level security;
alter table consent_log enable row level security;
alter table alerts enable row level security;

drop policy if exists "schemes readable" on schemes;
create policy "schemes readable" on schemes for select using (true);

-- profiles/consents/alerts: owner by mobile claim set by edge function (service role bypasses RLS).
drop policy if exists "own profile" on profiles;
create policy "own profile" on profiles for all using (auth.jwt() ->> 'mobile' = mobile);

-- Seed: 8 Bihar schemes (Hindi + English)
insert into schemes (id, name_hi, name_en, dept_hi, benefit_hi, amount, deadline, tags_hi, keywords, eligibility) values
('mmkpy','मुख्यमंत्री कन्या उत्थान योजना','Mukhyamantri Kanya Utthan Yojana','समाज कल्याण विभाग, बिहार','बेटी के जन्म से स्नातक तक ₹54,100',54100,'2026-10-23',array['बेटी','शिक्षा','महिला'],array['kanya','utthan','beti','girl'],jsonb_build_object('maxAge',25,'genders',jsonb_build_array('female'),'biharDomicile',true)),
('mmbsy','मुख्यमंत्री बालिका स्नातक प्रोत्साहन योजना','Balika Snatak Protsahan','शिक्षा विभाग, बिहार','स्नातक बेटियों को ₹50,000',50000,'2026-10-10',array['स्नातक','बेटी'],array['balika','snatak','graduate'],jsonb_build_object('minAge',18,'maxAge',30,'genders',jsonb_build_array('female'),'studentOnly',true,'biharDomicile',true)),
('bssby','बिहार स्टूडेंट क्रेडिट कार्ड योजना','Bihar Student Credit Card','शिक्षा विभाग, बिहार','₹4 लाख तक शिक्षा ऋण',400000,'2027-03-31',array['छात्र','ऋण'],array['student','credit','loan','bscc'],jsonb_build_object('minAge',17,'maxAge',35,'studentOnly',true,'biharDomicile',true)),
('mmsy','मुख्यमंत्री स्वयं सहायता भत्ता योजना','Swayam Sahayata Bhatta','श्रम संसाधन विभाग, बिहार','₹1,000/माह 2 वर्ष तक',24000,'2026-09-28',array['बेरोजगार','युवा'],array['swayam','bhatta','berojgar'],jsonb_build_object('minAge',20,'maxAge',25,'biharDomicile',true)),
('pmayg','प्रधानमंत्री आवास योजना – ग्रामीण','PM Awas Gramin','ग्रामीण विकास विभाग','पक्का घर हेतु ₹1.20 लाख',120000,'2027-01-31',array['आवास','घर'],array['awas','ghar','housing','pmay'],jsonb_build_object('minAge',18,'biharDomicile',true)),
('pmkisan','पीएम किसान सम्मान निधि','PM-KISAN','कृषि विभाग','₹6,000/वर्ष किसान परिवारों को',6000,'2026-10-16',array['किसान','खेती'],array['kisan','farmer','pmkisan'],jsonb_build_object('minAge',18,'farmerOnly',true,'biharDomicile',true)),
('jbsy','जीविका – आजीविका परियोजना','JEEViKA SHG','ग्रामीण विकास विभाग, बिहार','महिला SHG ऋण + प्रशिक्षण',0,'2026-12-15',array['महिला','समूह'],array['jeevika','shg','mahila'],jsonb_build_object('minAge',18,'maxAge',60,'genders',jsonb_build_array('female'),'biharDomicile',true)),
('mbaby','अल्पसंख्यक रोजगार ऋण योजना','Minority Employment Loan','अल्पसंख्यक कल्याण विभाग, बिहार','₹5 लाख तक स्वरोजगार ऋण',500000,'2026-10-01',array['रोजगार','ऋण'],array['minority','rojgar','loan'],jsonb_build_object('minAge',18,'maxAge',50,'biharDomicile',true))
on conflict (id) do nothing;
