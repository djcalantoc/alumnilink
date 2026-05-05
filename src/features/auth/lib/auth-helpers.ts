import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isPlatformOwner,
  isSuperAdmin,
  resolveAuthLandingPath,
  userHasApprovedSchoolAdmin,
  type AuthLandingPath,
} from "./resolve-redirect";

export type { AuthLandingPath };

export {
  isPlatformOwner,
  isSuperAdmin,
  resolveAuthLandingPath,
  userHasApprovedSchoolAdmin,
} from "./resolve-redirect";

/**
 * Returns the signed-in user or null. Prefer over getSession() on the server — validates the JWT with Supabase Auth.
 */
export async function getAuthUser(
  supabase: SupabaseClient,
): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }
  return user;
}

export async function requireAuthUser(
  supabase: SupabaseClient,
): Promise<User> {
  const user = await getAuthUser(supabase);
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}

export type AppRole =
  | "platform_owner"
  | "super_admin"
  | "school_admin"
  | "alumni";

export async function resolveAppRole(
  supabase: SupabaseClient,
  user: User,
): Promise<AppRole> {
  if (isPlatformOwner(user)) {
    return "platform_owner";
  }
  if (isSuperAdmin(user)) {
    return "super_admin";
  }
  if (await userHasApprovedSchoolAdmin(supabase, user.id)) {
    return "school_admin";
  }
  return "alumni";
}

export function landingPathForRole(role: AppRole): AuthLandingPath {
  switch (role) {
    case "platform_owner":
      return "/owner";
    case "super_admin":
      return "/admin";
    case "school_admin":
      return "/school-admin";
    default:
      return "/dashboard";
  }
}
