-- Admin metrics: allow-listed admin emails + a security-definer RPC that
-- returns app-wide usage aggregates for the /admin dashboard.

create table if not exists public.admin_emails (
  email      text primary key,
  created_at timestamptz not null default now()
);

-- No policies: RLS on with none means only definer functions can read it.
alter table public.admin_emails enable row level security;

insert into public.admin_emails (email)
values ('matthewmeskin35@gmail.com')
on conflict (email) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admin_emails a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.admin_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  select jsonb_build_object(
    'generated_at', now(),

    'totals', jsonb_build_object(
      'users',            (select count(*) from auth.users),
      'new_users_7d',     (select count(*) from auth.users where created_at > now() - interval '7 days'),
      'new_users_30d',    (select count(*) from auth.users where created_at > now() - interval '30 days'),
      'active_7d',        (select count(*) from auth.users where last_sign_in_at > now() - interval '7 days'),
      'active_30d',       (select count(*) from auth.users where last_sign_in_at > now() - interval '30 days'),
      'quiz_completed',   (select count(*) from public.profiles
                            where pets is not null and roommates is not null and cosigner is not null
                              and departure is not null and furnished is not null),
      'households',       (select count(*) from public.households),
      'shared_households',(select count(*) from (
                             select household_id from public.household_members
                             group by household_id having count(*) > 1
                           ) s)
    ),

    'features', jsonb_build_object(
      'calendar_events',      (select count(*) from public.calendar_events),
      'maintenance_issues',   (select count(*) from public.maintenance_issues),
      'rent_payments',        (select count(*) from public.rent_payments),
      'roommate_agreements',  (select count(*) from public.roommate_agreements where generated is not null),
      'lease_reviews',        (select count(*) from public.lease_reviews)
    ),

    'signups_by_day', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'count', coalesce(u.n, 0)) order by d.day), '[]'::jsonb)
      from generate_series(current_date - interval '29 days', current_date, interval '1 day') as d(day)
      left join (
        select created_at::date as day, count(*) as n
        from auth.users
        where created_at > current_date - interval '30 days'
        group by 1
      ) u on u.day = d.day::date
    ),

    'users', (
      select coalesce(jsonb_agg(row order by row ->> 'created_at' desc), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'name', coalesce(p.full_name, 'No name'),
          'email', u.email,
          'created_at', u.created_at,
          'last_sign_in_at', u.last_sign_in_at,
          'quiz_done', (p.pets is not null and p.roommates is not null and p.cosigner is not null
                        and p.departure is not null and p.furnished is not null),
          'shared_lease', exists (
            select 1 from public.household_members m
            where m.household_id = p.household_id
            group by m.household_id having count(*) > 1
          )
        ) as row
        from auth.users u
        left join public.profiles p on p.id = u.id
        order by u.created_at desc
        limit 100
      ) t
    )
  ) into result;

  return result;
end;
$$;

revoke execute on function public.admin_metrics() from public, anon;
grant execute on function public.admin_metrics() to authenticated;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
