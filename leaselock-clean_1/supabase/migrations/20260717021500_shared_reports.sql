-- Shared move-in reports: a tokenized link the landlord can open to review
-- and sign the locked report. Access for landlords goes through
-- security-definer RPCs keyed by the unguessable token, never direct selects.

create table if not exists public.shared_reports (
  id                 uuid primary key default gen_random_uuid(),
  token              text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 20),
  created_by         uuid not null references auth.users (id) on delete cascade,
  unit_address       text,
  tenant_name        text,
  report_text        text not null,
  rooms              jsonb not null default '[]'::jsonb,
  locked_at          timestamptz not null default now(),
  landlord_name      text,
  landlord_signed_at timestamptz,
  created_at         timestamptz not null default now()
);
create index if not exists shared_reports_owner_idx on public.shared_reports (created_by);

alter table public.shared_reports enable row level security;

drop policy if exists shared_reports_own on public.shared_reports;
create policy shared_reports_own on public.shared_reports
  for all using (auth.uid() = created_by) with check (auth.uid() = created_by);

-- Landlord-facing read, keyed by token only.
create or replace function public.get_shared_report(p_token text)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'unit_address', r.unit_address,
    'tenant_name', r.tenant_name,
    'report_text', r.report_text,
    'rooms', r.rooms,
    'locked_at', r.locked_at,
    'landlord_name', r.landlord_name,
    'landlord_signed_at', r.landlord_signed_at
  )
  from public.shared_reports r
  where r.token = p_token;
$$;

-- Landlord signs by typing their name. One signature, immutable.
create or replace function public.sign_shared_report(p_token text, p_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare rec public.shared_reports;
begin
  select * into rec from public.shared_reports where token = p_token;
  if rec.id is null then
    raise exception 'Report not found';
  end if;
  if rec.landlord_signed_at is not null then
    raise exception 'This report has already been signed';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Please enter your full name';
  end if;

  update public.shared_reports
  set landlord_name = trim(p_name), landlord_signed_at = now()
  where id = rec.id;

  return jsonb_build_object('landlord_name', trim(p_name), 'landlord_signed_at', now());
end;
$$;

grant execute on function public.get_shared_report(text) to anon, authenticated;
grant execute on function public.sign_shared_report(text, text) to anon, authenticated;
