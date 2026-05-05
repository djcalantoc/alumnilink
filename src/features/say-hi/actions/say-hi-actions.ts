"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthUser } from "@/features/auth/lib/auth-helpers";
import { insertSayHiNotification } from "@/lib/notifications/peer-notification";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function sendSayHi(formData: FormData): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const schoolId = String(formData.get("school_id") ?? "");
  const toUserId = String(formData.get("to_user_id") ?? "");
  if (!z.string().uuid().safeParse(schoolId).success) {
    return { ok: false, error: "Invalid school." };
  }
  if (!z.string().uuid().safeParse(toUserId).success) {
    return { ok: false, error: "Invalid user." };
  }

  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }
  if (toUserId === user.id) {
    return { ok: false, error: "You cannot say hi to yourself." };
  }

  const { error: insErr } = await supabase.from("say_hi_events").insert({
    school_id: schoolId,
    from_user_id: user.id,
    to_user_id: toUserId,
  });

  if (insErr) {
    if (insErr.code === "23505") {
      return {
        ok: false,
        error: "You already said hi today. Try again tomorrow.",
      };
    }
    return { ok: false, error: insErr.message };
  }

  const { error: nErr } = await insertSayHiNotification(supabase, {
    recipientUserId: toUserId,
    schoolId,
    actorUserId: user.id,
  });
  if (nErr) {
    return { ok: false, error: nErr };
  }

  revalidatePath("/dashboard/school");
  revalidatePath("/dashboard/batchmates");
  revalidatePath("/dashboard/classmates");
  revalidatePath("/dashboard/notifications");
  return { ok: true };
}
