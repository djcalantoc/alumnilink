import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  MonthStat,
  PlatformSetting,
  PlatformStats,
  SchoolAdminRow,
  SchoolStatusStat,
  UserRow,
} from "@/features/super-admin/lib/types";
import { ADMIN_PER_PAGE, USER_PER_PAGE } from "@/features/super-admin/lib/types";

/* ─── Platform-wide stats ─────────────────────────────────────────────── */
export async function fetchPlatformStats(
  supabase: SupabaseClient,
): Promise<PlatformStats> {
  const [
    { count: total_schools },
    { count: active_schools },
    { count: total_users },
    { count: total_alumni },
    { count: pending_alumni },
    { count: active_school_admins },
  ] = await Promise.all([
    supabase.from("schools").select("id", { count: "exact", head: true }),
    supabase.from("schools").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("alumni_profiles").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("alumni_profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("school_admins").select("id", { count: "exact", head: true }).eq("status", "approved"),
  ]);

  return {
    total_schools: total_schools ?? 0,
    active_schools: active_schools ?? 0,
    total_users: total_users ?? 0,
    total_alumni: total_alumni ?? 0,
    pending_alumni: pending_alumni ?? 0,
    active_school_admins: active_school_admins ?? 0,
  };
}

/* ─── Schools by status (for chart) ──────────────────────────────────── */
export async function fetchSchoolsByStatus(
  supabase: SupabaseClient,
): Promise<SchoolStatusStat[]> {
  const { data } = await supabase.from("schools").select("status");
  const counts: Record<string, number> = {};
  for (const r of (data ?? []) as { status: string }[]) {
    counts[r.status] = (counts[r.status] ?? 0) + 1;
  }
  return Object.entries(counts).map(([status, count]) => ({ status, count }));
}

/* ─── Monthly registrations (last 12 months) ─────────────────────────── */
export async function fetchMonthlyRegistrations(
  supabase: SupabaseClient,
): Promise<MonthStat[]> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 11);
  cutoff.setDate(1);
  cutoff.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("users")
    .select("created_at")
    .gte("created_at", cutoff.toISOString());

  const counts: Record<string, number> = {};
  for (const r of (data ?? []) as { created_at: string }[]) {
    const key = r.created_at.slice(0, 7); // "YYYY-MM"
    counts[key] = (counts[key] ?? 0) + 1;
  }

  const months: MonthStat[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({
      month: key,
      count: counts[key] ?? 0,
    });
  }
  return months;
}

