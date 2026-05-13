/** Shared types — safe to import in both server and client components. */

export type AlumniRecord = {
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

export type AlumniManagementStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  needs_routing: number;
};

export type YearStat = { year: number | null; label: string; count: number };

export type AlumniFilters = {
  search?: string;
  batchId?: string;
  sectionId?: string;
  status?: string;
  sortBy?: "name" | "date" | "batch";
  sortDir?: "asc" | "desc";
  page?: number;
};

export const PER_PAGE = 25;

export type PaginatedAlumni = {
  rows: AlumniRecord[];
  totalCount: number;
  page: number;
  perPage: number;
  totalPages: number;
};
