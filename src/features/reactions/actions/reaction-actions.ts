"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthUser } from "@/features/auth/lib/auth-helpers";
import {
  REACTION_EMOJIS,
  type ReactionEmoji,
} from "@/features/reactions/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function parseEmoji(raw: string): ReactionEmoji | null {
  return REACTION_EMOJIS.includes(raw as ReactionEmoji)
    ? (raw as ReactionEmoji)
    : null;
}

export async function setReaction(formData: FormData): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const targetType = String(formData.get("target_type") ?? "");
  const targetId = String(formData.get("target_id") ?? "");
  const schoolId = String(formData.get("school_id") ?? "");
  const emojiRaw = String(formData.get("emoji") ?? "").trim();

  if (!z.enum(["memory", "alumni_profile"]).safeParse(targetType).success) {
    return { ok: false, error: "Invalid target." };
  }
  if (!z.string().uuid().safeParse(targetId).success) {
    return { ok: false, error: "Invalid target id." };
  }
  if (!z.string().uuid().safeParse(schoolId).success) {
    return { ok: false, error: "Invalid school." };
  }

  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  if (emojiRaw === "" || emojiRaw === "clear") {
    const { error } = await supabase
      .from("reactions")
      .delete()
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .eq("user_id", user.id);
    if (error) {
      return { ok: false, error: error.message };
    }
    revalidatePath("/dashboard");
    revalidatePath("/s");
    return { ok: true };
  }

  const em = parseEmoji(emojiRaw);
  if (!em) {
    return { ok: false, error: "Invalid reaction." };
  }

  await supabase
    .from("reactions")
    .delete()
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("user_id", user.id);

  const { error } = await supabase.from("reactions").insert({
    school_id: schoolId,
    target_type: targetType,
    target_id: targetId,
    user_id: user.id,
    emoji: em,
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/dashboard");
  revalidatePath("/s");
  return { ok: true };
}