/* ─── Alumni growth per school (top 10 by approved count) ────────────── */
export async function fetchAlumniPerSchool(
  supabase: SupabaseClient,
): Promise<{ school_name: string; count: number }[]> {
  const { data: schools } = await supabase
    .from("schools")
    .select("id, name")
    .eq("status", "active")
    .order("name");

  if (!schools?.length) return [];

  const { data: alumni } = await supabase
    .from("alumni_profiles")
    .select("school_id")
    .eq("status", "approved");

  const counts: Record<string, number> = {};
  for (const r of (alumni ?? []) as { school_id: string }[]) {
    counts[r.school_id] = (counts[r.school_id] ?? 0) + 1;
  }

  return (schools as { id: string; name: string }[])
    .map((s) => ({ school_name: s.name, count: counts[s.id] ?? 0 }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

/* ─── Users (paginated) ───────────────────────────────────────────────── */
export async function fetchPaginatedUsers(
  supabase: SupabaseClient,
  opts: { search?: string; page?: number },
): Promise<{
  rows: UserRow[];
  totalCount: number;
  page: number;
  totalPages: number;
}> {
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * USER_PER_PAGE;
  const to = from + USER_PER_PAGE - 1;

  let q = supabase
    .from("users")
    .select("id, email, full_name, avatar_url, created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (opts.search?.trim()) {
    q = q.or(
      `full_name.ilike.%${opts.search.trim()}%,email.ilike.%${opts.search.trim()}%`,
    );
  }

  q = q.range(from, to);
  const { data: userRows, count } = await q;

  const users = (userRows ?? []) as {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
  }[];

  if (users.length === 0) {
    return { rows: [], totalCount: count ?? 0, page, totalPages: 0 };
  }

  const ids = users.map((u) => u.id);

  const [{ data: alumniData }, { data: adminData }] = await Promise.all([
    supabase
      .from("alumni_profiles")
      .select("user_id, school_id")
      .in("user_id", ids),
    supabase
      .from("school_admins")
      .select("user_id, role, schools(name)")
      .in("user_id", ids)
      .eq("status", "approved"),
  ]);

  const alumniCountByUser: Record<string, number> = {};
  for (const r of (alumniData ?? []) as { user_id: string }[]) {
    alumniCountByUser[r.user_id] = (alumniCountByUser[r.user_id] ?? 0) + 1;
  }

  type AdminRaw = {
    user_id: string;
    role: string;
    schools: { name: string } | { name: string }[] | null;
  };
  const adminRolesByUser: Record<string, { school_name: string; role: string }[]> = {};
  for (const r of (adminData ?? []) as unknown as AdminRaw[]) {
    const schoolName = Array.isArray(r.schools)
      ? (r.schools[0]?.name ?? "Unknown")
      : (r.schools?.name ?? "Unknown");
    if (!adminRolesByUser[r.user_id]) adminRolesByUser[r.user_id] = [];
    adminRolesByUser[r.user_id].push({
      school_name: schoolName,
      role: r.role,
    });
  }

  const totalCount = count ?? 0;
  return {
    rows: users.map((u) => ({
      ...u,
      alumni_count: alumniCountByUser[u.id] ?? 0,
      school_admin_roles: adminRolesByUser[u.id] ?? [],
    })),
    totalCount,
    page,
    totalPages: Math.ceil(totalCount / USER_PER_PAGE),
  };
}

/* ─── School admins (paginated) ───────────────────────────────────────── */
export async function fetchPaginatedSchoolAdmins(
  supabase: SupabaseClient,
  opts: { search?: string; schoolId?: string; page?: number },
): Promise<{
  rows: SchoolAdminRow[];
  totalCount: number;
  page: number;
  totalPages: number;
}> {
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * ADMIN_PER_PAGE;
  const to = from + ADMIN_PER_PAGE - 1;

  let q = supabase
    .from("school_admins")
    .select(
      "id, user_id, school_id, role, status, created_at, users(email, full_name), schools(name, slug)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (opts.schoolId) q = q.eq("school_id", opts.schoolId);
  q = q.range(from, to);

  const { data, count } = await q;

  type RawAdmin = {
    id: string;
    user_id: string;
    school_id: string;
    role: string;
    status: string;
    created_at: string;
    users: { email: string | null; full_name: string | null } | { email: string | null; full_name: string | null }[] | null;
    schools: { name: string; slug: string } | { name: string; slug: string }[] | null;
  };

  let rows = ((data ?? []) as unknown as RawAdmin[]).map((r) => {
    const user = Array.isArray(r.users) ? r.users[0] : r.users;
    const school = Array.isArray(r.schools) ? r.schools[0] : r.schools;
    return {
      id: r.id,
      user_id: r.user_id,
      school_id: r.school_id,
      role: r.role,
      status: r.status,
      created_at: r.created_at,
      user_email: user?.email ?? null,
      user_name: user?.full_name ?? null,
      school_name: school?.name ?? "Unknown",
      school_slug: school?.slug ?? "",
    };
  });

  if (opts.search?.trim()) {
    const s = opts.search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.user_name?.toLowerCase().includes(s) ||
        r.user_email?.toLowerCase().includes(s) ||
        r.school_name.toLowerCase().includes(s),
    );
  }

  const totalCount = count ?? 0;
  return {
    rows,
    totalCount,
    page,
    totalPages: Math.ceil(totalCount / ADMIN_PER_PAGE),
  };
}

/* ─── Platform settings ───────────────────────────────────────────────── */
export async function fetchPlatformSettings(
  supabase: SupabaseClient,
): Promise<PlatformSetting[]> {
  const { data } = await supabase
    .from("platform_settings")
    .select("key, value, label, hint")
    .order("key");
  return (data ?? []) as PlatformSetting[];
}
