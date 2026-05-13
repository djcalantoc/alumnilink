import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ApprovalsStats,
  ReviewableProfileRow,
} from "@/features/alumni-approvals/lib/types";

export type {
  ApprovalsStats,
  PendingProfileRow,
  ReviewableProfileRow,
  RoutingStatus,
} from "@/features/alumni-approvals/lib/types";
export { getRoutingStatus } from "@/features/alumni-approvals/lib/types";

const PROFILE_FIELDS = `
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
  sections ( id, name ),
  users ( email, full_name )
`;

export async function fetchPendingProfilesForSchool(
  supabase: SupabaseClient,
  schoolId: string,
  filters: { batchId?: string; sectionId?: string },
): Promise<{ rows: ReviewableProfileRow[]; error: string | null }> {
  let q = supabase
    .from("alumni_profiles")
    .select(PROFILE_FIELDS)
    .eq("school_id", schoolId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (filters.batchId) q = q.eq("batch_id", filters.batchId);
  if (filters.sectionId) q = q.eq("section_id", filters.sectionId);

  const { data, error } = await q;
  if (error) return { rows: [], error: error.message };
  return { rows: (data ?? []) as unknown as ReviewableProfileRow[], error: null };
}

export async function fetchAllProfilesForSchool(
  supabase: SupabaseClient,
  schoolId: string,
  filters: {
    batchId?: string;
    sectionId?: string;
    statuses?: string[];
  } = {},
): Promise<{ rows: ReviewableProfileRow[]; error: string | null }> {
  const statuses = filters.statuses ?? ["pending", "approved", "rejected"];

  let q = supabase
    .from("alumni_profiles")
    .select(PROFILE_FIELDS)
    .eq("school_id", schoolId)
    .in("status", statuses)
    .order("created_at", { ascending: true });

  if (filters.batchId) q = q.eq("batch_id", filters.batchId);
  if (filters.sectionId) q = q.eq("section_id", filters.sectionId);

  const { data, error } = await q;
  if (error) return { rows: [], error: error.message };
  return { rows: (data ?? []) as unknown as ReviewableProfileRow[], error: null };
}

export async function fetchApprovalsStats(
  supabase: SupabaseClient,
  schoolId: string,
): Promise<{ data: ApprovalsStats | null; error: string | null }> {
  const { data, error } = await supabase
    .from("alumni_profiles")
    .select("status, section_id")
    .eq("school_id", schoolId);

  if (error) return { data: null, error: error.message };

  const rows = (data ?? []) as { status: string; section_id: string | null }[];
  const pending = rows.filter((r) => r.status === "pending");

  return {
    data: {
      total_pending: pending.length,
      needs_routing: pending.filter((r) => !r.section_id).length,
      ready_for_approval: pending.filter((r) => Boolean(r.section_id)).length,
      total_approved: rows.filter((r) => r.status === "approved").length,
    },
    error: null,
  };
}
