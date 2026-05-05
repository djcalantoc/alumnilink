-- Memory wall: batch/section tags, public read for approved on public/unlisted schools,
-- storage bucket, status guard (no self-approve), stricter insert check.

-- ---------------------------------------------------------------------------
-- memories: optional batch/section tags
-- ---------------------------------------------------------------------------
alter table public.memories
  add column if not exists batch_id uuid references public.batches (id) on delete set null;

alter table public.memories
  add column if not exists section_id uuid references public.sections (id) on delete set null;

create index if not exists memories_batch_id_idx on public.memories (batch_id);
create index if not exists memories_section_id_idx on public.memories (section_id);

comment on column public.memories.body is 'Caption / description for the memory.';
comment on column public.memories.media_urls is 'Public URLs of uploaded images (JSON array of strings).';

-- ---------------------------------------------------------------------------
-- Trigger: inserts pending only; authors cannot change status except rejected→pending
-- ---------------------------------------------------------------------------
create or replace function public.memories_guard_status()
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
      raise exception 'New memories must start as pending';
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

    if not privileged and new.author_user_id = auth.uid() then
      if new.status is distinct from old.status then
        if not (old.status = 'rejected' and new.status = 'pending') then
          raise exception 'You cannot change your memory moderation status';
        end if;
      end if;
    end if;

    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists memories_guard_status_trg on public.memories;

create trigger memories_guard_status_trg
  before insert or update on public.memories
  for each row
  execute procedure public.memories_guard_status();

-- ---------------------------------------------------------------------------
-- Insert: must be pending
-- ---------------------------------------------------------------------------
drop policy if exists memories_insert_authors on public.memories;

create policy memories_insert_authors
  on public.memories
  for insert
  to authenticated
  with check (
    author_user_id = auth.uid()
    and status = 'pending'
    and exists (
      select 1
      from public.alumni_profiles ap
      where ap.school_id = memories.school_id
        and ap.user_id = auth.uid()
        and ap.status = 'approved'
    )
  );

-- ---------------------------------------------------------------------------
-- Public discovery: approved memories for active public/unlisted schools
-- ---------------------------------------------------------------------------
create policy memories_select_public_approved
  on public.memories
  for select
  to anon, authenticated
  using (
    status = 'approved'
    and exists (
      select 1
      from public.schools s
      where s.id = memories.school_id
        and s.status = 'active'
        and s.visibility in ('public', 'unlisted')
    )
  );

-- ---------------------------------------------------------------------------
-- Super admin
-- ---------------------------------------------------------------------------
create policy memories_select_super_admin
  on public.memories
  for select
  to authenticated
  using (public.is_super_admin());

create policy memories_update_super_admin
  on public.memories
  for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- Storage: school memory photos (path prefix = auth uid)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'school-memory-photos',
  'school-memory-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy school_memory_photos_select_public
  on storage.objects
  for select
  to public
  using (bucket_id = 'school-memory-photos');

create policy school_memory_photos_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'school-memory-photos'
    and name like auth.uid()::text || '/%'
  );

create policy school_memory_photos_update_own
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'school-memory-photos'
    and name like auth.uid()::text || '/%'
  )
  with check (
    bucket_id = 'school-memory-photos'
    and name like auth.uid()::text || '/%'
  );

create policy school_memory_photos_delete_own
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'school-memory-photos'
    and name like auth.uid()::text || '/%'
  );
