-- Event board: alumni can read peer responses (for counts) on published school events;
-- super admins can manage all events.

-- ---------------------------------------------------------------------------
-- event_responses: approved alumni at the same school can read responses
-- (UI shows aggregate counts only; row-level access enables counting).
-- ---------------------------------------------------------------------------
drop policy if exists event_responses_select on public.event_responses;

create policy event_responses_select
  on public.event_responses
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.events e
      where e.id = event_responses.event_id
        and exists (
          select 1
          from public.school_admins sa
          where sa.school_id = e.school_id
            and sa.user_id = auth.uid()
            and sa.status = 'approved'
            and sa.role in ('owner', 'admin', 'moderator')
        )
    )
    or exists (
      select 1
      from public.events e
      join public.alumni_profiles ap
        on ap.school_id = e.school_id
        and ap.user_id = auth.uid()
        and ap.status = 'approved'
      where e.id = event_responses.event_id
        and e.status in ('published', 'cancelled', 'completed')
    )
  );

-- ---------------------------------------------------------------------------
-- Super admin: full access to events
-- ---------------------------------------------------------------------------
create policy events_select_super_admin
  on public.events
  for select
  to authenticated
  using (public.is_super_admin());

create policy events_insert_super_admin
  on public.events
  for insert
  to authenticated
  with check (public.is_super_admin());

create policy events_update_super_admin
  on public.events
  for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy events_delete_super_admin
  on public.events
  for delete
  to authenticated
  using (public.is_super_admin());
