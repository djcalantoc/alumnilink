import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AuthLandingPath = "/owner" | "/admin" | "/school-admin" | "/dashboard";

export function isPlatformOwner(user: User): boolean {
  const appRole = user.app_metadata?.role;
  const metaRole = user.user_metadata?.global_role;
  return appRole === "owner" || metaRole === "owner";
}

export function isSuperAdmin(user: User): boolean {
  const appRole = user.app_metadata?.role;
  const metaRole = user.user_metadata?.global_role;
  return appRole === "super_admin" || metaRole === "super_admin";
}

export async function userHasApprovedSchoolAdmin(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("school_admins")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "approved")
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}

/**
 * Where to send someone after login / email confirmation.
 * Priority: platform owner → super_admin → school_admin → alumni.
 */
export async function resolveAuthLandingPath(
  supabase: SupabaseClient,
  user: User,
): Promise<AuthLandingPath> {
  if (isPlatformOwner(user)) {
    return "/owner";
  }

  if (isSuperAdmin(user)) {
    return "/admin";
  }

  const isSchoolAdmin = await userHasApprovedSchoolAdmin(supabase, user.id);
  if (isSchoolAdmin) {
    return "/school-admin";
  }

  return "/dashboard";
}
