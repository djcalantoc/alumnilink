-- Allow anonymous visitors to read batches for active public schools (landing picker + join discovery).
create policy batches_select_public_landing_anon
  on public.batches
  for select
  to anon
  using (
    exists (
      select 1
      from public.schools s
      where s.id = batches.school_id
        and s.status = 'active'
        and s.visibility = 'public'
    )
  );
