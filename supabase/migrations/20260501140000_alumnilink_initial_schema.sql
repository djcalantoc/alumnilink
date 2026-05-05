-- AlumniLink initial schema
-- Run with Supabase CLI or SQL editor. Requires auth.users (Supabase Auth).

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- schools
-- ---------------------------------------------------------------------------
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  status text not null default 'pending_setup'
    check (status in ('pending_setup', 'active', 'inactive')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index schools_status_idx on public.schools (status);

create trigger schools_set_updated_at
before update on public.schools
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- users (application profile; 1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger users_set_updated_at
before update on public.users
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- school_admins (approval required)
-- ---------------------------------------------------------------------------
create table public.school_admins (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null default 'admin'
    check (role in ('owner', 'admin', 'moderator')),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, user_id)
);

create index school_admins_school_id_idx on public.school_admins (school_id);
create index school_admins_user_id_idx on public.school_admins (user_id);
create index school_admins_status_idx on public.school_admins (status);

create trigger school_admins_set_updated_at
before update on public.school_admins
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- batches
-- ---------------------------------------------------------------------------
create table public.batches (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  name text not null,
  graduation_year integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, name)
);

create index batches_school_id_idx on public.batches (school_id);

create trigger batches_set_updated_at
before update on public.batches
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- sections (within a batch)
-- ---------------------------------------------------------------------------
create table public.sections (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  batch_id uuid not null references public.batches (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (batch_id, name)
);

create index sections_school_id_idx on public.sections (school_id);
create index sections_batch_id_idx on public.sections (batch_id);

create trigger sections_set_updated_at
before update on public.sections
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- alumni_profiles (directory membership; approval required)
-- ---------------------------------------------------------------------------
create table public.alumni_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  school_id uuid not null references public.schools (id) on delete cascade,
  batch_id uuid not null references public.batches (id) on delete restrict,
  section_id uuid references public.sections (id) on delete set null,
  headline text,
  bio text,
  is_profile_public boolean not null default false,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, school_id)
);

create index alumni_profiles_school_id_idx on public.alumni_profiles (school_id);
create index alumni_profiles_batch_id_idx on public.alumni_profiles (batch_id);
create index alumni_profiles_section_id_idx on public.alumni_profiles (section_id);
create index alumni_profiles_user_id_idx on public.alumni_profiles (user_id);
create index alumni_profiles_status_idx on public.alumni_profiles (status);

create trigger alumni_profiles_set_updated_at
before update on public.alumni_profiles
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- memories (moderation)
-- ---------------------------------------------------------------------------
create table public.memories (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  author_user_id uuid not null references public.users (id) on delete cascade,
  title text,
  body text,
  media_urls jsonb not null default '[]'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index memories_school_id_idx on public.memories (school_id);
create index memories_author_user_id_idx on public.memories (author_user_id);
create index memories_status_idx on public.memories (status);

create trigger memories_set_updated_at
before update on public.memories
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  title text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_school_id_idx on public.events (school_id);
create index events_starts_at_idx on public.events (starts_at);
create index events_status_idx on public.events (status);

create trigger events_set_updated_at
before update on public.events
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- event_responses
-- ---------------------------------------------------------------------------
create table public.event_responses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  response text not null
    check (response in ('going', 'maybe', 'not_going')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index event_responses_event_id_idx on public.event_responses (event_id);
create index event_responses_user_id_idx on public.event_responses (user_id);

create trigger event_responses_set_updated_at
before update on public.event_responses
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- invites (acceptance / approval)
-- ---------------------------------------------------------------------------
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  email text not null,
  invited_by_user_id uuid references public.users (id) on delete set null,
  intended_role text not null default 'alumni'
    check (intended_role in ('alumni', 'school_admin', 'moderator')),
  token_hash text unique,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'expired', 'revoked')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index invites_school_id_idx on public.invites (school_id);
create index invites_email_idx on public.invites (lower(email));
create index invites_status_idx on public.invites (status);

create unique index invites_school_email_pending_idx
  on public.invites (school_id, lower(email))
  where status = 'pending';

create trigger invites_set_updated_at
before update on public.invites
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.schools enable row level security;
alter table public.users enable row level security;
alter table public.school_admins enable row level security;
alter table public.batches enable row level security;
alter table public.sections enable row level security;
alter table public.alumni_profiles enable row level security;
alter table public.memories enable row level security;
alter table public.events enable row level security;
alter table public.event_responses enable row level security;
alter table public.invites enable row level security;

-- schools: public discovery of active schools; members/admins can read their school even if inactive
create policy schools_select_public_active
  on public.schools
  for select
  to anon, authenticated
  using (status = 'active');

create policy schools_select_members
  on public.schools
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.alumni_profiles ap
      where ap.school_id = schools.id
        and ap.user_id = auth.uid()
        and ap.status = 'approved'
    )
    or exists (
      select 1
      from public.school_admins sa
      where sa.school_id = schools.id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
    )
  );

