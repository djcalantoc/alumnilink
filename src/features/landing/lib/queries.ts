import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type LandingSchool = {
  id: string;
  name: string;
  slug: string;
  primary_color: string | null;
  cover_photo_url: string | null;
  visibility: string;
};

export type LandingMemoryPreview = {
  id: string;
  body: string | null;
  media_urls: unknown;
  schools: { name: string; slug: string } | null;
};

export async function fetchLandingSchools(
  supabase: SupabaseClient,
): Promise<{ rows: LandingSchool[]; error: string | null }> {
  const { data, error } = await supabase
    .from("schools")
    .select("id, name, slug, primary_color, cover_photo_url, visibility")
    .eq("status", "active")
    .eq("visibility", "public")
    .order("name")
    .limit(8);

  if (error) {
    return { rows: [], error: error.message };
  }
  return { rows: (data ?? []) as LandingSchool[], error: null };
}

export async function fetchLandingMemoryPreviews(
  supabase: SupabaseClient,
): Promise<{ rows: LandingMemoryPreview[]; error: string | null }> {
  const { data, error } = await supabase
    .from("memories")
    .select(
      `
      id,
      body,
      media_urls,
      schools ( name, slug )
    `,
    )
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(16);

  if (error) {
    return { rows: [], error: error.message };
  }
  return { rows: (data ?? []) as unknown as LandingMemoryPreview[], error: null };
}

export type LandingBatch = {
  id: string;
  name: string;
  graduation_year: number | null;
  school_id: string;
};

export type LandingStats = {
  alumniJoined: number;
  schools: number;
  memories: number;
  events: number;
};

const STAT_FALLBACK: LandingStats = {
  alumniJoined: 2400,
  schools: 52,
  memories: 680,
  events: 96,
};

export async function fetchLandingBatchesForSchools(
  supabase: SupabaseClient,
  schoolIds: string[],
): Promise<{ rows: LandingBatch[]; error: string | null }> {
  if (schoolIds.length === 0) {
    return { rows: [], error: null };
  }
  const { data, error } = await supabase
    .from("batches")
    .select("id, name, graduation_year, school_id")
    .in("school_id", schoolIds)
    .order("graduation_year", { ascending: false });

  if (error) {
    return { rows: [], error: error.message };
  }
  return { rows: (data ?? []) as LandingBatch[], error: null };
}

export async function fetchLandingStats(
  supabase: SupabaseClient,
): Promise<{ stats: LandingStats; error: string | null }> {
  const [
    { count: schoolsCount, error: sErr },
    { count: memoriesCount, error: mErr },
    { count: alumniCount, error: aErr },
    { count: eventsCount, error: eErr },
  ] = await Promise.all([
    supabase
      .from("schools")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .eq("visibility", "public"),
    supabase
      .from("memories")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("alumni_profiles")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .in("status", ["published", "completed"]),
  ]);

  const err = sErr?.message ?? mErr?.message ?? null;
  const stats: LandingStats = {
    schools:
      typeof schoolsCount === "number" && schoolsCount > 0
        ? schoolsCount
        : STAT_FALLBACK.schools,
    memories:
      typeof memoriesCount === "number" && memoriesCount > 0
        ? memoriesCount
        : STAT_FALLBACK.memories,
    alumniJoined:
      typeof alumniCount === "number" && alumniCount > 0
        ? alumniCount
        : STAT_FALLBACK.alumniJoined,
    events:
      typeof eventsCount === "number" && eventsCount > 0
        ? eventsCount
        : STAT_FALLBACK.events,
  };

  if (aErr || eErr) {
    if (typeof alumniCount !== "number" || alumniCount <= 0) {
      stats.alumniJoined = STAT_FALLBACK.alumniJoined;
    }
    if (typeof eventsCount !== "number" || eventsCount <= 0) {
      stats.events = STAT_FALLBACK.events;
    }
  }

  return { stats, error: err };
}
