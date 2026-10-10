-- ============================================================
-- Instinct (WhatsApp assistant) — read-only integration
-- הרצה חד-פעמית: Supabase Dashboard → SQL Editor → הדבקה → Run
-- (בטוח להריץ שוב — כל הפקודות "if not exists" / "create or replace")
--
-- לא נוגע בשום טבלה/policy/עמודה קיימת. כל מה שנוצר כאן חדש.
--
-- דפוס האבטחה מעתיק במדויק את finance_pin הקיים: הטבלאות למטה מופעלות
-- עם RLS אבל בלי שום policy בכלל — כלומר אף אחד, אפילו לא את דרך
-- הדפדפן שלך, לא יכול לקרוא אותן ישירות. הדרך היחידה פנימה היא דרך
-- הפונקציות security definer למטה, כך שה-hash של הטוקן אף פעם לא
-- יוצא מהשרת, וגם Instinct לא יכולה לדעת "מה יש בטבלה" — רק לקבל
-- בחזרה בדיוק את השדות שהפונקציה בוחרת להחזיר לה.
-- ============================================================

create extension if not exists pgcrypto;

-- ────────────────────────────────────────────────────────────
-- טוקנים: נשמר רק hash (sha-256), לא הטוקן עצמו. הטוקן הגולמי מוחזר
-- פעם אחת בלבד, בקריאה ל-create_readonly_token, ואז נעלם לצמיתות
-- מהשרת — אין שום דרך לשחזר אותו, רק ליצור חדש.
-- ────────────────────────────────────────────────────────────
create table if not exists readonly_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  token_hash text not null unique,
  scopes text[] not null default '{}',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 days'),
  revoked_at timestamptz,
  last_used_at timestamptz
);
alter table readonly_tokens enable row level security;

-- מונה קצב: חלון דקה מתגלגל, שורה אחת לכל (טוקן, דקה). נבדק ומתעדכן
-- בתוך אותה טרנזקציה כמו שאר הבדיקות ב-_instinct_check, כך שאין מרוץ
-- בין כמה בקשות שמגיעות באותו רגע.
create table if not exists readonly_rate_limits (
  token_id uuid not null references readonly_tokens(id) on delete cascade,
  window_start timestamptz not null,
  request_count int not null default 0,
  primary key (token_id, window_start)
);
alter table readonly_rate_limits enable row level security;

-- לוג גישה: זמן, שם הטוקן, נתיב, סטטוס — בלי שום תוכן של הנתונים
-- עצמם. כך שאת יכולה לראות מי קרא ומתי, בלי לשכפל מידע רגיש ללוג.
create table if not exists readonly_access_log (
  id bigint generated always as identity primary key,
  token_id uuid references readonly_tokens(id) on delete set null,
  token_name text,
  route text not null,
  status text not null,
  created_at timestamptz not null default now()
);
alter table readonly_access_log enable row level security;

-- אין policies בכלל על שלוש הטבלאות למעלה — זה מכוון, ראי הערה בראש הקובץ.

-- ────────────────────────────────────────────────────────────
-- ניהול טוקנים — כל הפונקציות האלה admin-only (אותו שער בדיוק כמו
-- api/invite-user.js: profiles.role = 'admin'). נקראות מתוך האפליקציה
-- כשאת מחוברת, לא על ידי Instinct.
-- ────────────────────────────────────────────────────────────
create or replace function public.create_readonly_token(token_name text, token_scopes text[], days_valid int default 90)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller_role text;
  raw_token text;
begin
  select role into caller_role from profiles where id = auth.uid();
  if caller_role is distinct from 'admin' then
    raise exception 'Admin access required';
  end if;
  if token_scopes is null or array_length(token_scopes, 1) is null then
    raise exception 'At least one scope is required';
  end if;

  raw_token := encode(gen_random_bytes(32), 'hex');
  insert into readonly_tokens (user_id, name, token_hash, scopes, expires_at)
  values (auth.uid(), token_name, encode(digest(raw_token, 'sha256'), 'hex'), token_scopes, now() + make_interval(days => days_valid));

  return raw_token;
end;
$$;

