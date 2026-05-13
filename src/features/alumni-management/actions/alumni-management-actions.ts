"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthUser } from "@/features/auth/lib/auth-helpers";
import { assertCanManageSchool } from "@/features/school-batch-sections/lib/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ManagementActionResult =
  | { ok: true; count?: number }
  | { ok: false; error: string };

const schoolSchema = z.object({ school_id: z.string().uuid() });
const idsSchema = z.object({
  school_id: z.string().uuid(),
  profile_ids: z.array(z.string().uuid()).min(1).max(100),
});

async function getAdminSupabase(schoolId: string) {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) return { ok: false as const, error: "Sign in required." };
  const gate = await assertCanManageSchool(supabase, user, schoolId);
  if (!gate.ok) return { ok: false as const, error: gate.message };
  return { ok: true as const, supabase };
}

function revalidateAll() {
  revalidatePath("/school-admin/alumni");
  revalidatePath("/school-admin/alumni-approvals");
  revalidatePath("/dashboard");
}

/* ─── Bulk Approve ─────────────────────────────────────────────────────── */
export async function bulkApproveAlumni(
  formData: FormData,
): Promise<ManagementActionResult> {
  const raw = {
    school_id: formData.get("school_id"),
    profile_ids: formData.getAll("profile_ids[]"),
  };
  const parsed = idsSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };

  const ctx = await getAdminSupabase(parsed.data.school_id);
  if (!ctx.ok) return ctx;

  const { error, count } = await ctx.supabase
    .from("alumni_profiles")
    .update({ status: "approved", updated_at: new Date().toISOString() })
    .in("id", parsed.data.profile_ids)
    .eq("school_id", parsed.data.school_id)
    .eq("status", "pending");

  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true, count: count ?? parsed.data.profile_ids.length };
}

/* ─── Bulk Reject ──────────────────────────────────────────────────────── */
export async function bulkRejectAlumni(
  formData: FormData,
): Promise<ManagementActionResult> {
  const raw = {
    school_id: formData.get("school_id"),
    profile_ids: formData.getAll("profile_ids[]"),
  };
  const parsed = idsSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };

  const ctx = await getAdminSupabase(parsed.data.school_id);
  if (!ctx.ok) return ctx;

  const { error } = await ctx.supabase
    .from("alumni_profiles")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .in("id", parsed.data.profile_ids)
    .eq("school_id", parsed.data.school_id)
    .eq("status", "pending");

  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

/* ─── Delete single alumni profile ────────────────────────────────────── */
export async function deleteAlumniProfile(
  formData: FormData,
): Promise<ManagementActionResult> {
  const raw = {
    school_id: formData.get("school_id"),
    profile_id: formData.get("profile_id"),
  };
  const parsed = z
    .object({ school_id: z.string().uuid(), profile_id: z.string().uuid() })
    .safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const ctx = await getAdminSupabase(parsed.data.school_id);
  if (!ctx.ok) return ctx;

  const { error } = await ctx.supabase
    .from("alumni_profiles")
    .delete()
    .eq("id", parsed.data.profile_id)
    .eq("school_id", parsed.data.school_id);

  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

/* ─── Approve single (used from table row action) ─────────────────────── */
export async function approveSingleAlumni(
  formData: FormData,
): Promise<ManagementActionResult> {
  const raw = {
    school_id: formData.get("school_id"),
    profile_ids: [formData.get("profile_id")],
  };
  const parsed = idsSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  return bulkApproveAlumni(
    (() => {
      const fd = new FormData();
      fd.append("school_id", parsed.data.school_id);
      parsed.data.profile_ids.forEach((id) => fd.append("profile_ids[]", id));
      return fd;
    })(),
  );
}

/* ─── Reject single ───────────────────────────────────────────────────── */
export async function rejectSingleAlumni(
  formData: FormData,
): Promise<ManagementActionResult> {
  const raw = {
    school_id: formData.get("school_id"),
    profile_ids: [formData.get("profile_id")],
  };
  const parsed = idsSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  return bulkRejectAlumni(
    (() => {
      const fd = new FormData();
      fd.append("school_id", parsed.data.school_id);
      parsed.data.profile_ids.forEach((id) => fd.append("profile_ids[]", id));
      return fd;
    })(),
  );
}
