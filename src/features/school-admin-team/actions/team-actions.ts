"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthUser } from "@/features/auth/lib/auth-helpers";
import { isSuperAdmin } from "@/features/auth/lib/resolve-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type TeamActionResult = { ok: true } | { ok: false; error: string };

async function requireOwnerOrSuper(schoolId: string) {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) return { ok: false as const, error: "Not authenticated." };

  if (!isSuperAdmin(user)) {
    const { data } = await supabase
      .from("school_admins")
      .select("id")
      .eq("school_id", schoolId)
      .eq("user_id", user.id)
      .eq("status", "approved")
      .eq("role", "owner")
      .maybeSingle();

    if (!data) {
      return {
        ok: false as const,
        error: "Only school owners can manage the admin team.",
      };
    }
  }

  return { ok: true as const, supabase, user };
}

/* ─── Add admin (promote an alumni to admin/moderator) ───────────────── */
export async function addSchoolTeamMember(
  formData: FormData,
): Promise<TeamActionResult> {
  const parsed = z
    .object({
      school_id: z.string().uuid(),
      user_id: z.string().uuid(),
      role: z.enum(["admin", "moderator"]),
    })
    .safeParse({
      school_id: formData.get("school_id"),
      user_id: formData.get("user_id"),
      role: formData.get("role"),
    });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };

  const guard = await requireOwnerOrSuper(parsed.data.school_id);
  if (!guard.ok) return guard;

  const { supabase } = guard;

  const { data: existing } = await supabase
    .from("school_admins")
    .select("id, role")
    .eq("school_id", parsed.data.school_id)
    .eq("user_id", parsed.data.user_id)
    .maybeSingle();

  if (existing) {
    return {
      ok: false,
      error: `This user is already ${existing.role === "owner" ? "an owner" : "a team member"} of this school.`,
    };
  }

  const { error } = await supabase.from("school_admins").insert({
    user_id: parsed.data.user_id,
    school_id: parsed.data.school_id,
    role: parsed.data.role,
    status: "approved",
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/school-admin/team");
  return { ok: true };
}

/* ─── Change role ─────────────────────────────────────────────────────── */
export async function changeTeamMemberRole(
  formData: FormData,
): Promise<TeamActionResult> {
  const parsed = z
    .object({
      school_id: z.string().uuid(),
      admin_id: z.string().uuid(),
      role: z.enum(["owner", "admin", "moderator"]),
    })
    .safeParse({
      school_id: formData.get("school_id"),
      admin_id: formData.get("admin_id"),
      role: formData.get("role"),
    });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };

  const guard = await requireOwnerOrSuper(parsed.data.school_id);
  if (!guard.ok) return guard;

  const { error } = await guard.supabase
    .from("school_admins")
    .update({ role: parsed.data.role, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.admin_id)
    .eq("school_id", parsed.data.school_id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/school-admin/team");
  return { ok: true };
}

/* ─── Remove team member ─────────────────────────────────────────────── */
export async function removeTeamMember(
  formData: FormData,
): Promise<TeamActionResult> {
  const parsed = z
    .object({
      school_id: z.string().uuid(),
      admin_id: z.string().uuid(),
    })
    .safeParse({
      school_id: formData.get("school_id"),
      admin_id: formData.get("admin_id"),
    });
  if (!parsed.success) return { ok: false, error: "Invalid." };

  const guard = await requireOwnerOrSuper(parsed.data.school_id);
  if (!guard.ok) return guard;

  const { error } = await guard.supabase
    .from("school_admins")
    .delete()
    .eq("id", parsed.data.admin_id)
    .eq("school_id", parsed.data.school_id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/school-admin/team");
  return { ok: true };
}
