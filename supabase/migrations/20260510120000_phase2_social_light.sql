-- Phase 2: lightweight social (tags, notifications, say hi, polls, reconnect, reactions)
-- No chat/feed. School-scoped; approved alumni only for peer actions.

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  actor_user_id uuid references public.users (id) on delete set null,
  school_id uuid not null references public.schools (id) on delete cascade,
  type text not null
    constraint notifications_type_check check (
      type in (
        'memory_tag',
        'say_hi',
        'reconnect_request',
        'reconnect_accepted',
        'reconnect_declined',
        'poll_created'
      )
    ),
  title text not null,
  body text,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_id_created_idx on public.notifications (user_id, created_at desc);
create index notifications_user_unread_idx on public.notifications (user_id) where read_at is null;

-- ---------------------------------------------------------------------------
-- memory_tags (approved memory, approved classmates only)
-- ---------------------------------------------------------------------------
create table public.memory_tags (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories (id) on delete cascade,
  school_id uuid not null references public.schools (id) on delete cascade,
  tagged_user_id uuid not null references public.users (id) on delete cascade,
  tagged_by_user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (memory_id, tagged_user_id)
);

create index memory_tags_memory_id_idx on public.memory_tags (memory_id);
create index memory_tags_tagged_user_id_idx on public.memory_tags (tagged_user_id);
create index memory_tags_school_id_idx on public.memory_tags (school_id);

-- ---------------------------------------------------------------------------
-- say_hi_events (rate-limited per pair per UTC day)
-- ---------------------------------------------------------------------------
create table public.say_hi_events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  from_user_id uuid not null references public.users (id) on delete cascade,
  to_user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint say_hi_no_self check (from_user_id <> to_user_id)
);

create index say_hi_events_to_idx on public.say_hi_events (to_user_id, created_at desc);

create unique index say_hi_one_per_day_idx
  on public.say_hi_events (from_user_id, to_user_id, ((created_at at time zone 'utc')::date));

-- ---------------------------------------------------------------------------
-- polls
-- ---------------------------------------------------------------------------
create table public.polls (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  created_by_user_id uuid not null references public.users (id) on delete restrict,
  poll_type text not null
    constraint polls_poll_type_check check (poll_type in ('nostalgic', 'event', 'batch')),
  title text not null,
  description text,
  batch_id uuid references public.batches (id) on delete set null,
  section_id uuid references public.sections (id) on delete set null,
  status text not null default 'open'
    constraint polls_status_check check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index polls_school_id_idx on public.polls (school_id);

create trigger polls_set_updated_at
  before update on public.polls
  for each row execute procedure public.set_updated_at();

create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls (id) on delete cascade,
  label text not null,
  sort_order integer not null default 0
);

create index poll_options_poll_id_idx on public.poll_options (poll_id);

create table public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls (id) on delete cascade,
  option_id uuid not null references public.poll_options (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (poll_id, user_id)
);

create index poll_votes_poll_id_idx on public.poll_votes (poll_id);

-- ---------------------------------------------------------------------------
-- reconnect_requests
-- ---------------------------------------------------------------------------
create table public.reconnect_requests (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  from_user_id uuid not null references public.users (id) on delete cascade,
  to_user_id uuid not null references public.users (id) on delete cascade,
  status text not null default 'pending'
    constraint reconnect_status_check check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reconnect_no_self check (from_user_id <> to_user_id)
);

create unique index reconnect_one_pending_idx
  on public.reconnect_requests (from_user_id, to_user_id, school_id)
  where status = 'pending';

create trigger reconnect_requests_set_updated_at
  before update on public.reconnect_requests
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- reactions (one per user per target; emoji from fixed set)
-- ---------------------------------------------------------------------------
create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  target_type text not null
    constraint reactions_target_type_check check (target_type in ('memory', 'alumni_profile')),
  target_id uuid not null,
  user_id uuid not null references public.users (id) on delete cascade,
  emoji text not null
    constraint reactions_emoji_check check (emoji in ('👍', '👏', '😂', '🔥', '🎓')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (target_type, target_id, user_id)
);