create policy schools_write_admins
  on public.schools
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.school_admins sa
      where sa.school_id = schools.id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
        and sa.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.school_admins sa
      where sa.school_id = schools.id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
        and sa.role in ('owner', 'admin')
    )
  );

-- users: self-service profile row
create policy users_select_self
  on public.users
  for select
  to authenticated
  using (id = auth.uid());

create policy users_insert_self
  on public.users
  for insert
  to authenticated
  with check (id = auth.uid());

create policy users_update_self
  on public.users
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- school_admins: visibility + admin management
create policy school_admins_select_visible
  on public.school_admins
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.school_admins sa
      where sa.school_id = school_admins.school_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
    )
  );

create policy school_admins_insert_by_admin
  on public.school_admins
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.school_admins sa
      where sa.school_id = school_admins.school_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
        and sa.role in ('owner', 'admin')
    )
  );

create policy school_admins_update_by_admin
  on public.school_admins
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.school_admins sa
      where sa.school_id = school_admins.school_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
        and sa.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.school_admins sa
      where sa.school_id = school_admins.school_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
        and sa.role in ('owner', 'admin')
    )
  );

-- batches / sections: school members and admins
create policy batches_select_members
  on public.batches
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.alumni_profiles ap
      where ap.school_id = batches.school_id
        and ap.user_id = auth.uid()
        and ap.status = 'approved'
    )
    or exists (
      select 1
      from public.school_admins sa
      where sa.school_id = batches.school_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
    )
  );

create policy batches_write_admins
  on public.batches
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.school_admins sa
      where sa.school_id = batches.school_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
        and sa.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.school_admins sa
      where sa.school_id = batches.school_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
        and sa.role in ('owner', 'admin')
    )
  );

create policy sections_select_members
  on public.sections
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.alumni_profiles ap
      where ap.school_id = sections.school_id
        and ap.user_id = auth.uid()
        and ap.status = 'approved'
    )
    or exists (
      select 1
      from public.school_admins sa
      where sa.school_id = sections.school_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
    )
  );

create policy sections_write_admins
  on public.sections
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.school_admins sa
      where sa.school_id = sections.school_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
        and sa.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.school_admins sa
      where sa.school_id = sections.school_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
        and sa.role in ('owner', 'admin')
    )
  );

-- alumni_profiles
create policy alumni_profiles_select
  on public.alumni_profiles
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or (
      status = 'approved'
      and is_profile_public = true
      and exists (
        select 1
        from public.alumni_profiles me
        where me.school_id = alumni_profiles.school_id
          and me.user_id = auth.uid()
          and me.status = 'approved'
      )
    )
    or exists (
      select 1
      from public.school_admins sa
      where sa.school_id = alumni_profiles.school_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
    )
  );

create policy alumni_profiles_insert_self
  on public.alumni_profiles
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy alumni_profiles_update_self
  on public.alumni_profiles
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy alumni_profiles_update_admins
  on public.alumni_profiles
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.school_admins sa
      where sa.school_id = alumni_profiles.school_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
        and sa.role in ('owner', 'admin', 'moderator')
    )
  )
  with check (
    exists (
      select 1
      from public.school_admins sa
      where sa.school_id = alumni_profiles.school_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
        and sa.role in ('owner', 'admin', 'moderator')
    )
  );

-- memories
create policy memories_select
  on public.memories
  for select
  to authenticated
  using (
    author_user_id = auth.uid()
    or (
      status = 'approved'
      and (
        exists (
          select 1
          from public.alumni_profiles ap
          where ap.school_id = memories.school_id
            and ap.user_id = auth.uid()
            and ap.status = 'approved'
        )
        or exists (
          select 1
          from public.school_admins sa
          where sa.school_id = memories.school_id
            and sa.user_id = auth.uid()
            and sa.status = 'approved'
        )
      )
    )
    or exists (
      select 1
      from public.school_admins sa
      where sa.school_id = memories.school_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
        and sa.role in ('owner', 'admin', 'moderator')
    )
  );

