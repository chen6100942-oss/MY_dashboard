-- ============================================================
-- מודול פיננסי — טבלאות Supabase
-- הרצה חד-פעמית: Supabase Dashboard → SQL Editor → הדבקה → Run
-- (בטוח להריץ שוב — כל הפקודות "if not exists")
-- ============================================================

-- תנועות חודשיות: הכנסה / הוצאה מהחשבון
create table if not exists finance_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null,               -- לדוגמה '2026-06'
  type text not null check (type in ('income','expense','investment_deposit','loan_payment')),
  category text not null,
  amount numeric not null default 0,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists finance_entries_user_month_idx on finance_entries(user_id, month);
alter table finance_entries enable row level security;
drop policy if exists "Users manage their own finance entries" on finance_entries;
create policy "Users manage their own finance entries"
  on finance_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- קרנות השקעה וחיסכון: שווי נוכחי + הפקדה חודשית
create table if not exists finance_funds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fund_name text not null,
  current_value numeric not null default 0,
  monthly_deposit numeric default 0,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table finance_funds enable row level security;
drop policy if exists "Users manage their own funds" on finance_funds;
create policy "Users manage their own funds"
  on finance_funds for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- הלוואות ומשכנתא: סכום כולל, תשלום חודשי, יתרה לסילוק
create table if not exists finance_loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  loan_name text not null,
  total_amount numeric default 0,
  monthly_payment numeric default 0,
  remaining_balance numeric default 0,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table finance_loans enable row level security;
drop policy if exists "Users manage their own loans" on finance_loans;
create policy "Users manage their own loans"
  on finance_loans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- כרטיסי אשראי: שורות פירוט לפי כרטיס (מוזן ידנית או מיובא מ-PDF)
create table if not exists finance_credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null,               -- חודש החיוב, לדוגמה '2026-06'
  card_name text not null,           -- לדוגמה 'ישראכרט זהב'
  description text not null,         -- פירוט העסקה
  category text not null default 'שונות', -- תחום ההוצאה (דלק, ביטוחים, וכו')
  monthly_amount numeric default 0,  -- סכום התשלום החודשי
  installments_remaining integer default 1,
  installments_total integer default 1,
  full_amount numeric default 0,     -- סך העסקה המלאה
  created_at timestamptz not null default now()
);
alter table finance_credit_cards add column if not exists category text not null default 'שונות';
create index if not exists finance_credit_cards_user_month_idx on finance_credit_cards(user_id, month);
alter table finance_credit_cards enable row level security;
drop policy if exists "Users manage their own credit card lines" on finance_credit_cards;
create policy "Users manage their own credit card lines"
  on finance_credit_cards for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- יעדים פיננסיים: חיסכון לדירה, טיול, רכב וכו' — סכום יעד, תאריך יעד, וכמה כבר נחסך
create table if not exists finance_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_name text not null,
  goal_type text not null default 'other',
  target_amount numeric not null default 0,
  target_date text,                  -- לדוגמה '2027-06', ריק אם אין דדליין
  current_amount numeric not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table finance_goals enable row level security;
drop policy if exists "Users manage their own financial goals" on finance_goals;
create policy "Users manage their own financial goals"
  on finance_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
