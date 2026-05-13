/** Shared types — safe in both server and client components. */

export type PlatformStats = {
  total_schools: number;
  active_schools: number;
  total_users: number;
  total_alumni: number;
  pending_alumni: number;
  active_school_admins: number;
};

export type SchoolStatusStat = { status: string; count: number };
export type MonthStat = { month: string; count: number };

export type UserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  alumni_count: number;
  school_admin_roles: { school_name: string; role: string }[];
};

export type SchoolAdminRow = {
  id: string;
  user_id: string;
  school_id: string;
  role: string;
  status: string;
  created_at: string;
  user_email: string | null;
  user_name: string | null;
  school_name: string;
  school_slug: string;
};

export type PlatformSetting = {
  key: string;
  value: string | null;
  label: string;
  hint: string | null;
};

export const SETTING_BOOLEANS = new Set([
  "allow_public_registration",
  "require_school_approval",
  "require_alumni_approval",
  "maintenance_mode",
]);

export const USER_PER_PAGE = 25;
export const ADMIN_PER_PAGE = 25;
