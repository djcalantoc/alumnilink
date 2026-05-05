-- Alumni Web / connection map: structured connections (no chat/feed).
-- Profile-scoped requests; same school; approved alumni only.

-- ---------------------------------------------------------------------------
-- Extend notification types
-- ---------------------------------------------------------------------------
alter table public.notifications drop constraint if exists notifications_type_check;

alter table public.notifications add constraint notifications_type_check check (
  type in (
    'memory_tag',
    'say_hi',
    'reconnect_request',
    'reconnect_accepted',
    'reconnect_declined',
    'poll_created',
    'connection_request',
    'connection_accepted',
    'connection_declined'
  )
);

-- ---------------------------------------------------------------------------
-- network_privacy_settings (one row per alumni profile)
-- ---------------------------------------------------------------------------
create table public.network_privacy_settings (
  id uuid primary key default gen_random_uuid(),
  alumni_profile_id uuid not null unique references public.alumni_profiles (id) on delete cascade,
  show_in_network_map boolean not null default true,
  show_mutual_connections boolean not null default true,
  allow_connection_requests boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger network_privacy_settings_set_updated_at
  before update on public.network_privacy_settings
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- connection_blocks (blocker cannot receive requests from blocked; symmetric app rules)
-- ---------------------------------------------------------------------------
create table public.connection_blocks (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  blocker_profile_id uuid not null references public.alumni_profiles (id) on delete cascade,
  blocked_profile_id uuid not null references public.alumni_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint connection_blocks_no_self check (blocker_profile_id <> blocked_profile_id),
  unique (school_id, blocker_profile_id, blocked_profile_id)
);

create index connection_blocks_blocked_idx on public.connection_blocks (blocked_profile_id, school_id);
create index connection_blocks_blocker_idx on public.connection_blocks (blocker_profile_id, school_id);

-- ---------------------------------------------------------------------------
-- alumni_connections
-- ---------------------------------------------------------------------------
create table public.alumni_connections (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  requester_profile_id uuid not null references public.alumni_profiles (id) on delete cascade,
  receiver_profile_id uuid not null references public.alumni_profiles (id) on delete cascade,
  connection_type text not null
    constraint alumni_connections_type_check check (
      connection_type in (
        'classmate',
        'batchmate',
        'seatmate',
        'friend',
        'clubmate',
        'schoolmate',
        'other'
      )
    ),
  status text not null default 'pending'
    constraint alumni_connections_status_check check (
      status in ('pending', 'accepted', 'declined', 'removed')
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  accepted_at timestamptz,
  constraint alumni_connections_no_self check (requester_profile_id <> receiver_profile_id)
);

create index alumni_connections_school_status_idx
  on public.alumni_connections (school_id, status);

create index alumni_connections_requester_idx
  on public.alumni_connections (requester_profile_id) where status = 'accepted';

create index alumni_connections_receiver_idx
  on public.alumni_connections (receiver_profile_id) where status = 'accepted';

create unique index alumni_connections_pending_pair_uniq
  on public.alumni_connections (
    school_id,
    least(requester_profile_id, receiver_profile_id),
    greatest(requester_profile_id, receiver_profile_id)
  )
  where status = 'pending';

create unique index alumni_connections_accepted_pair_uniq
  on public.alumni_connections (
    school_id,
    least(requester_profile_id, receiver_profile_id),
    greatest(requester_profile_id, receiver_profile_id)
  )
  where status = 'accepted';

create trigger alumni_connections_set_updated_at
  before update on public.alumni_connections
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Notifications (SECURITY DEFINER)
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_alumni_connection()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  req_user uuid;
  recv_user uuid;
begin
  select user_id into req_user from public.alumni_profiles where id = new.requester_profile_id;
  select user_id into recv_user from public.alumni_profiles where id = new.receiver_profile_id;

  if tg_op = 'INSERT' and new.status = 'pending' then
    insert into public.notifications (user_id, school_id, actor_user_id, type, title, body, payload)
    values (
      recv_user,
      new.school_id,
      req_user,
      'connection_request',
      'Connection request',
      'Someone says they know you. Review your alumni network.',
      jsonb_build_object('connection_id', new.id, 'connection_type', new.connection_type)
    );
  elsif tg_op = 'UPDATE' and old.status = 'pending' then
    if new.status = 'accepted' then
      insert into public.notifications (user_id, school_id, actor_user_id, type, title, body, payload)
      values (
        req_user,
        new.school_id,
        recv_user,
        'connection_accepted',
        'Connection accepted',
        'Your connection request was accepted.',
        jsonb_build_object('connection_id', new.id)
      );
    elsif new.status = 'declined' then
      insert into public.notifications (user_id, school_id, actor_user_id, type, title, body, payload)
      values (
        req_user,
        new.school_id,
        recv_user,
        'connection_declined',
        'Connection declined',
        'Your connection request was declined.',
        jsonb_build_object('connection_id', new.id)
      );
    end if;
  end if;
  return new;
end;
$$;

create trigger alumni_connections_notify_trg
  after insert or update on public.alumni_connections
  for each row execute procedure public.notify_on_alumni_connection();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.network_privacy_settings enable row level security;
alter table public.connection_blocks enable row level security;
alter table public.alumni_connections enable row level security;

-- network_privacy_settings
create policy network_privacy_select_own_or_school_peer
  on public.network_privacy_settings for select to authenticated
  using (
    public.is_super_admin()
    or exists (
      select 1 from public.alumni_profiles ap
      where ap.id = network_privacy_settings.alumni_profile_id
        and ap.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.alumni_profiles ap
      join public.alumni_profiles peer on peer.school_id = ap.school_id
      where peer.id = network_privacy_settings.alumni_profile_id
        and ap.user_id = auth.uid()
        and ap.status = 'approved'
        and peer.status = 'approved'
    )
  );

create policy network_privacy_insert_own
  on public.network_privacy_settings for insert to authenticated
  with check (
    public.is_super_admin()
    or exists (
      select 1 from public.alumni_profiles ap
      where ap.id = network_privacy_settings.alumni_profile_id
        and ap.user_id = auth.uid()
        and ap.status = 'approved'
    )
  );

create policy network_privacy_update_own
  on public.network_privacy_settings for update to authenticated
  using (
    public.is_super_admin()
    or exists (
      select 1 from public.alumni_profiles ap
      where ap.id = network_privacy_settings.alumni_profile_id
        and ap.user_id = auth.uid()
    )
  )
  with check (
    public.is_super_admin()
    or exists (
      select 1 from public.alumni_profiles ap
      where ap.id = network_privacy_settings.alumni_profile_id
        and ap.user_id = auth.uid()
    )
  );

-- connection_blocks
create policy connection_blocks_select_party
  on public.connection_blocks for select to authenticated
  using (
    public.is_super_admin()
    or exists (
      select 1 from public.alumni_profiles ap
      where ap.id = connection_blocks.blocker_profile_id
        and ap.user_id = auth.uid()
    )
    or exists (
      select 1 from public.alumni_profiles ap
      where ap.id = connection_blocks.blocked_profile_id
        and ap.user_id = auth.uid()
    )
  );

create policy connection_blocks_insert_blocker
  on public.connection_blocks for insert to authenticated
  with check (
    exists (
      select 1 from public.alumni_profiles ap
      where ap.id = connection_blocks.blocker_profile_id
        and ap.user_id = auth.uid()
        and ap.school_id = connection_blocks.school_id
        and ap.status = 'approved'
    )
    and exists (
      select 1 from public.alumni_profiles ap
      where ap.id = connection_blocks.blocked_profile_id
        and ap.school_id = connection_blocks.school_id
        and ap.status = 'approved'
    )
  );

create policy connection_blocks_delete_blocker
  on public.connection_blocks for delete to authenticated
  using (
    public.is_super_admin()
    or exists (
      select 1 from public.alumni_profiles ap
      where ap.id = connection_blocks.blocker_profile_id
        and ap.user_id = auth.uid()
    )
  );

-- alumni_connections
create policy alumni_connections_select
  on public.alumni_connections for select to authenticated
  using (
    public.is_super_admin()
    or exists (
      select 1 from public.alumni_profiles ap
      where ap.id = alumni_connections.requester_profile_id
        and ap.user_id = auth.uid()
    )
    or exists (
      select 1 from public.alumni_profiles ap
      where ap.id = alumni_connections.receiver_profile_id
        and ap.user_id = auth.uid()
    )
    or (
      alumni_connections.status = 'accepted'
      and exists (
        select 1 from public.alumni_profiles ap
        where ap.school_id = alumni_connections.school_id
          and ap.user_id = auth.uid()
          and ap.status = 'approved'
      )
    )
  );

create policy alumni_connections_insert_request
  on public.alumni_connections for insert to authenticated
  with check (
    exists (
      select 1 from public.alumni_profiles ap_req
      where ap_req.id = alumni_connections.requester_profile_id
        and ap_req.user_id = auth.uid()
        and ap_req.school_id = alumni_connections.school_id
        and ap_req.status = 'approved'
    )
    and exists (
      select 1 from public.alumni_profiles ap_recv
      where ap_recv.id = alumni_connections.receiver_profile_id
        and ap_recv.school_id = alumni_connections.school_id
        and ap_recv.status = 'approved'
    )
    and alumni_connections.status = 'pending'
    and not exists (
      select 1 from public.connection_blocks b
      where b.school_id = alumni_connections.school_id
        and (
          (b.blocker_profile_id = alumni_connections.receiver_profile_id
            and b.blocked_profile_id = alumni_connections.requester_profile_id)
          or (b.blocker_profile_id = alumni_connections.requester_profile_id
            and b.blocked_profile_id = alumni_connections.receiver_profile_id)
        )
    )
    and coalesce((
      select nps.allow_connection_requests
      from public.network_privacy_settings nps
      where nps.alumni_profile_id = alumni_connections.receiver_profile_id
    ), true) = true
  );

create policy alumni_connections_update_parties
  on public.alumni_connections for update to authenticated
  using (
    public.is_super_admin()
    or exists (
      select 1 from public.alumni_profiles ap
      where ap.id = alumni_connections.receiver_profile_id
        and ap.user_id = auth.uid()
    )
    or exists (
      select 1 from public.alumni_profiles ap
      where ap.id = alumni_connections.requester_profile_id
        and ap.user_id = auth.uid()
    )
  )
  with check (
    public.is_super_admin()
    or exists (
      select 1 from public.alumni_profiles ap
      where ap.id = alumni_connections.receiver_profile_id
        and ap.user_id = auth.uid()
    )
    or exists (
      select 1 from public.alumni_profiles ap
      where ap.id = alumni_connections.requester_profile_id
        and ap.user_id = auth.uid()
    )
  );

-- Grants
grant select, insert, update, delete on public.network_privacy_settings to authenticated;
grant select, insert, delete on public.connection_blocks to authenticated;
grant select, insert, update on public.alumni_connections to authenticated;