create policy memories_insert_authors
  on public.memories
  for insert
  to authenticated
  with check (
    author_user_id = auth.uid()
    and exists (
      select 1
      from public.alumni_profiles ap
      where ap.school_id = memories.school_id
        and ap.user_id = auth.uid()
        and ap.status = 'approved'
    )
  );

create policy memories_update_author
  on public.memories
  for update
  to authenticated
  using (author_user_id = auth.uid())
  with check (author_user_id = auth.uid());

create policy memories_update_moderators
  on public.memories
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.school_admins sa
      where sa.school_id = memories.school_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
        and sa.role in ('owner', 'admin', 'moderator')
    )
  )
  with check (
    exists (
      select 1
      from public.school_admins sa
      where sa.school_id = memories.school_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
        and sa.role in ('owner', 'admin', 'moderator')
    )
  );

-- events: members see published lifecycle; admins manage all
create policy events_select_members_published
  on public.events
  for select
  to authenticated
  using (
    status in ('published', 'cancelled', 'completed')
    and (
      exists (
        select 1
        from public.alumni_profiles ap
        where ap.school_id = events.school_id
          and ap.user_id = auth.uid()
          and ap.status = 'approved'
      )
      or exists (
        select 1
        from public.school_admins sa
        where sa.school_id = events.school_id
          and sa.user_id = auth.uid()
          and sa.status = 'approved'
      )
    )
  );

create policy events_select_admins_all
  on public.events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.school_admins sa
      where sa.school_id = events.school_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
        and sa.role in ('owner', 'admin', 'moderator')
    )
  );

create policy events_write_admins
  on public.events
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.school_admins sa
      where sa.school_id = events.school_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
        and sa.role in ('owner', 'admin', 'moderator')
    )
  )
  with check (
    exists (
      select 1
      from public.school_admins sa
      where sa.school_id = events.school_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
        and sa.role in ('owner', 'admin', 'moderator')
    )
  );

-- event_responses
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
  );

create policy event_responses_upsert_self
  on public.event_responses
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.events e
      join public.alumni_profiles ap
        on ap.school_id = e.school_id
      where e.id = event_responses.event_id
        and ap.user_id = auth.uid()
        and ap.status = 'approved'
        and e.status = 'published'
    )
  );

create policy event_responses_update_self
  on public.event_responses
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy event_responses_delete_self
  on public.event_responses
  for delete
  to authenticated
  using (user_id = auth.uid());

-- invites
create policy invites_select_admin_or_recipient
  on public.invites
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.school_admins sa
      where sa.school_id = invites.school_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
        and sa.role in ('owner', 'admin')
    )
    or lower(invites.email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );

create policy invites_write_admins
  on public.invites
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.school_admins sa
      where sa.school_id = invites.school_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
        and sa.role in ('owner', 'admin')
    )
  );

create policy invites_update_admins
  on public.invites
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.school_admins sa
      where sa.school_id = invites.school_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
        and sa.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.school_admins sa
      where sa.school_id = invites.school_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
        and sa.role in ('owner', 'admin')
    )
  );

-- Invitees can mark their own pending invite accepted once authenticated with a matching email JWT claim.
create policy invites_update_recipient_accept
  on public.invites
  for update
  to authenticated
  using (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and status = 'pending'
  )
  with check (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and status = 'accepted'
  );

-- ---------------------------------------------------------------------------
-- Grants (Supabase roles)
-- ---------------------------------------------------------------------------
grant usage on schema public to postgres, anon, authenticated, service_role;

grant select on public.schools to anon;
grant select, insert, update, delete on public.schools to authenticated;

grant select, insert, update, delete on public.users to authenticated;
grant select, insert, update, delete on public.school_admins to authenticated;
grant select, insert, update, delete on public.batches to authenticated;
grant select, insert, update, delete on public.sections to authenticated;
grant select, insert, update, delete on public.alumni_profiles to authenticated;
grant select, insert, update, delete on public.memories to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.event_responses to authenticated;
grant select, insert, update, delete on public.invites to authenticated;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
