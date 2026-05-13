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

export type BatchWithCounts = BatchRow & {
  section_count: number;
  alumni_count: number;
};

export type SectionWithBatch = SectionRow & {
  batch_name: string;
  batch_graduation_year: number | null;
  alumni_count: number;
};

export type SchoolAdminStats = {
  total_batches: number;
  total_sections: number;
  total_approved_alumni: number;
  total_pending_alumni: number;
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

export async function fetchBatchesWithCounts(
  supabase: SupabaseClient,
  schoolId: string,
): Promise<{ data: BatchWithCounts[] | null; error: string | null }> {
  const [batchRes, sectionRes, alumniRes] = await Promise.all([
    supabase
      .from("batches")
      .select("*")
      .eq("school_id", schoolId)
      .order("graduation_year", { ascending: false, nullsFirst: false })
      .order("name", { ascending: true }),
    supabase
      .from("sections")
      .select("id, batch_id")
      .eq("school_id", schoolId),
    supabase
      .from("alumni_profiles")
      .select("id, batch_id, status")
      .eq("school_id", schoolId),
  ]);

  if (batchRes.error) return { data: null, error: batchRes.error.message };

  const batches = (batchRes.data ?? []) as BatchRow[];
  const sections = (sectionRes.data ?? []) as { id: string; batch_id: string }[];
  const alumni = (alumniRes.data ?? []) as { id: string; batch_id: string; status: string }[];

  const sectionCountByBatch = new Map<string, number>();
  for (const s of sections) {
    sectionCountByBatch.set(s.batch_id, (sectionCountByBatch.get(s.batch_id) ?? 0) + 1);
  }

  const alumniCountByBatch = new Map<string, number>();
  for (const a of alumni) {
    if (a.status === "approved") {
      alumniCountByBatch.set(a.batch_id, (alumniCountByBatch.get(a.batch_id) ?? 0) + 1);
    }
  }

  const enriched: BatchWithCounts[] = batches.map((b) => ({
    ...b,
    section_count: sectionCountByBatch.get(b.id) ?? 0,
    alumni_count: alumniCountByBatch.get(b.id) ?? 0,
  }));

  return { data: enriched, error: null };
}

export async function fetchSectionsWithBatch(
  supabase: SupabaseClient,
  schoolId: string,
): Promise<{ data: SectionWithBatch[] | null; error: string | null }> {
  const [sectionRes, batchRes, alumniRes] = await Promise.all([
    supabase
      .from("sections")
      .select("*")
      .eq("school_id", schoolId)
      .order("name", { ascending: true }),
    supabase
      .from("batches")
      .select("id, name, graduation_year")
      .eq("school_id", schoolId),
    supabase
      .from("alumni_profiles")
      .select("id, section_id, status")
      .eq("school_id", schoolId)
      .not("section_id", "is", null),
  ]);

  if (sectionRes.error) return { data: null, error: sectionRes.error.message };

  const sections = (sectionRes.data ?? []) as SectionRow[];
  const batches = (batchRes.data ?? []) as { id: string; name: string; graduation_year: number | null }[];
  const alumni = (alumniRes.data ?? []) as { id: string; section_id: string | null; status: string }[];

  const batchById = new Map(batches.map((b) => [b.id, b]));

  const alumniCountBySection = new Map<string, number>();
  for (const a of alumni) {
    if (a.status === "approved" && a.section_id) {
      alumniCountBySection.set(a.section_id, (alumniCountBySection.get(a.section_id) ?? 0) + 1);
    }
  }

  const enriched: SectionWithBatch[] = sections.map((s) => {
    const batch = batchById.get(s.batch_id);
    return {
      ...s,
      batch_name: batch?.name ?? "Unknown batch",
      batch_graduation_year: batch?.graduation_year ?? null,
      alumni_count: alumniCountBySection.get(s.id) ?? 0,
    };
  });

  return { data: enriched, error: null };
}

export async function fetchSchoolAdminStats(
  supabase: SupabaseClient,
  schoolId: string,
): Promise<{ data: SchoolAdminStats | null; error: string | null }> {
  const [batchRes, sectionRes, alumniRes] = await Promise.all([
    supabase.from("batches").select("id", { count: "exact", head: true }).eq("school_id", schoolId),
    supabase.from("sections").select("id", { count: "exact", head: true }).eq("school_id", schoolId),
    supabase.from("alumni_profiles").select("id, status").eq("school_id", schoolId),
  ]);

  const alumni = (alumniRes.data ?? []) as { id: string; status: string }[];

  return {
    data: {
      total_batches: batchRes.count ?? 0,
      total_sections: sectionRes.count ?? 0,
      total_approved_alumni: alumni.filter((a) => a.status === "approved").length,
      total_pending_alumni: alumni.filter((a) => a.status === "pending").length,
    },
    error: batchRes.error?.message ?? sectionRes.error?.message ?? alumniRes.error?.message ?? null,
  };
}