create index reactions_target_idx on public.reactions (target_type, target_id);

create trigger reactions_set_updated_at
  before update on public.reactions
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Triggers: notifications (SECURITY DEFINER — bypasses RLS)
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_memory_tag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, school_id, actor_user_id, type, title, body, payload)
  values (
    new.tagged_user_id,
    new.school_id,
    new.tagged_by_user_id,
    'memory_tag',
    'You were tagged in a memory',
    null,
    jsonb_build_object('memory_id', new.memory_id, 'tag_id', new.id)
  );
  return new;
end;
$$;

create trigger memory_tags_notify_trg
  after insert on public.memory_tags
  for each row execute procedure public.notify_on_memory_tag();

create or replace function public.notify_on_reconnect()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.status = 'pending' then
    insert into public.notifications (user_id, school_id, actor_user_id, type, title, body, payload)
    values (
      new.to_user_id,
      new.school_id,
      new.from_user_id,
      'reconnect_request',
      'Reconnect request',
      'Someone wants to reconnect and share contact details.',
      jsonb_build_object('reconnect_id', new.id)
    );
  elsif tg_op = 'UPDATE' and old.status = 'pending' then
    if new.status = 'accepted' then
      insert into public.notifications (user_id, school_id, actor_user_id, type, title, body, payload)
      values (
        new.from_user_id,
        new.school_id,
        new.to_user_id,
        'reconnect_accepted',
        'Reconnect accepted',
        'Your reconnect request was accepted.',
        jsonb_build_object('reconnect_id', new.id)
      );
    elsif new.status = 'declined' then
      insert into public.notifications (user_id, school_id, actor_user_id, type, title, body, payload)
      values (
        new.from_user_id,
        new.school_id,
        new.to_user_id,
        'reconnect_declined',
        'Reconnect declined',
        'Your reconnect request was declined.',
        jsonb_build_object('reconnect_id', new.id)
      );
    end if;
  end if;
  return new;
end;
$$;

create trigger reconnect_requests_notify_trg
  after insert or update on public.reconnect_requests
  for each row execute procedure public.notify_on_reconnect();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.notifications enable row level security;
alter table public.memory_tags enable row level security;
alter table public.say_hi_events enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
alter table public.reconnect_requests enable row level security;
alter table public.reactions enable row level security;

-- Approved same-school helper pattern repeated in policies

-- notifications
create policy notifications_select_own
  on public.notifications for select to authenticated
  using (user_id = auth.uid() or public.is_super_admin());

create policy notifications_update_own_read
  on public.notifications for update to authenticated
  using (user_id = auth.uid() or public.is_super_admin())
  with check (user_id = auth.uid() or public.is_super_admin());

create policy notifications_insert_say_hi
  on public.notifications for insert to authenticated
  with check (
    type = 'say_hi'
    and actor_user_id = auth.uid()
    and user_id <> auth.uid()
    and exists (
      select 1
      from public.alumni_profiles ap_actor
      join public.alumni_profiles ap_target
        on ap_actor.school_id = ap_target.school_id
      where ap_actor.user_id = auth.uid()
        and ap_actor.status = 'approved'
        and ap_target.user_id = notifications.user_id
        and ap_target.status = 'approved'
        and ap_actor.school_id = notifications.school_id
    )
  );

-- memory_tags
create policy memory_tags_select_school
  on public.memory_tags for select to authenticated
  using (
    public.is_super_admin()
    or tagged_user_id = auth.uid()
    or tagged_by_user_id = auth.uid()
    or exists (
      select 1
      from public.alumni_profiles ap
      where ap.school_id = memory_tags.school_id
        and ap.user_id = auth.uid()
        and ap.status = 'approved'
    )
    or exists (
      select 1
      from public.school_admins sa
      where sa.school_id = memory_tags.school_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
    )
  );

