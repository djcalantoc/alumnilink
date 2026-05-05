import "server-only";

import { redirect } from "next/navigation";
import {
  getAuthUser,
  isSuperAdmin,
} from "@/features/auth/lib/auth-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AccessibleSchool = {
  id: string;
  name: string;
  slug: string;
};

export async function requireSchoolAdminAreaUser() {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) {
    redirect("/login?next=/school-admin");
  }

  if (isSuperAdmin(user)) {
    return { supabase, user, isSuperAdmin: true as const };
  }

  const { data: rows, error } = await supabase
    .from("school_admins")
    .select("school_id")
    .eq("user_id", user.id)
    .eq("status", "approved")
    .in("role", ["owner", "admin", "moderator"]);

  if (error || !rows?.length) {
    redirect("/dashboard");
  }

  return { supabase, user, isSuperAdmin: false as const };
}

export type SchoolAdminRole = "owner" | "admin" | "moderator";

export async function fetchAccessibleSchools(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  user: NonNullable<Awaited<ReturnType<typeof getAuthUser>>>,
  isSuper: boolean,
  roles: SchoolAdminRole[] = ["owner", "admin"],
): Promise<{ schools: AccessibleSchool[]; error: string | null }> {
  if (isSuper) {
    const { data, error } = await supabase
      .from("schools")
      .select("id, name, slug")
      .order("name", { ascending: true });

    if (error) {
      return { schools: [], error: error.message };
    }

    return {
      schools: (data ?? []) as AccessibleSchool[],
      error: null,
    };
  }

  const { data: links, error: linkErr } = await supabase
    .from("school_admins")
    .select("school_id")
    .eq("user_id", user.id)
    .eq("status", "approved")
    .in("role", roles);

  if (linkErr || !links?.length) {
    return {
      schools: [],
      error: linkErr?.message ?? "No schools to manage.",
    };
  }

  const ids = [...new Set(links.map((r) => r.school_id))];
  const { data: schools, error: schoolErr } = await supabase
    .from("schools")
    .select("id, name, slug")
    .in("id", ids)
    .order("name", { ascending: true });

  if (schoolErr) {
    return { schools: [], error: schoolErr.message };
  }

  return {
    schools: (schools ?? []) as AccessibleSchool[],
    error: null,
  };
}

export async function assertCanManageSchool(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  user: NonNullable<Awaited<ReturnType<typeof getAuthUser>>>,
  schoolId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (isSuperAdmin(user)) {
    return { ok: true };
  }

  const { data } = await supabase
    .from("school_admins")
    .select("id")
    .eq("school_id", schoolId)
    .eq("user_id", user.id)
    .eq("status", "approved")
    .in("role", ["owner", "admin"])
    .maybeSingle();

  if (!data) {
    return { ok: false, message: "You cannot manage this school." };
  }

  return { ok: true };
}

/**
 * Create/edit school events (owner, admin, or moderator). Super admin always allowed.
 */
export async function assertCanManageEvents(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  user: NonNullable<Awaited<ReturnType<typeof getAuthUser>>>,
  schoolId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (isSuperAdmin(user)) {
    return { ok: true };
  }

  const { data } = await supabase
    .from("school_admins")
    .select("id")
    .eq("school_id", schoolId)
    .eq("user_id", user.id)
    .eq("status", "approved")
    .in("role", ["owner", "admin", "moderator"])
    .maybeSingle();

  if (!data) {
    return {
      ok: false,
      message: "You cannot manage events for this school.",
    };
  }

  return { ok: true };
}

/**
 * Approve or reject alumni (owner, admin, or moderator). Super admin always allowed.
 */
export async function assertCanApproveAlumni(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  user: NonNullable<Awaited<ReturnType<typeof getAuthUser>>>,
  schoolId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (isSuperAdmin(user)) {
    return { ok: true };
  }

  const { data } = await supabase
    .from("school_admins")
    .select("id")
    .eq("school_id", schoolId)
    .eq("user_id", user.id)
    .eq("status", "approved")
    .in("role", ["owner", "admin", "moderator"])
    .maybeSingle();

  if (!data) {
    return {
      ok: false,
      message: "You cannot approve alumni for this school.",
    };
  }

  return { ok: true };
}

export type SchoolContextResult =
  | {
      ok: true;
      schoolId: string;
      schools: AccessibleSchool[];
    }
  | {
      ok: true;
      pickSchool: true;
      schools: AccessibleSchool[];
    }
  | { ok: false; error: string };

export async function resolveSchoolManagementContext(
  pathname: string,
  requestedSchoolId: string | undefined,
  options?: { adminRoles?: SchoolAdminRole[] },
): Promise<SchoolContextResult> {
  const { supabase, user, isSuperAdmin: superFlag } =
    await requireSchoolAdminAreaUser();

  const roles = options?.adminRoles ?? ["owner", "admin"];
  const { schools, error } = await fetchAccessibleSchools(
    supabase,
    user,
    superFlag,
    roles,
  );

  if (error) {
    return { ok: false, error };
  }

  if (!schools.length) {
    return {
      ok: false,
      error:
        "You do not have permission to manage batches for any school. Ask for owner or admin access.",
    };
  }

  if (requestedSchoolId && schools.some((s) => s.id === requestedSchoolId)) {
    return { ok: true, schoolId: requestedSchoolId, schools };
  }

  if (!requestedSchoolId && schools.length === 1) {
    redirect(`${pathname}?schoolId=${schools[0].id}`);
  }

  if (!requestedSchoolId && schools.length > 1) {
    return { ok: true, pickSchool: true, schools };
  }

  if (requestedSchoolId && !schools.some((s) => s.id === requestedSchoolId)) {
    return {
      ok: false,
      error: "That school is not available for your account.",
    };
  }

  return {
    ok: false,
    error: "Choose a school to continue.",
  };
}
