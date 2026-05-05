# AlumniLink

## Test accounts (after `supabase/seed.sql`)

Password for every seeded user: **`password123`**

| Email | Role / notes |
| --- | --- |
| `super@seed.alumnilink.local` | Super admin (`global_role` in user metadata) |
| `owner@seed.alumnilink.local` | School owner (approved admin) |
| `alum1@seed.alumnilink.local` | Approved alumni |
| `alum2@seed.alumnilink.local` | Approved alumni |
| `pending@seed.alumnilink.local` | Alumni profile still **pending** (approvals flow) |

Demo school slug for URLs: **`sample-valley-high`**

Use these only on local or non-production databases; do not reuse this password in production.

### “Database error querying schema” on login

Usually happens for users created **only via SQL** when `auth.users` columns that GoTrue reads as **non-nullable strings** are `NULL`. Run this in the **SQL Editor** for seeded emails (or delete those users and re-run `supabase/seed.sql`):

```sql
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
```

See [supabase/auth#1940](https://github.com/supabase/auth/issues/1940).

Also confirm **API → anon key** in the dashboard is the **JWT** (`eyJ…`) value in `NEXT_PUBLIC_SUPABASE_ANON_KEY`, not a mistaken key type.
