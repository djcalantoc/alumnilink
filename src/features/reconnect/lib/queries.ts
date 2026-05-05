import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type PeerContact = {
  email: string | null;
  social: string | null;
};

export async function fetchAcceptedReconnectContacts(
  supabase: SupabaseClient,
  schoolId: string,
  viewerUserId: string,
): Promise<{ map: Record<string, PeerContact>; error: string | null }> {
  const { data, error } = await supabase
    .from("reconnect_requests")
    .select(
      "from_user_id, to_user_id, from_contact_email, to_contact_email, from_contact_social, to_contact_social",
    )
    .eq("school_id", schoolId)
    .eq("status", "accepted")
    .or(`from_user_id.eq.${viewerUserId},to_user_id.eq.${viewerUserId}`);

  if (error) {
    return { map: {}, error: error.message };
  }

  const map: Record<string, PeerContact> = {};
  for (const row of data ?? []) {
    const peer =
      row.from_user_id === viewerUserId ? row.to_user_id : row.from_user_id;
    const email =
      row.from_user_id === viewerUserId
        ? row.to_contact_email
        : row.from_contact_email;
    const social =
      row.from_user_id === viewerUserId
        ? row.to_contact_social
        : row.from_contact_social;
    map[peer] = { email: email ?? null, social: social ?? null };
  }
  return { map, error: null };
}

export type PendingReconnectRow = {
  id: string;
  from_user_id: string;
  created_at: string;
};

export async function fetchPendingReconnectIncoming(
  supabase: SupabaseClient,
  schoolId: string,
  viewerUserId: string,
): Promise<{ rows: PendingReconnectRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from("reconnect_requests")
    .select("id, from_user_id, created_at")
    .eq("school_id", schoolId)
    .eq("to_user_id", viewerUserId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    return { rows: [], error: error.message };
  }
  return { rows: (data ?? []) as PendingReconnectRow[], error: null };
}
