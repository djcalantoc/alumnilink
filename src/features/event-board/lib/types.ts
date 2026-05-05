export type EventStatus = "draft" | "published" | "cancelled" | "completed";

export type EventResponseValue = "going" | "maybe" | "not_going";

export type EventRow = {
  id: string;
  school_id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  status: EventStatus;
  created_at: string;
  updated_at: string;
};

export type EventSchoolOption = {
  id: string;
  name: string;
  slug: string;
};

export type ResponseCounts = {
  going: number;
  interested: number;
  notGoing: number;
};
