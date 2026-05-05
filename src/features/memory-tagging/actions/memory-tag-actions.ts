"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthUser } from "@/features/auth/lib/auth-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const tagSchema = z.object({
  memory_id: z.string().uuid(),
  school_id: z.string().uuid(),
  tagged_user_ids: z.array(z.string().uuid()).max(20),
});

export async function addMemoryTags(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = tagSchema.safeParse({
    memory_id: formData.get("memory_id"),
    school_id: formData.get("school_id"),
    tagged_user_ids: JSON.parse(
      String(formData.get("tagged_user_ids") ?? "[]"),
    ) as string[],
  });
  if (!parsed.success) {
    return { ok: false, error: "Invalid tag data." };
  }
  const { memory_id, school_id, tagged_user_ids } = parsed.data;
  const uniq = [...new Set(tagged_user_ids)];

  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  if (uniq.length === 0) {
    return { ok: true };
  }

  const rows = uniq
    .filter((id) => id !== user.id)
    .map((tagged_user_id) => ({
      memory_id,
      school_id,
      tagged_user_id,
      tagged_by_user_id: user.id,
    }));

  if (rows.length === 0) {
    return { ok: true };
  }

  const { data: existing } = await supabase
    .from("memory_tags")
    .select("tagged_user_id")
    .eq("memory_id", memory_id);
  const have = new Set((existing ?? []).map((r) => r.tagged_user_id));
  const toInsert = rows.filter((r) => !have.has(r.tagged_user_id));
  if (toInsert.length === 0) {
    return { ok: true };
  }

  const { error } = await supabase.from("memory_tags").insert(toInsert);

  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/dashboard/memories");
  revalidatePath("/s");
  return { ok: true };
}

export async function removeMemoryTagAdmin(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const tagId = String(formData.get("tag_id") ?? "");
  const schoolId = String(formData.get("school_id") ?? "");
  if (!z.string().uuid().safeParse(tagId).success) {
    return { ok: false, error: "Invalid tag." };
  }

  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { error } = await supabase
    .from("memory_tags")
    .delete()
    .eq("id", tagId)
    .eq("school_id", schoolId);

  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/school-admin/memories");
  revalidatePath("/dashboard/memories");
  revalidatePath("/s");
  return { ok: true };
}
