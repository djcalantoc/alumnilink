"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin } from "@/features/super-admin-schools/lib/guard";

export type AdminActionResult =
  | { ok: true }
  | { ok: false; error: string };

/* ─── Remove school admin ─────────────────────────────────────────────── */
export async function removeSchoolAdmin(
  formData: FormData,
): Promise<AdminActionResult> {
  const parsed = z
    .object({ admin_id: z.string().uuid() })
    .safeParse({ admin_id: formData.get("admin_id") });
  if (!parsed.success) return { ok: false, error: "Invalid ID." };

  const { supabase } = await requireSuperAdmin();
  const { error } = await supabase
    .from("school_admins")
    .delete()
    .eq("id", parsed.data.admin_id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/school-admins");
  return { ok: true };
}

/* ─── Change school admin role ────────────────────────────────────────── */
export async function changeAdminRole(
  formData: FormData,
): Promise<AdminActionResult> {
  const parsed = z
    .object({
      admin_id: z.string().uuid(),
      role: z.enum(["owner", "admin", "moderator"]),
    })
    .safeParse({
      admin_id: formData.get("admin_id"),
      role: formData.get("role"),
    });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };

  const { supabase } = await requireSuperAdmin();
  const { error } = await supabase
    .from("school_admins")
    .update({ role: parsed.data.role, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.admin_id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/school-admins");
  return { ok: true };
}

/* ─── Assign new admin to school ──────────────────────────────────────── */
export async function assignSchoolAdmin(
  formData: FormData,
): Promise<AdminActionResult> {
  const parsed = z
    .object({
      user_id: z.string().uuid(),
      school_id: z.string().uuid(),
      role: z.enum(["owner", "admin", "moderator"]),
    })
    .safeParse({
      user_id: formData.get("user_id"),
      school_id: formData.get("school_id"),
      role: formData.get("role"),
    });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };

  const { supabase } = await requireSuperAdmin();

  const { data: existing } = await supabase
    .from("school_admins")
    .select("id")
    .eq("user_id", parsed.data.user_id)
    .eq("school_id", parsed.data.school_id)
    .maybeSingle();

  if (existing) {
    return {
      ok: false,
      error: "This user is already an admin for that school.",
    };
  }

  const { error } = await supabase.from("school_admins").insert({
    user_id: parsed.data.user_id,
    school_id: parsed.data.school_id,
    role: parsed.data.role,
    status: "approved",
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/school-admins");
  return { ok: true };
}

/* ─── Delete user alumni profile ──────────────────────────────────────── */
export async function deleteUserAlumniProfiles(
  formData: FormData,
): Promise<AdminActionResult> {
  const parsed = z
    .object({ user_id: z.string().uuid() })
    .safeParse({ user_id: formData.get("user_id") });
  if (!parsed.success) return { ok: false, error: "Invalid user ID." };

  const { supabase } = await requireSuperAdmin();
  const { error } = await supabase
    .from("alumni_profiles")
    .delete()
    .eq("user_id", parsed.data.user_id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/users");
  return { ok: true };
}

/* ─── Save platform setting ───────────────────────────────────────────── */
export async function savePlatformSetting(
  formData: FormData,
): Promise<AdminActionResult> {
  const parsed = z
    .object({ key: z.string().min(1), value: z.string() })
    .safeParse({ key: formData.get("key"), value: formData.get("value") ?? "" });
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  const { supabase, user } = await requireSuperAdmin();
  const { error } = await supabase
    .from("platform_settings")
    .update({
      value: parsed.data.value,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("key", parsed.data.key);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/settings");
  return { ok: true };
}
