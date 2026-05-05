-- Allow platform super admins to manage batches/sections for any school (matches schools policy).

create policy batches_super_admin_all
  on public.batches
  for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy sections_super_admin_all
  on public.sections
  for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());
