import type { SupabaseClient } from "@supabase/supabase-js";

/** Client-callable notification (RLS allows type `say_hi` from actor to peer). */
export async function insertSayHiNotification(
  supabase: SupabaseClient,
  args: {
    recipientUserId: string;
    schoolId: string;
    actorUserId: string;
  },
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("notifications").insert({
    user_id: args.recipientUserId,
    school_id: args.schoolId,
    actor_user_id: args.actorUserId,
    type: "say_hi",
    title: "Someone said hi 👋",
    body: "A classmate sent you a quick hello.",
    payload: {},
  });
  return { error: error?.message ?? null };
}
