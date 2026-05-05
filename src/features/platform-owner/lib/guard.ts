import { redirect } from "next/navigation";
import {
  getAuthUser,
  isPlatformOwner,
} from "@/features/auth/lib/auth-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requirePlatformOwner() {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user || !isPlatformOwner(user)) {
    redirect("/dashboard");
  }
  return { supabase, user };
}
