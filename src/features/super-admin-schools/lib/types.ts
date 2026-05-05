export type SchoolType =
  | "university"
  | "high_school"
  | "k12"
  | "vocational"
  | "other";

export type SchoolVisibility = "public" | "unlisted" | "private";

export type SchoolStatus = "pending_setup" | "active" | "inactive";

export type SchoolRow = {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  school_type: SchoolType;
  address: string | null;
  city: string | null;
  primary_color: string;
  secondary_color: string;
  visibility: SchoolVisibility;
  status: SchoolStatus;
  logo_url: string | null;
  cover_photo_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
