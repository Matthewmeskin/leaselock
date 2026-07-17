-- Household documents: uploaded lease PDFs and move-in photos persist in
-- storage and are visible to everyone on the shared lease.

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists documents_read on storage.objects;
create policy documents_read on storage.objects
  for select to authenticated
  using (bucket_id = 'documents' and public.is_household_member((split_part(name, '/', 1))::uuid));

drop policy if exists documents_insert on storage.objects;
create policy documents_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents' and public.is_household_member((split_part(name, '/', 1))::uuid));

drop policy if exists documents_delete on storage.objects;
create policy documents_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'documents' and public.is_household_member((split_part(name, '/', 1))::uuid));

create table if not exists public.documents (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households (id) on delete cascade,
  uploaded_by   uuid references auth.users (id) on delete set null,
  name          text not null,
  kind          text not null default 'file',   -- lease | photo | file
  context       text,                            -- e.g. room name or "Lease review"
  storage_path  text not null,
  size_bytes    bigint,
  created_at    timestamptz not null default now()
);
create index if not exists documents_hh_idx on public.documents (household_id);

alter table public.documents enable row level security;

drop policy if exists documents_hh on public.documents;
create policy documents_hh on public.documents
  for all using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