create policy memory_tags_insert_peer
  on public.memory_tags for insert to authenticated
  with check (
    tagged_by_user_id = auth.uid()
    and tagged_user_id <> auth.uid()
    and exists (
      select 1
      from public.memories m
      where m.id = memory_tags.memory_id
        and m.school_id = memory_tags.school_id
        and m.status = 'approved'
    )
    and exists (
      select 1
      from public.alumni_profiles ap_self
      join public.alumni_profiles ap_peer on ap_self.school_id = ap_peer.school_id
      where ap_self.user_id = auth.uid()
        and ap_self.status = 'approved'
        and ap_peer.user_id = memory_tags.tagged_user_id
        and ap_peer.status = 'approved'
        and ap_self.school_id = memory_tags.school_id
    )
  );

create policy memory_tags_delete_tagger_or_mod
  on public.memory_tags for delete to authenticated
  using (
    tagged_by_user_id = auth.uid()
    or public.is_super_admin()
    or exists (
      select 1
      from public.school_admins sa
      where sa.school_id = memory_tags.school_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
        and sa.role in ('owner', 'admin', 'moderator')
    )
  );

-- say_hi_events
create policy say_hi_select_parties
  on public.say_hi_events for select to authenticated
  using (
    public.is_super_admin()
    or from_user_id = auth.uid()
    or to_user_id = auth.uid()
    or exists (
      select 1
      from public.school_admins sa
      where sa.school_id = say_hi_events.school_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
    )
  );

create policy say_hi_insert_peer
  on public.say_hi_events for insert to authenticated
  with check (
    from_user_id = auth.uid()
    and exists (
      select 1
      from public.alumni_profiles ap_self
      join public.alumni_profiles ap_peer on ap_self.school_id = ap_peer.school_id
      where ap_self.user_id = auth.uid()
        and ap_self.status = 'approved'
        and ap_peer.user_id = say_hi_events.to_user_id
        and ap_peer.status = 'approved'
        and ap_self.school_id = say_hi_events.school_id
    )
  );

-- polls (alumni read school polls; admins write)
create policy polls_select_members
  on public.polls for select to authenticated
  using (
    public.is_super_admin()
    or exists (
      select 1
      from public.alumni_profiles ap
      where ap.school_id = polls.school_id
        and ap.user_id = auth.uid()
        and ap.status = 'approved'
    )
    or exists (
      select 1
      from public.school_admins sa
      where sa.school_id = polls.school_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
    )
  );

create policy polls_write_admins
  on public.polls for all to authenticated
  using (
    public.is_super_admin()
    or exists (
      select 1
      from public.school_admins sa
      where sa.school_id = polls.school_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
        and sa.role in ('owner', 'admin', 'moderator')
    )
  )
  with check (
    public.is_super_admin()
    or exists (
      select 1
      from public.school_admins sa
      where sa.school_id = polls.school_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
        and sa.role in ('owner', 'admin', 'moderator')
    )
  );

create policy poll_options_select_members
  on public.poll_options for select to authenticated
  using (
    exists (
      select 1
      from public.polls p
      where p.id = poll_options.poll_id
        and (
          public.is_super_admin()
          or exists (
            select 1
            from public.alumni_profiles ap
            where ap.school_id = p.school_id
              and ap.user_id = auth.uid()
              and ap.status = 'approved'
          )
          or exists (
            select 1
            from public.school_admins sa
            where sa.school_id = p.school_id
              and sa.user_id = auth.uid()
              and sa.status = 'approved'
          )
        )
    )
  );

create policy poll_options_write_admins
  on public.poll_options for all to authenticated
  using (
    public.is_super_admin()
    or exists (
      select 1
      from public.polls p
      join public.school_admins sa on sa.school_id = p.school_id
      where p.id = poll_options.poll_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
        and sa.role in ('owner', 'admin', 'moderator')
    )
  )
  with check (
    public.is_super_admin()
    or exists (
      select 1
      from public.polls p
      join public.school_admins sa on sa.school_id = p.school_id
      where p.id = poll_options.poll_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
        and sa.role in ('owner', 'admin', 'moderator')
    )
  );

