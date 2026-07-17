-- Public bucket for photos attached to shared (landlord-signed) reports.
-- Objects live under an unguessable per-report UUID folder, so knowing a
-- photo URL is equivalent to holding the report's signing link.

insert into storage.buckets (id, name, public)
values ('report-photos', 'report-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "report photos insert" on storage.objects;
create policy "report photos insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'report-photos');

drop policy if exists "report photos owner delete" on storage.objects;
create policy "report photos owner delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'report-photos' and owner = auth.uid());
