import "server-only";

import { requireSuperAdmin } from "@/features/super-admin-schools/lib/guard";
import type { SchoolRow } from "@/features/super-admin-schools/lib/types";

export async function fetchAdminSchools(): Promise<{
  data: SchoolRow[] | null;
  error: string | null;
}> {
  const { supabase } = await requireSuperAdmin();
  const { data, error } = await supabase
    .from("schools")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as unknown as SchoolRow[], error: null };
}

export async function fetchAdminSchoolById(
  id: string,
): Promise<{ data: SchoolRow | null; error: string | null }> {
  const { supabase } = await requireSuperAdmin();
  const { data, error } = await supabase
    .from("schools")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data) {
    return { data: null, error: null };
  }

  return { data: data as unknown as SchoolRow, error: null };
}
