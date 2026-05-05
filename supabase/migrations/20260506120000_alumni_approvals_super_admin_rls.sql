-- Super admins can read and update all alumni profiles (approvals, support).

create policy alumni_profiles_select_super_admin
  on public.alumni_profiles
  for select
  to authenticated
  using (public.is_super_admin());

create policy alumni_profiles_update_super_admin
  on public.alumni_profiles
  for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());
