import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClassmateRow } from "@/features/classmate-discovery/lib/types";

const PROFILE_SELECT = `
      id,
      user_id,
      display_name,
      photo_url,
      headline,
      location_city,
      location_country,
      social_url,
      batch_id,
      section_id,
      batches ( name, graduation_year ),
      sections ( name )
    `;

/** Whole school, same batch only, or same batch + section — all approved profiles except viewer. */
export type DirectoryFetchScope =
  | { kind: "school" }
  | { kind: "batch"; batchId: string }
  | { kind: "section"; batchId: string; sectionId: string };

export async function fetchApprovedDirectoryProfiles(
  supabase: SupabaseClient,
  schoolId: string,
  excludeUserId: string,
  fetchScope: DirectoryFetchScope,
): Promise<{ rows: ClassmateRow[]; error: string | null }> {
  let q = supabase
    .from("alumni_profiles")
    .select(PROFILE_SELECT)
    .eq("school_id", schoolId)
    .eq("status", "approved")
    .neq("user_id", excludeUserId);

  if (fetchScope.kind === "batch") {
    q = q.eq("batch_id", fetchScope.batchId);
  } else if (fetchScope.kind === "section") {
    q = q
      .eq("batch_id", fetchScope.batchId)
      .eq("section_id", fetchScope.sectionId);
  }

  const { data, error } = await q.order("display_name", {
    ascending: true,
    nullsFirst: false,
  });

  if (error) {
    return { rows: [], error: error.message };
  }

  return { rows: (data ?? []) as unknown as ClassmateRow[], error: null };
}

/** @deprecated Prefer fetchApprovedDirectoryProfiles — kept for call sites that mean “whole school”. */
export async function fetchApprovedClassmatesForSchool(
  supabase: SupabaseClient,
  schoolId: string,
  excludeUserId: string,
): Promise<{ rows: ClassmateRow[]; error: string | null }> {
  return fetchApprovedDirectoryProfiles(supabase, schoolId, excludeUserId, {
    kind: "school",
  });
}
