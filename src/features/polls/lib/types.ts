export type PollType = "nostalgic" | "event" | "batch";

export type PollStatus = "open" | "closed";

export type PollRow = {
  id: string;
  school_id: string;
  created_by_user_id: string;
  poll_type: PollType;
  title: string;
  description: string | null;
  batch_id: string | null;
  section_id: string | null;
  status: PollStatus;
  created_at: string;
  updated_at: string;
};

export type PollOptionRow = {
  id: string;
  poll_id: string;
  label: string;
  sort_order: number;
};
