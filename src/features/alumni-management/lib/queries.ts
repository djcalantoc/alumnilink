import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AlumniFilters,
  AlumniManagementStats,
  AlumniRecord,
  PaginatedAlumni,
  YearStat,
} from "@/features/alumni-management/lib/types";
import { PER_PAGE } from "@/features/alumni-management/lib/types";

const FIELDS = `
  id, user_id, school_id, batch_id, section_id,
  display_name, photo_url, headline,
  location_city, location_country, social_url,
  is_profile_public, status, created_at, updated_at,
  batches ( id, name, graduation_year ),
  sections ( id, name ),
  users ( email, full_name )
`;

export async function fetchAlumniManagementStats(
  supabase: SupabaseClient,
  schoolId: string,
): Promise<AlumniManagementStats> {
  const { data } = await supabase
    .from("alumni_profiles")
    .select("status, section_id")
    .eq("school_id", schoolId);

  const rows = (data ?? []) as { status: string; section_id: string | null }[];
  const pending = rows.filter((r) => r.status === "pending");

  return {
    total: rows.length,
    pending: pending.length,
    approved: rows.filter((r) => r.status === "approved").length,
    rejected: rows.filter((r) => r.status === "rejected").length,
    needs_routing: pending.filter((r) => !r.section_id).length,
  };
}

export async function fetchAlumniPerYear(
  supabase: SupabaseClient,
  schoolId: string,
): Promise<YearStat[]> {
  const { data: batches } = await supabase
    .from("batches")
    .select("id, name, graduation_year")
    .eq("school_id", schoolId)
    .order("graduation_year", { ascending: true });

  if (!batches || batches.length === 0) return [];

  const { data: profiles } = await supabase
    .from("alumni_profiles")
    .select("batch_id")
    .eq("school_id", schoolId)
    .eq("status", "approved");

  const countByBatch: Record<string, number> = {};
  for (const p of profiles ?? []) {
    const bid = (p as { batch_id: string }).batch_id;
    countByBatch[bid] = (countByBatch[bid] ?? 0) + 1;
  }

  return (
    batches as { id: string; name: string; graduation_year: number | null }[]
  )
    .filter((b) => (countByBatch[b.id] ?? 0) > 0)
    .map((b) => ({
      year: b.graduation_year,
      label:
        b.graduation_year != null
          ? String(b.graduation_year)
          : b.name.slice(0, 8),
      count: countByBatch[b.id] ?? 0,
    }));
}

export async function fetchPaginatedAlumni(
  supabase: SupabaseClient,
  schoolId: string,
  filters: AlumniFilters,
): Promise<PaginatedAlumni> {
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  let q = supabase
    .from("alumni_profiles")
    .select(FIELDS, { count: "exact" })
    .eq("school_id", schoolId);

  if (filters.status && filters.status !== "all") {
    q = q.eq("status", filters.status);
  }
  if (filters.batchId) q = q.eq("batch_id", filters.batchId);
  if (filters.sectionId) q = q.eq("section_id", filters.sectionId);
  if (filters.search?.trim()) {
    q = q.ilike("display_name", `%${filters.search.trim()}%`);
  }

  const sortDir = filters.sortDir === "asc";
  if (filters.sortBy === "name") {
    q = q.order("display_name", { ascending: sortDir });
  } else if (filters.sortBy === "batch") {
    q = q.order("batch_id", { ascending: sortDir });
  } else {
    q = q.order("created_at", { ascending: filters.sortBy === "date" && sortDir });
  }

  q = q.range(from, to);

  const { data, count, error } = await q;
  if (error) {
    return { rows: [], totalCount: 0, page, perPage: PER_PAGE, totalPages: 0 };
  }

  const totalCount = count ?? 0;
  return {
    rows: (data ?? []) as unknown as AlumniRecord[],
    totalCount,
    page,
    perPage: PER_PAGE,
    totalPages: Math.ceil(totalCount / PER_PAGE),
  };
}

export type { AlumniFilters, AlumniManagementStats, AlumniRecord, PaginatedAlumni, YearStat };
