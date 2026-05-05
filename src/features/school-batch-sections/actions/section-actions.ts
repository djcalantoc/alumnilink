"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  assertCanManageSchool,
  requireSchoolAdminAreaUser,
} from "@/features/school-batch-sections/lib/access";
import { sectionFormSchema } from "@/features/school-batch-sections/lib/schemas";

export type SectionActionResult =
  | { ok: true }
  | { ok: false; error: string };

async function assertBatchInSchool(
  supabase: SupabaseClient,
  batchId: string,
  schoolId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("batches")
    .select("id")
    .eq("id", batchId)
    .eq("school_id", schoolId)
    .maybeSingle();

  return Boolean(data);
}

export async function createSection(
  formData: FormData,
): Promise<SectionActionResult> {
  const { supabase, user } = await requireSchoolAdminAreaUser();
  const raw = Object.fromEntries(formData.entries());
  const parsed = sectionFormSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const gate = await assertCanManageSchool(supabase, user, parsed.data.school_id);
  if (!gate.ok) {
    return { ok: false, error: gate.message };
  }

  const batchOk = await assertBatchInSchool(
    supabase,
    parsed.data.batch_id,
    parsed.data.school_id,
  );
  if (!batchOk) {
    return { ok: false, error: "Batch does not belong to this school." };
  }

  const { error } = await supabase.from("sections").insert({
    school_id: parsed.data.school_id,
    batch_id: parsed.data.batch_id,
    name: parsed.data.name,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "A section with this name already exists in this batch.",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/school-admin/sections");
  return { ok: true };
}

export async function updateSection(
  formData: FormData,
): Promise<SectionActionResult> {
  const { supabase, user } = await requireSchoolAdminAreaUser();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { ok: false, error: "Missing section." };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = sectionFormSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const gate = await assertCanManageSchool(supabase, user, parsed.data.school_id);
  if (!gate.ok) {
    return { ok: false, error: gate.message };
  }

  const batchOk = await assertBatchInSchool(
    supabase,
    parsed.data.batch_id,
    parsed.data.school_id,
  );
  if (!batchOk) {
    return { ok: false, error: "Batch does not belong to this school." };
  }

  const { error } = await supabase
    .from("sections")
    .update({
      batch_id: parsed.data.batch_id,
      name: parsed.data.name,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("school_id", parsed.data.school_id);

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "A section with this name already exists in this batch.",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/school-admin/sections");
  return { ok: true };
}

export async function deleteSection(
  formData: FormData,
): Promise<SectionActionResult> {
  const { supabase, user } = await requireSchoolAdminAreaUser();
  const id = formData.get("id");
  const schoolId = formData.get("school_id");
  if (typeof id !== "string" || typeof schoolId !== "string") {
    return { ok: false, error: "Missing section." };
  }

  const gate = await assertCanManageSchool(supabase, user, schoolId);
  if (!gate.ok) {
    return { ok: false, error: gate.message };
  }

  const { error } = await supabase
    .from("sections")
    .delete()
    .eq("id", id)
    .eq("school_id", schoolId);

  if (error) {
    if (error.code === "23503") {
      return {
        ok: false,
        error:
          "This section cannot be deleted while alumni profiles still reference it.",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/school-admin/sections");
  return { ok: true };
}
