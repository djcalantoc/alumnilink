export type MemorySchoolOption = {
  id: string;
  name: string;
  slug: string;
};

export type MemoryStatus = "pending" | "approved" | "rejected" | "hidden";

export type MemoryRow = {
  id: string;
  school_id: string;
  author_user_id: string;
  title: string | null;
  body: string | null;
  media_urls: unknown;
  status: MemoryStatus;
  batch_id: string | null;
  section_id: string | null;
  created_at: string;
  updated_at: string;
};

export type MemoryWithRelations = MemoryRow & {
  schools: { id: string; name: string; slug: string } | null;
  batches: { id: string; name: string; graduation_year: number | null } | null;
  sections: { id: string; name: string } | null;
};

export function parseMediaUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((u): u is string => typeof u === "string" && u.length > 0);
}

export function primaryImageUrl(raw: unknown): string | null {
  const urls = parseMediaUrls(raw);
  return urls[0] ?? null;
}
