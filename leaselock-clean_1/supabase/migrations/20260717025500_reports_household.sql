-- Make saved move-in reports visible to the whole household (Documents tab).

alter table public.shared_reports
  add column if not exists household_id uuid references public.households (id);

-- Backfill existing reports from the creator's household.
update public.shared_reports r
set household_id = p.household_id
from public.profiles p
where p.id = r.created_by and r.household_id is null;

drop policy if exists shared_reports_household_read on public.shared_reports;
create policy shared_reports_household_read on public.shared_reports
  for select using (household_id is not null and public.is_household_member(household_id));
