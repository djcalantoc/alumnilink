-- school_admins policies referenced the same table inside EXISTS checks, which
-- re-applied RLS and caused: "infinite recursion detected in policy for relation school_admins".
-- Helpers run as SECURITY DEFINER so the membership check does not recurse.

create or replace function public.school_admin_can_view_peers(
  p_school_id uuid,
  p_user_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.school_admins sa
    where sa.school_id = p_school_id
      and sa.user_id = p_user_id
      and sa.status = 'approved'
  );
$$;

create or replace function public.school_admin_can_manage_staff(
  p_school_id uuid,
  p_user_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.school_admins sa
    where sa.school_id = p_school_id
      and sa.user_id = p_user_id
      and sa.status = 'approved'
      and sa.role in ('owner', 'admin')
  );
$$;

comment on function public.school_admin_can_view_peers(uuid, uuid) is
  'RLS helper: approved school_admins row for school (any role). SECURITY DEFINER to avoid policy recursion.';

comment on function public.school_admin_can_manage_staff(uuid, uuid) is
  'RLS helper: approved owner/admin for school. SECURITY DEFINER to avoid policy recursion.';

grant execute on function public.school_admin_can_view_peers(uuid, uuid) to authenticated;
grant execute on function public.school_admin_can_manage_staff(uuid, uuid) to authenticated;

drop policy if exists school_admins_select_visible on public.school_admins;
drop policy if exists school_admins_insert_by_admin on public.school_admins;
drop policy if exists school_admins_update_by_admin on public.school_admins;

create policy school_admins_select_visible
  on public.school_admins
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.school_admin_can_view_peers(school_admins.school_id, auth.uid())
  );

create policy school_admins_insert_by_admin
  on public.school_admins
  for insert
  to authenticated
  with check (
    public.school_admin_can_manage_staff(school_admins.school_id, auth.uid())
  );

create policy school_admins_update_by_admin
  on public.school_admins
  for update
  to authenticated
  using (
    public.school_admin_can_manage_staff(school_admins.school_id, auth.uid())
  )
  with check (
    public.school_admin_can_manage_staff(school_admins.school_id, auth.uid())
  );
