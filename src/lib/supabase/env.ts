/**
 * Public Supabase URL + browser-safe API key for createBrowserClient / createServerClient.
 *
 * Use only static `process.env.NEXT_PUBLIC_*` reads so Next can inline values in the client
 * bundle and in Edge Middleware. Dynamic access like `process.env[name]` is broken there.
 */
export function getSupabasePublicEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url?.trim() || !anonKey?.trim()) {
    throw new Error(
      "Missing Supabase env: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) in .env.local.",
    );
  }
  return { url, anonKey };
}
