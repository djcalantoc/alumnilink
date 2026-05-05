import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationRow } from "@/features/notifications/lib/types";

export async function fetchNotificationsForUser(
  supabase: SupabaseClient,
  userId: string,
  limit = 50,
): Promise<{ rows: NotificationRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { rows: [], error: error.message };
  }
  return { rows: (data ?? []) as NotificationRow[], error: null };
}

export async function countUnreadNotifications(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ count: number; error: string | null }> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    return { count: 0, error: error.message };
  }
  return { count: count ?? 0, error: null };
}
