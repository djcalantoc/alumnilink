-- Allow school admins / owners to see basic user info (email, full_name)
-- for alumni profiles at their school. Uses SECURITY DEFINER to safely
-- check alumni_profiles + school_admins without triggering RLS recursion.

create or replace function public.school_admin_can_view_user(
  p_target_user_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.alumni_profiles ap
    join public.school_admins sa on sa.school_id = ap.school_id
    where ap.user_id = p_target_user_id
      and sa.user_id = auth.uid()
      and sa.status = 'approved'
  );
$$;

comment on function public.school_admin_can_view_user(uuid) is
  'RLS helper: true if auth.uid() is an approved admin for any school the target user has an alumni profile in. SECURITY DEFINER to avoid RLS recursion.';

grant execute on function public.school_admin_can_view_user(uuid) to authenticated;

-- Replace the single-row policy with one that also covers school-admin access.
drop policy if exists users_select_own on public.users;

create policy users_select_own
  on public.users
  for select
  to authenticated
  using (
    id = auth.uid()
    or public.school_admin_can_view_user(users.id)
  );
