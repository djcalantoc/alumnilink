"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { alumniProfileFormSchema } from "@/features/alumni-profile/lib/profile-schema";
import { ensurePublicUserProfile } from "@/features/auth/actions/ensure-user-profile";
import { getAuthUser } from "@/features/auth/lib/auth-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ProfileActionResult =
  | { ok: true; profileId: string }
  | { ok: false; error: string };

async function assertSectionMatchesBatch(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  sectionId: string | null,
  batchId: string,
  schoolId: string,
): Promise<boolean> {
  if (!sectionId) {
    return true;
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

export async function saveAlumniProfile(
  formData: FormData,
): Promise<ProfileActionResult> {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) {
    return { ok: false, error: "Sign in to continue." };
  }

  const profileIdRaw = formData.get("profile_id");
  const profileId =
    typeof profileIdRaw === "string" && profileIdRaw ? profileIdRaw : null;

  const raw = Object.fromEntries(formData.entries()) as Record<string, string>;
  const parsed = alumniProfileFormSchema.safeParse({
    ...raw,
    is_profile_public: raw.is_profile_public === "true",
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const v = parsed.data;
  const sectionId =
    typeof v.section_id === "string" && v.section_id !== ""
      ? v.section_id
      : null;

  const batchOk = await assertBatchMatchesSchool(
    supabase,
    v.batch_id,
    v.school_id,
  );
  if (!batchOk) {
    return { ok: false, error: "That batch does not belong to this school." };
  }

  const sectionOk = await assertSectionMatchesBatch(
    supabase,
    sectionId,
    v.batch_id,
    v.school_id,
  );
  if (!sectionOk) {
    return { ok: false, error: "That section does not belong to the batch." };
  }

  const ensured = await ensurePublicUserProfile(v.display_name);
  if (!ensured.ok) {
    return { ok: false, error: ensured.message };
  }

  if (profileId) {
    const { data: existing, error: fetchErr } = await supabase
      .from("alumni_profiles")
      .select("id, user_id")
      .eq("id", profileId)
      .maybeSingle();

    if (fetchErr || !existing || existing.user_id !== user.id) {
      return { ok: false, error: "Profile not found." };
    }

    const { error } = await supabase
      .from("alumni_profiles")
      .update({
        batch_id: v.batch_id,
        section_id: sectionId,
        display_name: v.display_name,
        headline: v.headline,
        location_city: v.location_city,
        location_country: v.location_country,
        social_url: v.social_url,
        is_profile_public: v.is_profile_public ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profileId)
      .eq("user_id", user.id);

    if (error) {
      return { ok: false, error: error.message };
    }

    const joinSlug = formData.get("revalidate_join_slug");
    if (typeof joinSlug === "string" && joinSlug) {
      revalidatePath(`/s/${joinSlug}/join`);
    }
    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard");
    return { ok: true, profileId };
  }

  const { data: dupe } = await supabase
    .from("alumni_profiles")
    .select("id")
    .eq("user_id", user.id)
    .eq("school_id", v.school_id)
    .maybeSingle();

  if (dupe) {
    return {
      ok: false,
      error: "You already have a profile for this school. Open your dashboard to edit it.",
    };
  }

  const { data: inserted, error: insErr } = await supabase
    .from("alumni_profiles")
    .insert({
      user_id: user.id,
      school_id: v.school_id,
      batch_id: v.batch_id,
      section_id: sectionId,
      display_name: v.display_name,
      headline: v.headline,
      location_city: v.location_city,
      location_country: v.location_country,
      social_url: v.social_url,
      is_profile_public: v.is_profile_public ?? false,
      status: "pending",
    })
    .select("id")
    .single();

  if (insErr) {
    return { ok: false, error: insErr.message };
  }

  if (!inserted?.id) {
    return { ok: false, error: "Could not create profile." };
  }

  const joinSlug = formData.get("revalidate_join_slug");
  if (typeof joinSlug === "string" && joinSlug) {
    revalidatePath(`/s/${joinSlug}/join`);
  }
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  return { ok: true, profileId: inserted.id };
}

const ALLOWED_IMAGE = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadAlumniProfilePhoto(
  formData: FormData,
): Promise<
  | { ok: true; publicUrl: string }
  | { ok: false; error: string }
> {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) {
    return { ok: false, error: "Sign in to continue." };
  }

  const profileId = formData.get("profile_id");
  const file = formData.get("file");

  if (typeof profileId !== "string" || !profileId) {
    return { ok: false, error: "Missing profile." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose an image." };
  }
  if (!ALLOWED_IMAGE.has(file.type)) {
    return { ok: false, error: "Use JPG, PNG, or WebP." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Image must be 5MB or smaller." };
  }

  const { data: row, error: rowErr } = await supabase
    .from("alumni_profiles")
    .select("id")
    .eq("id", profileId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (rowErr || !row) {
    return { ok: false, error: "Profile not found." };
  }

  const ext =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const objectPath = `${user.id}/profile-${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage
    .from("alumni-profile-photos")
    .upload(objectPath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (upErr) {
    return { ok: false, error: upErr.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("alumni-profile-photos").getPublicUrl(objectPath);

  const { error: dbErr } = await supabase
    .from("alumni_profiles")
    .update({
      photo_url: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId)
    .eq("user_id", user.id);

  if (dbErr) {
    return { ok: false, error: dbErr.message };
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  return { ok: true, publicUrl };
}
