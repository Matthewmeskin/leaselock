-- ============================================================
-- RenterReady — Shared lease / roommates (migration #2)
-- Run AFTER schema.sql, in Supabase → SQL Editor.
-- Idempotent and safe to re-run.
--
-- Adds: households + members, an invite-code join flow, and moves the
-- shared toolkit data (calendar, maintenance, rent, roommate agreement,
-- lease review) from per-user to per-household, scoped by membership.
-- ============================================================

-- ---------- households ----------
create table if not exists public.households (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'My lease',
  invite_code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  role         text not null default 'member',
  joined_at    timestamptz not null default now(),
  primary key (household_id, user_id)
);
create index if not exists household_members_user_idx on public.household_members (user_id);

-- FK to profiles so PostgREST can embed member names/avatars
do $$ begin
  alter table public.household_members
    add constraint household_members_profile_fk
    foreign key (user_id) references public.profiles (id) on delete cascade;
exception when duplicate_object then null; end $$;

-- ---------- profiles.household_id (the user's active lease) ----------
alter table public.profiles add column if not exists household_id uuid references public.households (id);

-- ---------- household_id on the shared toolkit tables ----------
alter table public.calendar_events     add column if not exists household_id uuid references public.households (id) on delete cascade;
alter table public.maintenance_issues  add column if not exists household_id uuid references public.households (id) on delete cascade;
alter table public.rent_payments        add column if not exists household_id uuid references public.households (id) on delete cascade;
alter table public.roommate_agreements add column if not exists household_id uuid references public.households (id) on delete cascade;

create index if not exists calendar_events_hh_idx    on public.calendar_events (household_id);
create index if not exists maintenance_issues_hh_idx on public.maintenance_issues (household_id);
create index if not exists rent_payments_hh_idx       on public.rent_payments (household_id);

-- ---------- shared lease review (latest per household) ----------
create table if not exists public.lease_reviews (
  household_id uuid primary key references public.households (id) on delete cascade,
  data         jsonb not null,
  reviewed_at  timestamptz not null default now(),
  created_by   uuid references auth.users (id) on delete set null
);

-- ============================================================
-- Membership check (SECURITY DEFINER so RLS policies that reference
-- household_members don't recurse).
-- ============================================================
create or replace function public.is_household_member(hid uuid)
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.household_members m
    where m.household_id = hid and m.user_id = auth.uid()
  );
$$;

-- True if the caller shares any household with the given user (used so
-- roommates can read each other's basic profile).
create or replace function public.shares_household_with(other uuid)
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1
    from public.household_members m1
    join public.household_members m2 on m1.household_id = m2.household_id
    where m1.user_id = auth.uid() and m2.user_id = other
  );
$$;

-- ============================================================
-- Backfill: give every existing user a household, membership, and
-- move their existing rows into it.
-- ============================================================
do $$
declare r record; hid uuid;
begin
  for r in select id from public.profiles where household_id is null loop
    insert into public.households (name, created_by) values ('My lease', r.id) returning id into hid;
    insert into public.household_members (household_id, user_id, role) values (hid, r.id, 'owner');
    update public.profiles           set household_id = hid where id = r.id;
    update public.calendar_events     set household_id = hid where user_id = r.id and household_id is null;
    update public.maintenance_issues  set household_id = hid where user_id = r.id and household_id is null;
    update public.rent_payments        set household_id = hid where user_id = r.id and household_id is null;
    update public.roommate_agreements set household_id = hid where user_id = r.id and household_id is null;
  end loop;
end $$;

-- roommate agreement becomes one row per household (was one per user).
-- Must drop the PK on user_id BEFORE making user_id nullable.
do $$ begin
  alter table public.roommate_agreements drop constraint roommate_agreements_pkey;
exception when undefined_object then null; end $$;
alter table public.roommate_agreements alter column user_id drop not null;
create unique index if not exists roommate_agreements_hh_uniq on public.roommate_agreements (household_id);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.households        enable row level security;
alter table public.household_members enable row level security;
alter table public.lease_reviews     enable row level security;

drop policy if exists households_select on public.households;
create policy households_select on public.households
  for select using (public.is_household_member(id) or created_by = auth.uid());
drop policy if exists households_insert on public.households;
create policy households_insert on public.households
  for insert with check (created_by = auth.uid());
drop policy if exists households_update on public.households;
create policy households_update on public.households
  for update using (public.is_household_member(id));

drop policy if exists household_members_select on public.household_members;
create policy household_members_select on public.household_members
  for select using (public.is_household_member(household_id));
-- writes to household_members happen only through SECURITY DEFINER functions below

-- Let roommates read each other's basic profile (name/avatar). Replaces the
-- original "own row only" select policy from schema.sql.
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists profiles_select_household on public.profiles;
create policy profiles_select_household on public.profiles
  for select using (auth.uid() = id or public.shares_household_with(id));

drop policy if exists lease_reviews_all on public.lease_reviews;
create policy lease_reviews_all on public.lease_reviews
  for all using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

-- Replace the old per-user toolkit policies with household-scoped ones
drop policy if exists "calendar_all_own" on public.calendar_events;
drop policy if exists calendar_hh on public.calendar_events;
create policy calendar_hh on public.calendar_events
  for all using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

drop policy if exists "maintenance_all_own" on public.maintenance_issues;
drop policy if exists maintenance_hh on public.maintenance_issues;
create policy maintenance_hh on public.maintenance_issues
  for all using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

drop policy if exists "rent_all_own" on public.rent_payments;
drop policy if exists rent_hh on public.rent_payments;
create policy rent_hh on public.rent_payments
  for all using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

drop policy if exists "roommate_all_own" on public.roommate_agreements;
drop policy if exists roommate_hh on public.roommate_agreements;
create policy roommate_hh on public.roommate_agreements
  for all using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

-- ============================================================
-- Signup trigger: create a personal household for new users.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare hid uuid;
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do nothing;

  if (select household_id from public.profiles where id = new.id) is null then
    insert into public.households (name, created_by) values ('My lease', new.id) returning id into hid;
    insert into public.household_members (household_id, user_id, role) values (hid, new.id, 'owner');
    update public.profiles set household_id = hid where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Membership management functions (SECURITY DEFINER)
-- ============================================================

-- Join a lease by invite code; switches the caller's active household.
create or replace function public.join_household(p_code text)
returns table (id uuid, name text)
language plpgsql security definer set search_path = public
as $$
declare hid uuid; hname text;
begin
  select h.id, h.name into hid, hname from public.households h where h.invite_code = p_code;
  if hid is null then raise exception 'Invalid invite code'; end if;
  insert into public.household_members (household_id, user_id, role)
    values (hid, auth.uid(), 'member')
    on conflict (household_id, user_id) do nothing;
  update public.profiles p set household_id = hid where p.id = auth.uid();
  return query select hid, hname;
end;
$$;

-- Leave the current lease; spins up a fresh personal household.
create or replace function public.leave_household()
returns uuid
language plpgsql security definer set search_path = public
as $$
declare cur uuid; newh uuid;
begin
  select household_id into cur from public.profiles where id = auth.uid();
  delete from public.household_members where household_id = cur and user_id = auth.uid();
  insert into public.households (name, created_by) values ('My lease', auth.uid()) returning id into newh;
  insert into public.household_members (household_id, user_id, role) values (newh, auth.uid(), 'owner');
  update public.profiles set household_id = newh where id = auth.uid();
  return newh;
end;
$$;

create or replace function public.rename_household(p_name text)
returns void
language plpgsql security definer set search_path = public
as $$
declare cur uuid;
begin
  select household_id into cur from public.profiles where id = auth.uid();
  if not public.is_household_member(cur) then raise exception 'Not a member'; end if;
  update public.households set name = coalesce(nullif(trim(p_name), ''), name) where id = cur;
end;
$$;

create or replace function public.regenerate_invite_code()
returns text
language plpgsql security definer set search_path = public
as $$
declare cur uuid; code text;
begin
  select household_id into cur from public.profiles where id = auth.uid();
  if not public.is_household_member(cur) then raise exception 'Not a member'; end if;
  code := substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
  update public.households set invite_code = code where id = cur;
  return code;
end;
$$;
