-- ============================================================
-- מודול אבטחה — PIN מאובטח לכרטיסיית פיננסים + קודי גיבוי לאימות דו-שלבי
-- הרצה חד-פעמית: Supabase Dashboard → SQL Editor → הדבקה → Run
-- (בטוח להריץ שוב — כל הפקודות "if not exists" / "create or replace")
-- ============================================================

create extension if not exists pgcrypto;

-- ────────────────────────────────────────────────────────────
-- PIN מאובטח לכניסה לכרטיסיית "פיננסים"
-- הטבלה הזו במתכוון בלי RLS policies בכלל — אין שום דרך לקרוא/לכתוב אליה
-- ישירות מהדפדפן, גם לא עבור המשתמשת עצמה. הגישה היחידה היא דרך שלוש
-- הפונקציות למטה (security definer), כך שה-hash של הקוד אף פעם לא יוצא
-- מהשרת, וההשוואה עצמה (האם הקוד נכון) קורית רק בתוך Postgres.
-- ────────────────────────────────────────────────────────────
create table if not exists finance_pin (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pin_hash text not null,
  failed_attempts int not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);
alter table finance_pin enable row level security;

create or replace function public.set_finance_pin(new_pin text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if new_pin is null or length(new_pin) < 4 then
    raise exception 'קוד חייב להיות באורך 4 תווים לפחות';
  end if;
  insert into finance_pin (user_id, pin_hash, failed_attempts, locked_until, updated_at)
  values (auth.uid(), crypt(new_pin, gen_salt('bf')), 0, null, now())
  on conflict (user_id) do update
    set pin_hash = excluded.pin_hash, failed_attempts = 0, locked_until = null, updated_at = now();
end;
$$;

create or replace function public.verify_finance_pin(candidate_pin text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  row_data finance_pin%rowtype;
  ok boolean;
begin
  select * into row_data from finance_pin where user_id = auth.uid();
  if row_data.user_id is null then
    return false;
  end if;
  if row_data.locked_until is not null and row_data.locked_until > now() then
    raise exception 'יותר מדי ניסיונות שגויים — נסי שוב בעוד כמה דקות';
  end if;
  ok := (row_data.pin_hash = crypt(candidate_pin, row_data.pin_hash));
  if ok then
    update finance_pin set failed_attempts = 0, locked_until = null where user_id = auth.uid();
  else
    update finance_pin set
      failed_attempts = failed_attempts + 1,
      locked_until = case when failed_attempts + 1 >= 5 then now() + interval '10 minutes' else locked_until end
      where user_id = auth.uid();
  end if;
  return ok;
end;
$$;

create or replace function public.has_finance_pin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(select 1 from finance_pin where user_id = auth.uid());
$$;

create or replace function public.clear_finance_pin()
returns void
language sql
security definer
set search_path = public
as $$
  delete from finance_pin where user_id = auth.uid();
$$;

revoke all on function public.set_finance_pin(text) from public;
revoke all on function public.verify_finance_pin(text) from public;
revoke all on function public.has_finance_pin() from public;
revoke all on function public.clear_finance_pin() from public;
grant execute on function public.set_finance_pin(text) to authenticated;
grant execute on function public.verify_finance_pin(text) to authenticated;
grant execute on function public.has_finance_pin() to authenticated;
grant execute on function public.clear_finance_pin() to authenticated;

-- ────────────────────────────────────────────────────────────
-- קודי גיבוי לאימות דו-שלבי (2FA)
-- נוצרים פעם אחת בהפעלת 2FA (ומחליפים כל סט קודם), מוצגים למשתמשת פעם אחת
-- בלבד במסך, ונשמרים כאן רק כ-hash. כל קוד ניתן למימוש פעם אחת — נועד
-- לשחזור חשבון אם היא מאבדת גישה לטלפון עם אפליקציית האימות.
-- ────────────────────────────────────────────────────────────
create table if not exists mfa_backup_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code_hash text not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists mfa_backup_codes_user_idx on mfa_backup_codes(user_id);
alter table mfa_backup_codes enable row level security;

create or replace function public.generate_mfa_backup_codes()
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  codes text[] := '{}';
  plain text;
  i int;
begin
  delete from mfa_backup_codes where user_id = auth.uid();
  for i in 1..10 loop
    plain := upper(substr(md5(random()::text || clock_timestamp()::text || i::text), 1, 4)
      || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 4));
    codes := array_append(codes, plain);
    insert into mfa_backup_codes (user_id, code_hash) values (auth.uid(), crypt(plain, gen_salt('bf')));
  end loop;
  return codes;
end;
$$;

create or replace function public.redeem_mfa_backup_code(candidate_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  match_id uuid;
begin
  select id into match_id from mfa_backup_codes
    where user_id = auth.uid() and used = false and code_hash = crypt(candidate_code, code_hash)
    limit 1;
  if match_id is null then
    return false;
  end if;
  update mfa_backup_codes set used = true where id = match_id;
  return true;
end;
$$;

create or replace function public.count_unused_mfa_backup_codes()
returns int
language sql
security definer
set search_path = public
as $$
  select count(*)::int from mfa_backup_codes where user_id = auth.uid() and used = false;
$$;

revoke all on function public.generate_mfa_backup_codes() from public;
revoke all on function public.redeem_mfa_backup_code(text) from public;
revoke all on function public.count_unused_mfa_backup_codes() from public;
grant execute on function public.generate_mfa_backup_codes() to authenticated;
grant execute on function public.redeem_mfa_backup_code(text) to authenticated;
grant execute on function public.count_unused_mfa_backup_codes() to authenticated;
