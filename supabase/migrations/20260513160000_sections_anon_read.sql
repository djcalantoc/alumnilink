-- Allow anonymous visitors to read sections for public active schools.
-- Mirrors the equivalent policy on public.batches so the join-flow
-- batch/section picker works before authentication.

create policy sections_select_anon_public
  on public.sections
  for select
  to anon
  using (
    exists (
      select 1
      from public.schools s
      where s.id = sections.school_id
        and s.status  = 'active'
        and s.visibility = 'public'
    )
  );
