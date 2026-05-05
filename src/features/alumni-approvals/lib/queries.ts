import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type PendingProfileRow = {
  id: string;
  user_id: string;
  school_id: string;
  batch_id: string;
  section_id: string | null;
  display_name: string | null;
  photo_url: string | null;
  headline: string | null;
  location_city: string | null;
  location_country: string | null;
  social_url: string | null;
  is_profile_public: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  batches: { id: string; name: string; graduation_year: number | null } | null;
  sections: { id: string; name: string } | null;
};

export async function fetchPendingProfilesForSchool(
  supabase: SupabaseClient,
  schoolId: string,
  filters: { batchId?: string; sectionId?: string },
): Promise<{ rows: PendingProfileRow[]; error: string | null }> {
  let q = supabase
    .from("alumni_profiles")
    .select(
      `
      id,
      user_id,
      school_id,
      batch_id,
      section_id,
      display_name,
      photo_url,
      headline,
      location_city,
      location_country,
      social_url,
      is_profile_public,
      status,
      created_at,
      updated_at,
      batches ( id, name, graduation_year ),
      sections ( id, name )
    `,
    )
    .eq("school_id", schoolId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (filters.batchId) {
    q = q.eq("batch_id", filters.batchId);
  }
  if (filters.sectionId) {
    q = q.eq("section_id", filters.sectionId);
  }

  const { data, error } = await q;

  if (error) {
    return { rows: [], error: error.message };
  }

  return { rows: (data ?? []) as unknown as PendingProfileRow[], error: null };
}
