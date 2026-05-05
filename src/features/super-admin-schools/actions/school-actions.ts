"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import {
  schoolFormSchema,
  type SchoolFormValues,
} from "@/features/super-admin-schools/lib/school-schema";
import { requireSuperAdmin } from "@/features/super-admin-schools/lib/guard";

export type SchoolActionResult =
  | { ok: true; data?: { id?: string } }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

function fieldErrorsFromZod(
  err: z.ZodError<SchoolFormValues>,
): Record<string, string[]> {
  const flat = err.flatten().fieldErrors;
  const out: Record<string, string[]> = {};
  for (const [key, messages] of Object.entries(flat)) {
    if (messages?.length) {
      out[key] = messages;
    }
  }
  return out;
}

export async function createSchool(
  _prev: SchoolActionResult | null,
  formData: FormData,
): Promise<SchoolActionResult> {
  const { supabase } = await requireSuperAdmin();
  const raw = Object.fromEntries(formData.entries()) as Record<string, string>;
  const parsed = schoolFormSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const v = parsed.data;

  const { data, error } = await supabase
    .from("schools")
    .insert({
      name: v.name,
      short_name: v.short_name,
      slug: v.slug,
      school_type: v.school_type,
      address: v.address,
      city: v.city,
      primary_color: v.primary_color,
      secondary_color: v.secondary_color,
      visibility: v.visibility,
      status: v.status,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "That slug is already in use. Choose another.",
        fieldErrors: { slug: ["Slug must be unique."] },
      };
    }
    return { ok: false, error: error.message };
  }

  if (!data?.id) {
    return { ok: false, error: "School was not created." };
  }

  revalidatePath("/admin/schools");
  return { ok: true, data: { id: data.id } };
}

export async function updateSchool(
  schoolId: string,
  _prev: SchoolActionResult | null,
  formData: FormData,
): Promise<SchoolActionResult> {
  const { supabase } = await requireSuperAdmin();
  const raw = Object.fromEntries(formData.entries()) as Record<string, string>;
  const parsed = schoolFormSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const v = parsed.data;

  const { error } = await supabase
    .from("schools")
    .update({
      name: v.name,
      short_name: v.short_name,
      slug: v.slug,
      school_type: v.school_type,
      address: v.address,
      city: v.city,
      primary_color: v.primary_color,
      secondary_color: v.secondary_color,
      visibility: v.visibility,
      status: v.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", schoolId);

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "That slug is already in use.",
        fieldErrors: { slug: ["Slug must be unique."] },
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/schools");
  revalidatePath(`/admin/schools/${schoolId}`);
  return { ok: true };
}

const ALLOWED_IMAGE = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadSchoolImage(
  formData: FormData,
): Promise<
  | { ok: true; publicUrl: string; field: "logo_url" | "cover_photo_url" }
  | { ok: false; error: string }
> {
  const schoolId = formData.get("schoolId");
  const kind = formData.get("kind");
  const file = formData.get("file");

  if (typeof schoolId !== "string" || !schoolId) {
    return { ok: false, error: "Missing school." };
  }
  if (kind !== "logo" && kind !== "cover") {
    return { ok: false, error: "Invalid upload type." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose an image file." };
  }
  if (!ALLOWED_IMAGE.has(file.type)) {
    return { ok: false, error: "Use JPG, PNG, or WebP." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Image must be 5MB or smaller." };
  }

  const { supabase } = await requireSuperAdmin();
  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";
  const objectPath = `${schoolId}/${kind}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage
    .from("school-assets")
    .upload(objectPath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (upErr) {
    return { ok: false, error: upErr.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("school-assets").getPublicUrl(objectPath);

  const column = kind === "logo" ? "logo_url" : "cover_photo_url";
  const { error: dbErr } = await supabase
    .from("schools")
    .update({
      [column]: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", schoolId);

  if (dbErr) {
    return { ok: false, error: dbErr.message };
  }

  revalidatePath("/admin/schools");
  revalidatePath(`/admin/schools/${schoolId}`);
  return { ok: true, publicUrl, field: column };
}
