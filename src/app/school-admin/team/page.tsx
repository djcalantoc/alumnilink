import type { Metadata } from "next";
import {
  getAuthUser,
  requireAuthUser,
} from "@/features/auth/lib/auth-helpers";
import { resolveSchoolManagementContext } from "@/features/school-batch-sections/lib/access";
import { SchoolTeamManager } from "@/features/school-admin-team/components/school-team-manager";
import type { TeamMember, AlumniOption } from "@/features/school-admin-team/components/school-team-manager";
import { SchoolPicker } from "@/features/school-batch-sections/components/school-picker";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = { title: "Manage Team — School Admin" };

type Props = {
  searchParams: Promise<{ schoolId?: string }>;
};

export default async function SchoolAdminTeamPage({ searchParams }: Props) {
  const sp = await searchParams;
  const ctx = await resolveSchoolManagementContext(
    "/school-admin/team",
    sp.schoolId,
    { adminRoles: ["owner", "admin", "moderator"] },
  );

  if (!ctx.ok) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <PageHeader title="Manage Team" description="Admin team for your school." />
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400">
          {ctx.error}
        </div>
      </div>
    );
  }

  if ("pickSchool" in ctx && ctx.pickSchool) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <PageHeader title="Manage Team" description="Select a school to manage its team." />
        <SchoolPicker
          schools={ctx.schools}
          targetPath="/school-admin/team"
          title="Select a school"
          description="Choose which school's team you want to manage."
        />
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);

  if (!user) {
    return null;
  }

  const schoolId = ("schoolId" in ctx ? ctx.schoolId : undefined) as string;
  const school = ctx.schools.find((s) => s.id === schoolId);

  // Check if current user is owner (to show/hide edit controls)
  const { data: myRole } = await supabase
    .from("school_admins")
    .select("role")
    .eq("school_id", schoolId)
    .eq("user_id", user.id)
    .eq("status", "approved")
    .maybeSingle();

  const isOwner =
    myRole?.role === "owner" ||
    user.app_metadata?.role === "super_admin";

  // Fetch existing team members
  const { data: adminRows } = await supabase
    .from("school_admins")
    .select("id, user_id, role, status, created_at, users(email, full_name)")
    .eq("school_id", schoolId)
    .order("created_at");

  type AdminRaw = {
    id: string;
    user_id: string;
    role: string;
    status: string;
    created_at: string;
    users: { email: string | null; full_name: string | null } | { email: string | null; full_name: string | null }[] | null;
  };

  const members: TeamMember[] = ((adminRows ?? []) as unknown as AdminRaw[]).map((r) => {
    const u = Array.isArray(r.users) ? r.users[0] : r.users;
    return {
      id: r.id,
      user_id: r.user_id,
      role: r.role,
      status: r.status,
      created_at: r.created_at,
      user_email: u?.email ?? null,
      user_name: u?.full_name ?? null,
      is_self: r.user_id === user.id,
    };
  });

  // Fetch approved alumni to promote (exclude existing admins)
  const existingUserIds = new Set(members.map((m) => m.user_id));

  const { data: alumniRows } = await supabase
    .from("alumni_profiles")
    .select("user_id, users(email, full_name)")
    .eq("school_id", schoolId)
    .eq("status", "approved");

  type AlumniRaw = {
    user_id: string;
    users: { email: string | null; full_name: string | null } | { email: string | null; full_name: string | null }[] | null;
  };

  const alumni: AlumniOption[] = ((alumniRows ?? []) as unknown as AlumniRaw[])
    .filter((r) => !existingUserIds.has(r.user_id))
    .map((r) => {
      const u = Array.isArray(r.users) ? r.users[0] : r.users;
      return {
        user_id: r.user_id,
        user_name: u?.full_name ?? null,
        user_email: u?.email ?? null,
      };
    });

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeader
        title="Manage Team"
        description="Control who has admin or moderator access to this school."
      />
      <SchoolTeamManager
        schoolId={schoolId}
        schoolName={school?.name ?? "School"}
        members={members}
        alumni={alumni}
        isOwner={isOwner}
      />
    </div>
  );
}
