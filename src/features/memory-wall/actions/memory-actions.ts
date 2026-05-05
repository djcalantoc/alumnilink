"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthUser } from "@/features/auth/lib/auth-helpers";
import { createMemorySchema } from "@/features/memory-wall/lib/schema";
import { assertCanApproveAlumni } from "@/features/school-batch-sections/lib/access";
import {
  fetchBatchesForSchool,
  fetchSectionsForSchool,
} from "@/features/school-batch-sections/lib/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type MemoryActionResult = { ok: true } | { ok: false; error: string };

const ALLOWED_IMAGE = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

async function assertApprovedAlumniForSchool(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  schoolId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("alumni_profiles")
    .select("id")
    .eq("school_id", schoolId)
    .eq("user_id", userId)
    .eq("status", "approved")
    .maybeSingle();
  return Boolean(data);
}

async function assertSectionMatchesBatch(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  sectionId: string | null,
  batchId: string | null,
  schoolId: string,
): Promise<boolean> {
  if (!sectionId) {
    return true;
  }
  if (!batchId) {
    return false;
  }
  const { data } = await supabase
    .from("sections")
    .select("id")
    .eq("id", sectionId)
    .eq("batch_id", batchId)
    .eq("school_id", schoolId)
    .maybeSingle();
  return Boolean(data);
}

async function assertBatchMatchesSchool(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  batchId: string | null,
  schoolId: string,
): Promise<boolean> {
  if (!batchId) {
    return true;
  }
  const { data } = await supabase
    .from("batches")
    .select("id")
    .eq("id", batchId)
    .eq("school_id", schoolId)
    .maybeSingle();
  return Boolean(data);
}

export async function fetchMemoryFormOptions(
  schoolId: string,
): Promise<
  | {
      ok: true;
      batches: { id: string; name: string; graduation_year: number | null }[];
      sections: { id: string; name: string; batch_id: string }[];
    }
  | { ok: false; error: string }
> {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const ok = await assertApprovedAlumniForSchool(supabase, user.id, schoolId);
  if (!ok) {
    return { ok: false, error: "You are not an approved alumnus of this school." };
  }

  const [bRes, sRes] = await Promise.all([
    fetchBatchesForSchool(supabase, schoolId),
    fetchSectionsForSchool(supabase, schoolId),
  ]);

  if (bRes.error || sRes.error) {
    return {
      ok: false,
      error: bRes.error ?? sRes.error ?? "Could not load options.",
    };
  }

  return {
    ok: true,
    batches: bRes.data ?? [],
    sections: sRes.data ?? [],
  };
}

export async function createMemory(
  formData: FormData,
): Promise<MemoryActionResult> {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) {
    return { ok: false, error: "Sign in to upload." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a photo." };
  }
  if (!ALLOWED_IMAGE.has(file.type)) {
    return { ok: false, error: "Use JPG, PNG, or WebP." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Image must be 5MB or smaller." };
  }

  const raw = Object.fromEntries(formData.entries()) as Record<string, string>;
  const parsed = createMemorySchema.safeParse({
    school_id: raw.school_id,
    batch_id: raw.batch_id,
    section_id: raw.section_id,
    caption: raw.caption,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const v = parsed.data;

  const memberOk = await assertApprovedAlumniForSchool(
    supabase,
    user.id,
    v.school_id,
  );
  if (!memberOk) {
    return { ok: false, error: "You cannot post memories for this school." };
  }

  const batchOk = await assertBatchMatchesSchool(
    supabase,
    v.batch_id,
    v.school_id,
  );
  if (!batchOk) {
    return { ok: false, error: "Invalid batch for this school." };
  }

  const sectionOk = await assertSectionMatchesBatch(
    supabase,
    v.section_id,
    v.batch_id,
    v.school_id,
  );
  if (!sectionOk) {
    return { ok: false, error: "Invalid section for the selected batch." };
  }

  const ext =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const objectPath = `${user.id}/memory-${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage
    .from("school-memory-photos")
    .upload(objectPath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (upErr) {
    return { ok: false, error: upErr.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("school-memory-photos").getPublicUrl(objectPath);

  const { error: insErr } = await supabase.from("memories").insert({
    school_id: v.school_id,
    author_user_id: user.id,
    title: null,
    body: v.caption,
    media_urls: [publicUrl],
    status: "pending",
    batch_id: v.batch_id,
    section_id: v.section_id,
  });

  if (insErr) {
    return { ok: false, error: insErr.message };
  }

  const { data: schoolRow } = await supabase
    .from("schools")
    .select("slug")
    .eq("id", v.school_id)
    .maybeSingle();

  revalidatePath("/dashboard/memories");
  revalidatePath("/school-admin/memories");
  if (schoolRow?.slug) {
    revalidatePath(`/s/${schoolRow.slug}/memories`);
  }

  return { ok: true };
}

const moderateSchema = z.object({
  memory_id: z.string().uuid(),
  school_id: z.string().uuid(),
});

export async function approveMemory(
  formData: FormData,
): Promise<MemoryActionResult> {
  const parsed = moderateSchema.safeParse({
    memory_id: formData.get("memory_id"),
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
    .from("memories")
    .update({
      status: "approved",
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.memory_id)
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

  revalidatePath("/dashboard/memories");
  revalidatePath("/school-admin/memories");
  if (schoolRow?.slug) {
    revalidatePath(`/s/${schoolRow.slug}/memories`);
  }

  return { ok: true };
}

export async function rejectMemory(
  formData: FormData,
): Promise<MemoryActionResult> {
  const parsed = moderateSchema.safeParse({
    memory_id: formData.get("memory_id"),
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
    .from("memories")
    .update({
      status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.memory_id)
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

  revalidatePath("/dashboard/memories");
  revalidatePath("/school-admin/memories");
  if (schoolRow?.slug) {
    revalidatePath(`/s/${schoolRow.slug}/memories`);
  }

  return { ok: true };
}
