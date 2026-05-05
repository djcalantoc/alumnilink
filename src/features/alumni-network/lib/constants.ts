export const CONNECTION_TYPES = [
  "classmate",
  "batchmate",
  "seatmate",
  "friend",
  "clubmate",
  "schoolmate",
  "other",
] as const;

export const CONNECTION_TYPE_LABELS: Record<
  (typeof CONNECTION_TYPES)[number],
  string
> = {
  classmate: "Classmate",
  batchmate: "Batchmate",
  seatmate: "Seatmate",
  friend: "Friend",
  clubmate: "Clubmate",
  schoolmate: "Schoolmate",
  other: "Other",
};

export const MAX_GRAPH_NODES = 72;
export const BATCH_WEB_GRAPH_NODES = 30;
export const SCHOOL_STATS_EDGE_SAMPLE = 2000;
export const SCHOOL_WEB_EDGE_AGG_SAMPLE = 3500;
