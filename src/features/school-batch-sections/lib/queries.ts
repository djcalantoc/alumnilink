import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type BatchRow = {
  id: string;
  school_id: string;
  name: string;
  graduation_year: number | null;
  created_at: string;
  updated_at: string;
};

export type SectionRow = {
  id: string;
  school_id: string;
  batch_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export async function fetchBatchesForSchool(
  supabase: SupabaseClient,
  schoolId: string,
): Promise<{ data: BatchRow[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from("batches")
    .select("*")
    .eq("school_id", schoolId)
    .order("graduation_year", { ascending: false, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as BatchRow[], error: null };
}

export async function fetchSectionsForSchool(
  supabase: SupabaseClient,
  schoolId: string,
): Promise<{ data: SectionRow[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from("sections")
    .select("*")
    .eq("school_id", schoolId)
    .order("batch_id", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as SectionRow[], error: null };
}
