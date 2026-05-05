export type MemoryTagRow = {
  id: string;
  memory_id: string;
  school_id: string;
  tagged_user_id: string;
  tagged_by_user_id: string;
  created_at: string;
  users?: { full_name: string | null; email: string | null } | null;
};
