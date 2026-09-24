-- Waitlist for SquadArc (pre-launch). Writes go through the Next.js server action
-- using the service role key, so RLS is enabled with no public policies.

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  country text not null,             -- ISO 3166-1 alpha-2, e.g. 'US'
  city text not null,
  ref_code text not null unique,
  referred_by text references public.waitlist(ref_code) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists waitlist_email_lower_idx on public.waitlist (lower(email));
create index if not exists waitlist_city_idx on public.waitlist (country, city);
create index if not exists waitlist_referred_by_idx on public.waitlist (referred_by);

alter table public.waitlist enable row level security;

-- Aggregate stats for the landing page (total + top cities).
create or replace function public.waitlist_stats(city_limit int default 5)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'total', (select count(*) from waitlist),
    'cities', coalesce((
      select json_agg(c) from (
        select city, country, count(*)::int as count
        from waitlist
        group by country, city
        order by count(*) desc, city
        limit city_limit
      ) c
    ), '[]'::json)
  );
$$;

-- Position in line + how many people a code has brought in.
create or replace function public.waitlist_entry(code text)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'position', (select count(*) from waitlist w2 where w2.created_at <= w.created_at),
    'ref_code', w.ref_code,
    'city', w.city,
    'country', w.country,
    'city_count', (select count(*) from waitlist w3 where w3.city = w.city and w3.country = w.country),
    'referrals', (select count(*) from waitlist w4 where w4.referred_by = w.ref_code)
  )
  from waitlist w
  where w.ref_code = code;
$$;

revoke all on function public.waitlist_stats(int) from public, anon, authenticated;
revoke all on function public.waitlist_entry(text) from public, anon, authenticated;
