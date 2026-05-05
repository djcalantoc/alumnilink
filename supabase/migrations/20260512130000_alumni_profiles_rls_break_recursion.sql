-- alumni_profiles_select used EXISTS (SELECT ... FROM alumni_profiles me ...), which
-- re-applied RLS on alumni_profiles and caused infinite recursion.

create or replace function public.alumni_has_approved_profile_at_school(
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
    from public.alumni_profiles ap
    where ap.school_id = p_school_id
      and ap.user_id = p_user_id
      and ap.status = 'approved'
  );
$$;

comment on function public.alumni_has_approved_profile_at_school(uuid, uuid) is
  'RLS helper: viewer has an approved alumni profile at school. SECURITY DEFINER to avoid alumni_profiles policy recursion.';

grant execute on function public.alumni_has_approved_profile_at_school(uuid, uuid) to authenticated;

drop policy if exists alumni_profiles_select on public.alumni_profiles;

create policy alumni_profiles_select
  on public.alumni_profiles
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or (
      status = 'approved'
      and is_profile_public = true
      and public.alumni_has_approved_profile_at_school(alumni_profiles.school_id, auth.uid())
    )
    or exists (
      select 1
      from public.school_admins sa
      where sa.school_id = alumni_profiles.school_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
    )
  );
