"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/features/auth/lib/auth-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function markNotificationRead(
  notificationId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }
  revalidatePath("/dashboard/notifications");
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<
  { ok: true } | { ok: false; message: string }
> {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) {
    return { ok: false, message: error.message };
  }
  revalidatePath("/dashboard/notifications");
  return { ok: true };
}
