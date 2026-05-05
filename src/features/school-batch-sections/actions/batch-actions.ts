"use server";

import { revalidatePath } from "next/cache";
import {
  assertCanManageSchool,
  requireSchoolAdminAreaUser,
} from "@/features/school-batch-sections/lib/access";
import { batchFormSchema } from "@/features/school-batch-sections/lib/schemas";

export type BatchActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function createBatch(formData: FormData): Promise<BatchActionResult> {
  const { supabase, user } = await requireSchoolAdminAreaUser();
  const raw = Object.fromEntries(formData.entries());
  const parsed = batchFormSchema.safeParse(raw);

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

  const { error } = await supabase.from("batches").insert({
    school_id: parsed.data.school_id,
    name: parsed.data.name,
    graduation_year: parsed.data.graduation_year,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "A batch with this name already exists for this school.",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/school-admin/batches");
  revalidatePath("/school-admin/sections");
  return { ok: true };
}

export async function updateBatch(formData: FormData): Promise<BatchActionResult> {
  const { supabase, user } = await requireSchoolAdminAreaUser();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { ok: false, error: "Missing batch." };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = batchFormSchema.safeParse(raw);

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

  const { error } = await supabase
    .from("batches")
    .update({
      name: parsed.data.name,
      graduation_year: parsed.data.graduation_year,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("school_id", parsed.data.school_id);

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "A batch with this name already exists for this school.",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/school-admin/batches");
  revalidatePath("/school-admin/sections");
  return { ok: true };
}

export async function deleteBatch(formData: FormData): Promise<BatchActionResult> {
  const { supabase, user } = await requireSchoolAdminAreaUser();
  const id = formData.get("id");
  const schoolId = formData.get("school_id");
  if (typeof id !== "string" || typeof schoolId !== "string") {
    return { ok: false, error: "Missing batch." };
  }

  const gate = await assertCanManageSchool(supabase, user, schoolId);
  if (!gate.ok) {
    return { ok: false, error: gate.message };
  }

  const { error } = await supabase
    .from("batches")
    .delete()
    .eq("id", id)
    .eq("school_id", schoolId);

  if (error) {
    if (error.code === "23503") {
      return {
        ok: false,
        error:
          "This batch cannot be deleted while alumni profiles still reference it.",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/school-admin/batches");
  revalidatePath("/school-admin/sections");
  return { ok: true };
}
