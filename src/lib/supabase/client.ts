import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/**
 * Browser client — stores the session in cookies (via @supabase/ssr) so Server Components and middleware see the same session.
 */
export function createSupabaseBrowserClient(): SupabaseClient {
  const { url, anonKey } = getSupabasePublicEnv();
  return createBrowserClient(url, anonKey);
}

/** @deprecated Use createSupabaseBrowserClient for auth-aware flows. */
export function createSupabaseClient(): SupabaseClient {
  return createSupabaseBrowserClient();
}
