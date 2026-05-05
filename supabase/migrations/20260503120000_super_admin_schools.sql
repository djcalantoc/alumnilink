-- Super admin helpers, school branding columns, and storage for logos / covers.

-- ---------------------------------------------------------------------------
-- JWT helper: super admins manage all schools and storage uploads.
-- ---------------------------------------------------------------------------
create or replace function public.is_super_admin()
returns boolean
language sql
stable
as $$
  select
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'global_role'), '') = 'super_admin';
$$;

-- ---------------------------------------------------------------------------
-- schools: extended profile fields
-- ---------------------------------------------------------------------------
alter table public.schools add column if not exists short_name text;

alter table public.schools add column if not exists school_type text
  not null default 'other'
  constraint schools_school_type_check check (
    school_type in (
      'university',
      'high_school',
      'k12',
      'vocational',
      'other'
    )
  );

alter table public.schools add column if not exists address text;
alter table public.schools add column if not exists city text;

alter table public.schools add column if not exists primary_color text
  not null default '#1c1917';

alter table public.schools add column if not exists secondary_color text
  not null default '#78716c';

alter table public.schools add column if not exists visibility text
  not null default 'public'
  constraint schools_visibility_check check (
    visibility in ('public', 'unlisted', 'private')
  );

alter table public.schools add column if not exists logo_url text;
alter table public.schools add column if not exists cover_photo_url text;

create index if not exists schools_city_idx on public.schools (city);
create index if not exists schools_visibility_idx on public.schools (visibility);

comment on column public.schools.primary_color is 'Hex color e.g. #RRGGBB';
comment on column public.schools.secondary_color is 'Hex color e.g. #RRGGBB';

-- ---------------------------------------------------------------------------
-- RLS: super admins can manage all schools (including inactive / unlisted).
-- ---------------------------------------------------------------------------
create policy schools_super_admin_all
  on public.schools
  for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- Storage: public bucket for school logos & cover images
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'school-assets',
  'school-assets',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy school_assets_select_public
  on storage.objects
  for select
  to public
  using (bucket_id = 'school-assets');

create policy school_assets_insert_super
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'school-assets'
    and public.is_super_admin()
  );

create policy school_assets_update_super
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'school-assets'
    and public.is_super_admin()
  )
  with check (
    bucket_id = 'school-assets'
    and public.is_super_admin()
  );

create policy school_assets_delete_super
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'school-assets'
    and public.is_super_admin()
  );
