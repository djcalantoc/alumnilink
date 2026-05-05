import { redirect } from "next/navigation";
import { getAuthUser, isSuperAdmin } from "@/features/auth/lib/auth-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireSuperAdmin() {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user || !isSuperAdmin(user)) {
    redirect("/dashboard");
  }
  return { supabase, user };
}
