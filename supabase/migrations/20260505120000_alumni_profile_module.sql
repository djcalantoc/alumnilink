-- Alumni profile fields, photo storage, join visibility for batches/sections,
-- and guards so alumni cannot self-approve.

-- ---------------------------------------------------------------------------
-- alumni_profiles: display + location + social (headline = short status line)
-- ---------------------------------------------------------------------------
alter table public.alumni_profiles add column if not exists display_name text;
alter table public.alumni_profiles add column if not exists photo_url text;
alter table public.alumni_profiles add column if not exists location_city text;
alter table public.alumni_profiles add column if not exists location_country text;
alter table public.alumni_profiles add column if not exists social_url text;

update public.alumni_profiles
set display_name = coalesce(display_name, '')
where display_name is null;

-- App will require non-empty display_name on write; keep nullable for legacy rows.

comment on column public.alumni_profiles.headline is 'Short status line shown on the profile.';
comment on column public.alumni_profiles.social_url is 'Single optional social/homepage link.';

-- ---------------------------------------------------------------------------
-- Trigger: inserts must be pending; alumni cannot change status except rejected→pending
-- ---------------------------------------------------------------------------
create or replace function public.alumni_profiles_guard_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  privileged boolean;
begin
  if tg_op = 'INSERT' then
    if new.status is distinct from 'pending' then
      raise exception 'New alumni profiles must start as pending';
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    privileged := public.is_super_admin()
      or exists (
        select 1
        from public.school_admins sa
        where sa.school_id = new.school_id
          and sa.user_id = auth.uid()
          and sa.status = 'approved'
          and sa.role in ('owner', 'admin', 'moderator')
      );

    if not privileged and new.user_id = auth.uid() then
      if new.status is distinct from old.status then
        if not (old.status = 'rejected' and new.status = 'pending') then
          raise exception 'You cannot change your approval status';
        end if;
      end if;
    end if;

    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists alumni_profiles_guard_status_trg on public.alumni_profiles;

create trigger alumni_profiles_guard_status_trg
  before insert or update on public.alumni_profiles
  for each row
  execute procedure public.alumni_profiles_guard_status();

-- ---------------------------------------------------------------------------
-- RLS: self-serve inserts must be pending only
-- ---------------------------------------------------------------------------
drop policy if exists alumni_profiles_insert_self on public.alumni_profiles;

create policy alumni_profiles_insert_self
  on public.alumni_profiles
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
  );

-- ---------------------------------------------------------------------------
-- Let signed-in users read batches/sections for active public/unlisted schools (join flow)
-- ---------------------------------------------------------------------------
create policy batches_select_for_active_public_schools
  on public.batches
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.schools s
      where s.id = batches.school_id
        and s.status = 'active'
        and s.visibility in ('public', 'unlisted')
    )
  );

create policy sections_select_for_active_public_schools
  on public.sections
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.schools s
      where s.id = sections.school_id
        and s.status = 'active'
        and s.visibility in ('public', 'unlisted')
    )
  );

-- ---------------------------------------------------------------------------
-- Storage: profile photos (owner prefix = auth uid)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'alumni-profile-photos',
  'alumni-profile-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy alumni_profile_photos_select_public
  on storage.objects
  for select
  to public
  using (bucket_id = 'alumni-profile-photos');

create policy alumni_profile_photos_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'alumni-profile-photos'
    and name like auth.uid()::text || '/%'
  );

create policy alumni_profile_photos_update_own
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'alumni-profile-photos'
    and name like auth.uid()::text || '/%'
  )
  with check (
    bucket_id = 'alumni-profile-photos'
    and name like auth.uid()::text || '/%'
  );

create policy alumni_profile_photos_delete_own
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'alumni-profile-photos'
    and name like auth.uid()::text || '/%'
  );
