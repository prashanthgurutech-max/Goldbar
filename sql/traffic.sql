-- GoldRadar traffic counter. Paste into Supabase > SQL Editor > Run.
-- Names start with gr_ so they do not clash with your other apps in the same project.
create table if not exists gr_events (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('visit','click','select')),
  visitor text not null,            -- random id kept in the visitor's browser, no name, email or IP
  store text, weight int, karat int, device text, referrer text
);
create index if not exists gr_events_created on gr_events (created_at);
create table if not exists gr_admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table gr_events enable row level security;   -- no policies: nobody can read or write the table directly
alter table gr_admins enable row level security;

create or replace function gr_track(p_kind text, p_visitor text, p_store text default null, p_weight int default null,
                                    p_karat int default null, p_device text default null, p_ref text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_kind not in ('visit','click','select') or coalesce(length(p_visitor),0) not between 8 and 64 then return; end if;
  insert into gr_events (kind, visitor, store, weight, karat, device, referrer)
  values (p_kind, p_visitor, left(p_store,30),
          case when p_weight between 1 and 20 then p_weight end,
          case when p_karat in (14,18,22,24) then p_karat end,
          case when p_device in ('mobile','tablet','desktop') then p_device end,
          left(p_ref,80));
end $$;
grant execute on function gr_track(text,text,text,int,int,text,text) to anon, authenticated;

create or replace function gr_is_admin() returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from gr_admins where user_id = auth.uid())
$$;
grant execute on function gr_is_admin() to authenticated;

create or replace function gr_admin_stats() returns json language plpgsql security definer set search_path = public as $$
declare tz text := 'Asia/Kolkata'; today date := (now() at time zone 'Asia/Kolkata')::date; res json;
begin
  if not gr_is_admin() then raise exception 'not allowed'; end if;
  with e as (select *, (created_at at time zone 'Asia/Kolkata')::date as d from gr_events)
  select json_build_object(
    'totals', json_build_object(
      'today', (select json_build_object('visits', count(*) filter (where kind='visit'), 'uniques', count(distinct visitor) filter (where kind='visit')) from e where d = today),
      'week',  (select json_build_object('visits', count(*) filter (where kind='visit'), 'uniques', count(distinct visitor) filter (where kind='visit')) from e where d >= today-6),
      'month', (select json_build_object('visits', count(*) filter (where kind='visit'), 'uniques', count(distinct visitor) filter (where kind='visit')) from e where d >= today-29),
      'all',   (select json_build_object('visits', count(*) filter (where kind='visit'), 'uniques', count(distinct visitor) filter (where kind='visit')) from e)),
    'daily', (select coalesce(json_agg(x order by x.k), '[]'::json) from (
        select g::date::text as k, count(e.id) filter (where e.kind='visit') as visits, count(distinct e.visitor) filter (where e.kind='visit') as uniques
        from generate_series((today-29)::timestamp, today::timestamp, interval '1 day') g left join e on e.d = g::date group by g) x),
    'weekly', (select coalesce(json_agg(x order by x.k), '[]'::json) from (
        select g::date::text as k, count(e.id) filter (where e.kind='visit') as visits, count(distinct e.visitor) filter (where e.kind='visit') as uniques
        from generate_series(date_trunc('week', today::timestamp) - interval '11 weeks', date_trunc('week', today::timestamp), interval '1 week') g
        left join e on date_trunc('week', e.d::timestamp) = g group by g) x),
    'monthly', (select coalesce(json_agg(x order by x.k), '[]'::json) from (
        select to_char(g,'YYYY-MM') as k, count(e.id) filter (where e.kind='visit') as visits, count(distinct e.visitor) filter (where e.kind='visit') as uniques
        from generate_series(date_trunc('month', today::timestamp) - interval '11 months', date_trunc('month', today::timestamp), interval '1 month') g
        left join e on date_trunc('month', e.d::timestamp) = g group by g) x),
    'clicks',   (select coalesce(json_agg(x), '[]'::json) from (select store as k, count(*) as n from e where kind='click' and d >= today-29 group by store order by n desc) x),
    'weights',  (select coalesce(json_agg(x), '[]'::json) from (select weight::text as k, count(*) as n from e where kind='select' and weight is not null and d >= today-29 group by weight order by n desc limit 10) x),
    'karats',   (select coalesce(json_agg(x), '[]'::json) from (select karat::text || 'K' as k, count(*) as n from e where kind='select' and karat is not null and d >= today-29 group by karat order by n desc) x),
    'devices',  (select coalesce(json_agg(x), '[]'::json) from (select coalesce(device,'unknown') as k, count(*) as n from e where kind='visit' and d >= today-29 group by 1 order by n desc) x),
    'referrers',(select coalesce(json_agg(x), '[]'::json) from (select coalesce(referrer,'direct') as k, count(*) as n from e where kind='visit' and d >= today-29 group by 1 order by n desc limit 10) x)
  ) into res;
  return res;
end $$;
grant execute on function gr_admin_stats() to authenticated;

-- Make yourself the admin (change the email to the one you sign in with, then run this line):
-- insert into gr_admins (user_id) select id from auth.users where email = 'YOUR_EMAIL_HERE' on conflict do nothing;
