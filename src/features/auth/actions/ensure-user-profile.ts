"use server";

import { getAuthUser } from "@/features/auth/lib/auth-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Ensures a `public.users` row exists (e.g. if the DB trigger was not applied yet).
 */
export async function ensurePublicUserProfile(
  fullName?: string | null,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const name =
    fullName ??
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null);

  const { error } = await supabase.from("users").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      full_name: name,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}
