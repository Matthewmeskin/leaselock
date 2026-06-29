-- Fix: join_household failed with "column reference id is ambiguous"
-- because RETURNS TABLE (id, name) shadows profiles.id in the UPDATE.
-- Run once in Supabase → SQL Editor.

create or replace function public.join_household(p_code text)
returns table (id uuid, name text)
language plpgsql security definer set search_path = public
as $$
declare hid uuid; hname text;
begin
  select h.id, h.name into hid, hname
  from public.households h
  where h.invite_code = p_code;

  if hid is null then
    raise exception 'Invalid invite code';
  end if;

  insert into public.household_members (household_id, user_id, role)
    values (hid, auth.uid(), 'member')
    on conflict (household_id, user_id) do nothing;

  update public.profiles p
  set household_id = hid
  where p.id = auth.uid();

  return query select hid, hname;
end;
$$;
