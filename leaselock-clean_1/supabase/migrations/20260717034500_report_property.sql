-- Store public-record property facts (beds/baths/sqft/year) with each report.

alter table public.shared_reports
  add column if not exists property jsonb;

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
    'property', r.property,
    'locked_at', r.locked_at,
    'landlord_name', r.landlord_name,
    'landlord_signed_at', r.landlord_signed_at
  )
  from public.shared_reports r
  where r.token = p_token;
$$;
