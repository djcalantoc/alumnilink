-- Platform-level settings key-value store editable by super admins.

create table if not exists public.platform_settings (
  key        text primary key,
  value      text,
  label      text not null default '',
  hint       text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users (id) on delete set null
);

comment on table public.platform_settings is
  'Platform-wide configuration toggles managed by super admins.';

-- RLS
alter table public.platform_settings enable row level security;

-- Super admin full access
create policy platform_settings_super_admin
  on public.platform_settings
  for all
  to authenticated
  using  (public.is_super_admin())
  with check (public.is_super_admin());

-- Anyone can read (public-facing settings like platform_name)
create policy platform_settings_public_read
  on public.platform_settings
  for select
  to anon, authenticated
  using (true);

-- Seed default settings
insert into public.platform_settings (key, label, hint, value) values
  ('platform_name',              'Platform Name',                    'Displayed across the app.',                                        'AlumniLink'),
  ('allow_public_registration',  'Allow Public Registration',        'Users can register without an invite.',                            'true'),
  ('require_school_approval',    'Require School Approval',          'New schools need super-admin approval before going live.',         'true'),
  ('require_alumni_approval',    'Require Alumni Approval',          'Alumni profiles require school-admin approval.',                   'true'),
  ('maintenance_mode',           'Maintenance Mode',                 'Show a maintenance banner to all visitors.',                       'false'),
  ('terms_url',                  'Terms of Service URL',             'Link to the Terms of Service page.',                               ''),
  ('privacy_url',                'Privacy Policy URL',               'Link to the Privacy Policy page.',                                 ''),
  ('support_email',              'Support Email',                    'Public-facing support address.',                                   ''),
  ('max_schools_per_admin',      'Max Schools per Admin',            'Maximum number of schools an admin can manage (0 = unlimited).',   '5')
on conflict (key) do nothing;
