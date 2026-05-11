-- AlumniLink sample data for `supabase db reset` (local) or
-- `supabase db query --file supabase/seed.sql --linked` (remote linked project).
-- Password for all seeded accounts: password123
--
-- Logins: super@seed.alumnilink.local, owner@..., alum1@..., alum2@..., pending@...
-- School slug: sample-valley-high

do $seed$
<<blk>>
declare
  school_id   constant uuid := 'c0000001-0000-4000-8000-000000000001';
  batch_id    constant uuid := 'c0000002-0000-4000-8000-000000000001';
  section_id  constant uuid := 'c0000003-0000-4000-8000-000000000001';
  uid_super   constant uuid := 'd0000001-0000-4000-8000-000000000001';
  uid_owner   constant uuid := 'd0000002-0000-4000-8000-000000000001';
  uid_alum1   constant uuid := 'd0000003-0000-4000-8000-000000000001';
  uid_alum2   constant uuid := 'd0000004-0000-4000-8000-000000000001';
  uid_pending constant uuid := 'd0000005-0000-4000-8000-000000000001';
  instance_id constant uuid := '00000000-0000-0000-0000-000000000000';
  ev_id       uuid;
begin
  insert into public.schools (
    id, slug, name, status, metadata,
    short_name, school_type, address, city,
    primary_color, secondary_color, visibility
  ) values (
    school_id,
    'sample-valley-high',
    'Sample Valley High School',
    'active',
    '{"seed": true}'::jsonb,
    'SVHS',
    'high_school',
    '1 Demo Lane',
    'Springfield',
    '#0f766e',
    '#ccfbf1',
    'public'
  );

  insert into public.batches (id, school_id, name, graduation_year)
  values
    (batch_id,                                     school_id, 'Class of 2015', 2015),
    ('c0000002-0000-4000-8000-000000000002'::uuid, school_id, 'Class of 2016', 2016),
    ('c0000002-0000-4000-8000-000000000003'::uuid, school_id, 'Class of 2017', 2017),
    ('c0000002-0000-4000-8000-000000000004'::uuid, school_id, 'Class of 2018', 2018),
    ('c0000002-0000-4000-8000-000000000005'::uuid, school_id, 'Class of 2019', 2019),
    ('c0000002-0000-4000-8000-000000000006'::uuid, school_id, 'Class of 2020', 2020);

  insert into public.sections (id, school_id, batch_id, name)
  values (section_id, school_id, batch_id, 'Section A');

  -- GoTrue maps several auth.users columns to non-nullable Go strings; NULL → scan error
  -- "Database error querying schema" on login (see supabase/auth#1940, User model token fields).
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_current,
    email_change_token_new,
    email_change,
    phone_change_token,
    phone_change,
    reauthentication_token,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) values
    (
      instance_id, uid_super, 'authenticated', 'authenticated',
      'super@seed.alumnilink.local', crypt('password123', gen_salt('bf')), now(),
      '', '', '', '', '', '', '', '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Sam Super","global_role":"super_admin"}'::jsonb,
      now(), now()
    ),
    (
      instance_id, uid_owner, 'authenticated', 'authenticated',
      'owner@seed.alumnilink.local', crypt('password123', gen_salt('bf')), now(),
      '', '', '', '', '', '', '', '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Olivia Owner"}'::jsonb,
      now(), now()
    ),
    (
      instance_id, uid_alum1, 'authenticated', 'authenticated',
      'alum1@seed.alumnilink.local', crypt('password123', gen_salt('bf')), now(),
      '', '', '', '', '', '', '', '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Alex Alumni"}'::jsonb,
      now(), now()
    ),
    (
      instance_id, uid_alum2, 'authenticated', 'authenticated',
      'alum2@seed.alumnilink.local', crypt('password123', gen_salt('bf')), now(),
      '', '', '', '', '', '', '', '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Riley Rivera"}'::jsonb,
      now(), now()
    ),
    (
      instance_id, uid_pending, 'authenticated', 'authenticated',
      'pending@seed.alumnilink.local', crypt('password123', gen_salt('bf')), now(),
      '', '', '', '', '', '', '', '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Pat Pending"}'::jsonb,
      now(), now()
    );

  update auth.users u
  set
    confirmation_token = coalesce(u.confirmation_token, ''),
    recovery_token = coalesce(u.recovery_token, ''),
    email_change_token_current = coalesce(u.email_change_token_current, ''),
    email_change_token_new = coalesce(u.email_change_token_new, ''),
    email_change = coalesce(u.email_change, ''),
    phone_change_token = coalesce(u.phone_change_token, ''),
    phone_change = coalesce(u.phone_change, ''),
    reauthentication_token = coalesce(u.reauthentication_token, '')
  where u.email like '%@seed.alumnilink.local';

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  )
  select
    gen_random_uuid(),
    u.id,
    u.id::text,
    jsonb_build_object('sub', u.id::text, 'email', u.email),
    'email',
    now(),
    now(),
    now()
  from auth.users u
  where u.email like '%@seed.alumnilink.local';

  insert into public.school_admins (school_id, user_id, role, status)
  values (school_id, uid_owner, 'owner', 'approved');

  insert into public.alumni_profiles (
    user_id, school_id, batch_id, section_id,
    headline, bio, is_profile_public, display_name,
    location_city, location_country, social_url, status
  ) values
    (uid_owner, school_id, batch_id, section_id,
     'Faculty liaison', 'Helps organize reunions.', true, 'Olivia Owner',
     'Springfield', 'US', null, 'pending'),
    (uid_alum1, school_id, batch_id, section_id,
     'Product designer', 'Loves typography and hiking.', true, 'Alex Alumni',
     'Portland', 'US', 'https://example.com/alex', 'pending'),
    (uid_alum2, school_id, batch_id, section_id,
     'Civil engineer', 'Bridges and weekend baking.', true, 'Riley Rivera',
     'Austin', 'US', null, 'pending'),
    (uid_pending, school_id, batch_id, section_id,
     'New joiner', 'Waiting for approval.', false, 'Pat Pending',
     null, null, null, 'pending');

  update public.alumni_profiles
  set status = 'approved'
  where user_id in (uid_owner, uid_alum1, uid_alum2);

  insert into public.memories (
    school_id, author_user_id, title, body, media_urls, status, batch_id, section_id
  ) values (
    school_id, uid_alum1,
    'Senior week sunset',
    'Last group photo before graduation — still have this printed on my desk.',
    '[]'::jsonb,
    'pending',
    batch_id,
    section_id
  );

  update public.memories m
  set status = 'approved'
  where m.school_id = blk.school_id
    and m.author_user_id = blk.uid_alum1;

  insert into public.events (
    school_id, title, description, location, starts_at, ends_at, status
  ) values (
    school_id,
    '15-Year Reunion Mixer',
    'Casual evening at the alumni hall. Spouses welcome.',
    'SVHS Alumni Hall',
    now() + interval '45 days',
    now() + interval '45 days' + interval '3 hours',
    'published'
  )
  returning id into ev_id;

  insert into public.event_responses (event_id, user_id, response)
  values
    (ev_id, uid_alum1, 'going'),
    (ev_id, uid_alum2, 'maybe');

  insert into public.invites (
    school_id, email, invited_by_user_id, intended_role, status
  ) values (
    school_id,
    'invite@seed.alumnilink.local',
    uid_owner,
    'alumni',
    'pending'
  );

end blk;
$seed$;
