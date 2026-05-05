"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthUser } from "@/features/auth/lib/auth-helpers";
import { assertCanApproveAlumni } from "@/features/school-batch-sections/lib/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const decisionSchema = z.object({
  profile_id: z.string().uuid(),
  school_id: z.string().uuid(),
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
  if (!parsed.success) {
    return { ok: false, error: "Invalid request." };
  }

  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const gate = await assertCanApproveAlumni(
    supabase,
    user,
    parsed.data.school_id,
  );
  if (!gate.ok) {
    return { ok: false, error: gate.message };
  }

  const { error } = await supabase
    .from("alumni_profiles")
    .update({
      status: "approved",
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.profile_id)
    .eq("school_id", parsed.data.school_id)
    .eq("status", "pending");

  if (error) {
    return { ok: false, error: error.message };
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
  if (!parsed.success) {
    return { ok: false, error: "Invalid request." };
  }

  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const gate = await assertCanApproveAlumni(
    supabase,
    user,
    parsed.data.school_id,
  );
  if (!gate.ok) {
    return { ok: false, error: gate.message };
  }

  const { error } = await supabase
    .from("alumni_profiles")
    .update({
      status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.profile_id)
    .eq("school_id", parsed.data.school_id)
    .eq("status", "pending");

  if (error) {
    return { ok: false, error: error.message };
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