create policy poll_votes_select_policy
  on public.poll_votes for select to authenticated
  using (
    public.is_super_admin()
    or user_id = auth.uid()
    or exists (
      select 1
      from public.poll_votes mine
      where mine.poll_id = poll_votes.poll_id
        and mine.user_id = auth.uid()
    )
  );

create policy poll_votes_insert_self
  on public.poll_votes for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.polls p
      join public.alumni_profiles ap on ap.school_id = p.school_id
      where p.id = poll_votes.poll_id
        and ap.user_id = auth.uid()
        and ap.status = 'approved'
        and p.status = 'open'
    )
    and exists (
      select 1
      from public.poll_options o
      where o.id = poll_votes.option_id
        and o.poll_id = poll_votes.poll_id
    )
  );

-- reconnect_requests
create policy reconnect_select_parties
  on public.reconnect_requests for select to authenticated
  using (
    public.is_super_admin()
    or from_user_id = auth.uid()
    or to_user_id = auth.uid()
    or exists (
      select 1
      from public.school_admins sa
      where sa.school_id = reconnect_requests.school_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
    )
  );

create policy reconnect_insert_peer
  on public.reconnect_requests for insert to authenticated
  with check (
    from_user_id = auth.uid()
    and exists (
      select 1
      from public.alumni_profiles ap_self
      join public.alumni_profiles ap_peer on ap_self.school_id = ap_peer.school_id
      where ap_self.user_id = auth.uid()
        and ap_self.status = 'approved'
        and ap_peer.user_id = reconnect_requests.to_user_id
        and ap_peer.status = 'approved'
        and ap_self.school_id = reconnect_requests.school_id
    )
  );

create policy reconnect_update_receiver
  on public.reconnect_requests for update to authenticated
  using (
    public.is_super_admin()
    or to_user_id = auth.uid()
  )
  with check (
    public.is_super_admin()
    or to_user_id = auth.uid()
  );

-- reactions
create policy reactions_select_school
  on public.reactions for select to authenticated
  using (
    public.is_super_admin()
    or exists (
      select 1
      from public.alumni_profiles ap
      where ap.school_id = reactions.school_id
        and ap.user_id = auth.uid()
        and ap.status = 'approved'
    )
    or exists (
      select 1
      from public.school_admins sa
      where sa.school_id = reactions.school_id
        and sa.user_id = auth.uid()
        and sa.status = 'approved'
    )
  );

create policy reactions_write_self
  on public.reactions for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.alumni_profiles ap
      where ap.school_id = reactions.school_id
        and ap.user_id = auth.uid()
        and ap.status = 'approved'
    )
    and (
      (
        reactions.target_type = 'memory'
        and exists (
          select 1
          from public.memories m
          where m.id = reactions.target_id
            and m.school_id = reactions.school_id
            and m.status = 'approved'
        )
      )
      or (
        reactions.target_type = 'alumni_profile'
        and exists (
          select 1
          from public.alumni_profiles prof
          where prof.id = reactions.target_id
            and prof.school_id = reactions.school_id
            and prof.status = 'approved'
        )
      )
    )
  );

create policy reactions_update_self
  on public.reactions for update to authenticated
  using (user_id = auth.uid() or public.is_super_admin())
  with check (user_id = auth.uid() or public.is_super_admin());

create policy reactions_delete_self
  on public.reactions for delete to authenticated
  using (user_id = auth.uid() or public.is_super_admin());

-- Grants
grant select, insert, update, delete on public.notifications to authenticated;
grant select, insert, update, delete on public.memory_tags to authenticated;
grant select, insert on public.say_hi_events to authenticated;
grant select, insert, update, delete on public.polls to authenticated;
grant select, insert, update, delete on public.poll_options to authenticated;
grant select, insert on public.poll_votes to authenticated;
grant select, insert, update on public.reconnect_requests to authenticated;
grant select, insert, update, delete on public.reactions to authenticated;
