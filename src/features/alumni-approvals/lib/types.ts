/** Shared types and pure helpers — safe to import in both server and client components. */

export type ReviewableProfileRow = {
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
  users: { email: string | null; full_name: string | null } | null;
};

/** @deprecated Use ReviewableProfileRow */
export type PendingProfileRow = ReviewableProfileRow;

export type RoutingStatus = "needs_routing" | "ready";

export function getRoutingStatus(row: ReviewableProfileRow): RoutingStatus {
  return row.section_id ? "ready" : "needs_routing";
}

export type ApprovalsStats = {
  total_pending: number;
  needs_routing: number;
  ready_for_approval: number;
  total_approved: number;
};
