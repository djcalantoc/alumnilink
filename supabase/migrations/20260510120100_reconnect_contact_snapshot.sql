-- Snapshot contact fields when reconnect is accepted (users table is self-only for RLS).

alter table public.reconnect_requests
  add column if not exists from_contact_email text,
  add column if not exists from_contact_social text,
  add column if not exists to_contact_email text,
  add column if not exists to_contact_social text;

create or replace function public.reconnect_snapshot_contacts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fe text;
  te text;
  fs text;
  ts text;
begin
  if tg_op = 'UPDATE' and new.status = 'accepted' and old.status = 'pending' then
    select u.email into fe from public.users u where u.id = new.from_user_id;
    select u.email into te from public.users u where u.id = new.to_user_id;
    select ap.social_url into fs
    from public.alumni_profiles ap
    where ap.user_id = new.from_user_id and ap.school_id = new.school_id
    limit 1;
    select ap.social_url into ts
    from public.alumni_profiles ap
    where ap.user_id = new.to_user_id and ap.school_id = new.school_id
    limit 1;

    new.from_contact_email := fe;
    new.to_contact_email := te;
    new.from_contact_social := fs;
    new.to_contact_social := ts;
  end if;
  return new;
end;
$$;

drop trigger if exists reconnect_requests_snapshot_trg on public.reconnect_requests;

create trigger reconnect_requests_snapshot_trg
  before update on public.reconnect_requests
  for each row
  execute procedure public.reconnect_snapshot_contacts();
