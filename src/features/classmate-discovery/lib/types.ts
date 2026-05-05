export type ClassmateRow = {
  id: string;
  user_id: string;
  display_name: string | null;
  photo_url: string | null;
  headline: string | null;
  location_city: string | null;
  location_country: string | null;
  social_url: string | null;
  batch_id: string;
  section_id: string | null;
  batches: { name: string; graduation_year: number | null } | null;
  sections: { name: string } | null;
};

export type ClassmateSchool = {
  id: string;
  name: string;
  slug: string;
};
