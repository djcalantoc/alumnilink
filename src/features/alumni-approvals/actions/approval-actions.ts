"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthUser } from "@/features/auth/lib/auth-helpers";
import {
  assertCanApproveAlumni,
  assertCanManageSchool,
} from "@/features/school-batch-sections/lib/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const decisionSchema = z.object({
  profile_id: z.string().uuid(),
  school_id: z.string().uuid(),
});

const routeSchema = z.object({
  profile_id: z.string().uuid(),
  school_id: z.string().uuid(),
  batch_id: z.string().uuid(),
  section_id: z.string().uuid().nullable().optional(),
});

export type ApprovalActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function approveAlumniProfile(
  formData: FormData,
): Promise<ApprovalActionResult> {
  const parsed = decisionSchema.safeParse({
    profile_id: formData.get("profile_id"),
    school_id: formData.get("school_id"),
  });
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) return { ok: false, error: "Sign in required." };

  const gate = await assertCanApproveAlumni(supabase, user, parsed.data.school_id);
  if (!gate.ok) return { ok: false, error: gate.message };

  const { data: updated, error } = await supabase
    .from("alumni_profiles")
    .update({ status: "approved", updated_at: new Date().toISOString() })
    .eq("id", parsed.data.profile_id)
    .eq("school_id", parsed.data.school_id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!updated) {
    return {
      ok: false,
      error: "Could not approve profile. It may have already been reviewed or you lack permission.",
    };
  }

  const { data: schoolRow } = await supabase
    .from("schools")
    .select("slug")
    .eq("id", parsed.data.school_id)
    .maybeSingle();
  if (schoolRow?.slug) {
    revalidatePath(`/s/${schoolRow.slug}/directory`);
    revalidatePath(`/s/${schoolRow.slug}/join`);
  }

  revalidatePath("/school-admin/alumni-approvals");
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function rejectAlumniProfile(
  formData: FormData,
): Promise<ApprovalActionResult> {
  const parsed = decisionSchema.safeParse({
    profile_id: formData.get("profile_id"),
    school_id: formData.get("school_id"),
  });
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) return { ok: false, error: "Sign in required." };

  const gate = await assertCanApproveAlumni(supabase, user, parsed.data.school_id);
  if (!gate.ok) return { ok: false, error: gate.message };

  const { data: updated, error } = await supabase
    .from("alumni_profiles")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("id", parsed.data.profile_id)
    .eq("school_id", parsed.data.school_id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!updated) {
    return {
      ok: false,
      error: "Could not reject profile. It may have already been reviewed or you lack permission.",
    };
  }

  const { data: schoolRow } = await supabase
    .from("schools")
    .select("slug")
    .eq("id", parsed.data.school_id)
    .maybeSingle();
  if (schoolRow?.slug) {
    revalidatePath(`/s/${schoolRow.slug}/directory`);
    revalidatePath(`/s/${schoolRow.slug}/join`);
  }

  revalidatePath("/school-admin/alumni-approvals");
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function routeAlumniProfile(
  formData: FormData,
): Promise<ApprovalActionResult> {
  const raw = {
    profile_id: formData.get("profile_id"),
    school_id: formData.get("school_id"),
    batch_id: formData.get("batch_id"),
    section_id: formData.get("section_id") || null,
  };

  const parsed = routeSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) return { ok: false, error: "Sign in required." };

  const gate = await assertCanManageSchool(supabase, user, parsed.data.school_id);
  if (!gate.ok) return { ok: false, error: gate.message };

  const { data: updated, error } = await supabase
    .from("alumni_profiles")
    .update({
      batch_id: parsed.data.batch_id,
      section_id: parsed.data.section_id ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.profile_id)
    .eq("school_id", parsed.data.school_id)
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!updated) {
    return { ok: false, error: "Could not update profile. Check your permissions." };
  }

  revalidatePath("/school-admin/alumni-approvals");
  revalidatePath("/dashboard/profile");
  return { ok: true };
}