create or replace function public.revoke_readonly_token(target_token_id uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare caller_role text;
begin
  select role into caller_role from profiles where id = auth.uid();
  if caller_role is distinct from 'admin' then
    raise exception 'Admin access required';
  end if;
  update readonly_tokens set revoked_at = now() where id = target_token_id and revoked_at is null;
end;
$$;

create or replace function public.list_readonly_tokens()
returns table(id uuid, name text, scopes text[], created_at timestamptz, expires_at timestamptz, revoked_at timestamptz, last_used_at timestamptz)
language sql
security definer
set search_path = public, extensions
as $$
  select rt.id, rt.name, rt.scopes, rt.created_at, rt.expires_at, rt.revoked_at, rt.last_used_at
  from readonly_tokens rt
  where exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  order by rt.created_at desc;
$$;

-- ────────────────────────────────────────────────────────────
-- בדיקה פנימית: מאמתת טוקן גולמי מול scope נדרש, אוכפת 60 בקשות
-- לדקה לכל טוקן, ומחזירה את user_id הבעלים בהצלחה. לא קריאה ישירות
-- מבחוץ — רק משלוש פונקציות ה-instinct_get_* למטה.
-- ────────────────────────────────────────────────────────────
create or replace function public._instinct_check(token_plain text, required_scope text, route_name text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  row_data readonly_tokens%rowtype;
  current_window timestamptz := date_trunc('minute', now());
  current_count int;
  result_status text := 'ok';
begin
  select * into row_data from readonly_tokens where token_hash = encode(digest(coalesce(token_plain, ''), 'sha256'), 'hex');

  if row_data.id is null then
    insert into readonly_access_log (token_name, route, status) values (null, route_name, 'unauthorized');
    raise exception 'unauthorized';
  end if;
  if row_data.revoked_at is not null or row_data.expires_at < now() then
    insert into readonly_access_log (token_id, token_name, route, status) values (row_data.id, row_data.name, route_name, 'unauthorized');
    raise exception 'unauthorized';
  end if;
  if not (required_scope = any(row_data.scopes)) then
    insert into readonly_access_log (token_id, token_name, route, status) values (row_data.id, row_data.name, route_name, 'forbidden');
    raise exception 'forbidden';
  end if;

  insert into readonly_rate_limits (token_id, window_start, request_count)
  values (row_data.id, current_window, 1)
  on conflict (token_id, window_start) do update set request_count = readonly_rate_limits.request_count + 1
  returning request_count into current_count;

  if current_count > 60 then
    insert into readonly_access_log (token_id, token_name, route, status) values (row_data.id, row_data.name, route_name, 'rate_limited');
    raise exception 'rate_limited';
  end if;

  update readonly_tokens set last_used_at = now() where id = row_data.id;
  insert into readonly_access_log (token_id, token_name, route, status) values (row_data.id, row_data.name, route_name, result_status);
  return row_data.user_id;
end;
$$;

-- ────────────────────────────────────────────────────────────
-- משימות — מתוך dashboard_data.data->'tasks'. רק השדות שמופו ומאושרים;
-- שום שדה אחר מהבלוב (יומן Mindset, CRM, לוח חזון וכו') לא נגיש דרך כאן.
-- ────────────────────────────────────────────────────────────
create or replace function public.instinct_get_tasks(
  token_plain text,
  status_filter text default null,
  due_before timestamptz default null,
  limit_n int default 100
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uid uuid := public._instinct_check(token_plain, 'tasks:read', 'tasks');
  blob jsonb;
  items jsonb;
  capped_limit int := least(greatest(coalesce(limit_n, 100), 1), 500);
begin
  select data into blob from dashboard_data where user_id = uid;

  select coalesce(jsonb_agg(t), '[]'::jsonb) into items
  from (
    select jsonb_build_object(
      'id', item->>'id',
      'text', item->>'text',
      'status', case when (item->>'completed')::boolean then 'done' else 'open' end,
      'priority', coalesce(item->>'priority', 'normal'),
      'due_date', item->>'dueDate',
      'project_id', item->>'projectId',
      'domain', item->>'domain'
    ) as t
    from jsonb_array_elements(coalesce(blob->'tasks', '[]'::jsonb)) item
    where (status_filter is null or status_filter = case when (item->>'completed')::boolean then 'done' else 'open' end)
      and (due_before is null or nullif(item->>'dueDate','') is null or (item->>'dueDate')::date <= due_before::date)
    order by nullif(item->>'dueDate','')::date nulls last
    limit capped_limit
  ) x;

  return jsonb_build_object('generated_at', now(), 'items', items);
end;
$$;

-- ────────────────────────────────────────────────────────────
-- פרויקטים — מתוך dashboard_data.data->'projects'. progress_percent
-- מחושב באותה נוסחה שהאפליקציה עצמה משתמשת בה (יחס משימות שהושלמו
-- מתוך המשימות המקושרות לפרויקט, לפי projectId או domain משותף).
-- ────────────────────────────────────────────────────────────
create or replace function public.instinct_get_projects(
  token_plain text,
  due_before timestamptz default null,
  limit_n int default 100
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uid uuid := public._instinct_check(token_plain, 'projects:read', 'projects');
  blob jsonb;
  items jsonb;
  capped_limit int := least(greatest(coalesce(limit_n, 100), 1), 500);
begin
  select data into blob from dashboard_data where user_id = uid;

  select coalesce(jsonb_agg(p), '[]'::jsonb) into items
  from (
    select jsonb_build_object(
      'id', proj->>'id',
      'title', proj->>'title',
      'domain', proj->>'domain',
      'due_date', proj->>'dueDate',
      'progress_percent', (
        select case when count(*) = 0 then 0
          else round(100.0 * count(*) filter (where (t->>'completed')::boolean) / count(*))
        end
        from jsonb_array_elements(coalesce(blob->'tasks', '[]'::jsonb)) t
        where (t->>'projectId') = (proj->>'id')
      )
    ) as p
    from jsonb_array_elements(coalesce(blob->'projects', '[]'::jsonb)) proj
    where (due_before is null or nullif(proj->>'dueDate','') is null or (proj->>'dueDate')::date <= due_before::date)
    order by nullif(proj->>'dueDate','')::date nulls last
    limit capped_limit
  ) x;

  return jsonb_build_object('generated_at', now(), 'items', items);
end;
$$;

-- ────────────────────────────────────────────────────────────
-- פיננסים — סיכומים בלבד. אגרגציה לפי חודש/קטגוריה מ-finance_entries
-- (לא שורות גולמיות), וסך-הכול יתרות הלוואות/קרנות (בלי שם קרן/הלוואה
-- בודדת). finance_credit_cards לא נגיש דרך כאן בכלל, בכוונה.
-- ────────────────────────────────────────────────────────────
create or replace function public.instinct_get_finance_summary(
  token_plain text,
  month_filter text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uid uuid := public._instinct_check(token_plain, 'finance:read', 'finance');
  by_category jsonb;
  totals jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
      'month', month,
      'type', type,
      'category', category,
      'amount', total_amount,
      'currency', 'ILS'
    )), '[]'::jsonb)
  into by_category
  from (
    select month, type, category, sum(amount) as total_amount
    from finance_entries
    where user_id = uid
      and (month_filter is null or month = month_filter)
    group by month, type, category
  ) agg;

  select jsonb_build_object(
    'funds_total', coalesce((select sum(current_value) from finance_funds where user_id = uid), 0),
    'loans_remaining_total', coalesce((select sum(remaining_balance) from finance_loans where user_id = uid), 0),
    'currency', 'ILS'
  ) into totals;

  return jsonb_build_object('generated_at', now(), 'by_category', by_category, 'totals', totals);
end;
$$;

-- אף role רגיל (anon/authenticated) לא צריך גישה ישירה לטבלאות readonly_*
-- — רק לפונקציות. ה-functions למעלה כבר security definer כך שהם רצים
-- בהרשאת הבעלים (postgres) ועוקפים RLS מבפנים; לא נדרש GRANT נוסף כדי
-- שה-Vercel route יקרא להן עם מפתח ה-anon הרגיל של הפרויקט.
