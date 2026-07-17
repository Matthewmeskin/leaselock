-- Product analytics events + expanded admin metrics (funnel, fake door,
-- email capture, A/B variants).

create table if not exists public.events (
  id         bigint generated always as identity primary key,
  session_id text not null,
  user_id    uuid,
  name       text not null,
  variant    text,
  path       text,
  props      jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists events_name_idx on public.events (name, created_at);
create index if not exists events_session_idx on public.events (session_id);

alter table public.events enable row level security;

-- Visitors (logged in or not) can only append events. No select policy:
-- reads happen exclusively through the admin-gated RPC below.
drop policy if exists events_insert_all on public.events;
create policy events_insert_all on public.events
  for insert to anon, authenticated with check (true);

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
      'lease_reviews',        (select count(*) from public.lease_reviews),
      'move_in_reports',      (select count(*) from public.shared_reports),
      'signed_reports',       (select count(*) from public.shared_reports where landlord_signed_at is not null),
      'documents',            (select count(*) from public.documents)
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

    'analytics', jsonb_build_object(
      'movein_funnel', (
        select jsonb_build_object(
          'view',     count(distinct session_id) filter (where name = 'movein_view'),
          'start',    count(distinct session_id) filter (where name = 'movein_start'),
          'review',   count(distinct session_id) filter (where name = 'movein_review'),
          'generate', count(distinct session_id) filter (where name = 'movein_generate'),
          'locked',   count(distinct session_id) filter (where name = 'movein_locked')
        )
        from public.events
        where created_at > now() - interval '30 days'
      ),
      'avg_completion_seconds', (
        select round(avg((props->>'seconds')::numeric))
        from public.events
        where name = 'movein_locked' and props ? 'seconds'
          and (props->>'seconds')::numeric between 1 and 86400
          and created_at > now() - interval '30 days'
      ),
      'fake_door', (
        select coalesce(jsonb_object_agg(placement, n), '{}'::jsonb)
        from (
          select coalesce(props->>'placement', 'unknown') as placement, count(distinct session_id) as n
          from public.events
          where name = 'fake_door_click' and created_at > now() - interval '30 days'
          group by 1
        ) t
      ),
      'email_captures_total', (select count(*) from public.events where name = 'email_capture'),
      'variants', (
        select coalesce(jsonb_agg(row order by row->>'variant'), '[]'::jsonb)
        from (
          select jsonb_build_object(
            'variant', variant,
            'landing_views', count(distinct session_id) filter (where name = 'landing_view'),
            'cta_clicks',    count(distinct session_id) filter (where name = 'cta_click'),
            'email_captures',count(distinct session_id) filter (where name = 'email_capture'),
            'signups',       count(distinct session_id) filter (where name = 'signup_created')
          ) as row
          from public.events
          where variant is not null and created_at > now() - interval '30 days'
          group by variant
        ) t
      ),
      'recent_emails', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'email', e.props->>'email', 'variant', e.variant, 'at', e.created_at
        ) order by e.created_at desc), '[]'::jsonb)
        from (
          select props, variant, created_at from public.events
          where name = 'email_capture' order by created_at desc limit 25
        ) e
      )
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
