export type AlumniProfileRow = {
  id: string;
  user_id: string;
  school_id: string;
  batch_id: string;
  section_id: string | null;
  display_name: string | null;
  photo_url: string | null;
  headline: string | null;
  bio: string | null;
  location_city: string | null;
  location_country: string | null;
  social_url: string | null;
  is_profile_public: boolean;
  status: "pending" | "approved" | "rejected" | "archived";
  created_at: string;
  updated_at: string;
};

export type SchoolJoinMeta = {
  id: string;
  name: string;
  slug: string;
  status: string;
  visibility: string;
  primary_color: string | null;
  cover_photo_url: string | null;
};

export type BatchOption = {
  id: string;
  name: string;
  graduation_year: number | null;
};

export type SectionOption = {
  id: string;
  name: string;
  batch_id: string;
};
