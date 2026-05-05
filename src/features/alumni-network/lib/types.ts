import { CONNECTION_TYPES } from "@/features/alumni-network/lib/constants";

export type ConnectionType = (typeof CONNECTION_TYPES)[number];

export type ConnectionStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "removed";

export type AlumniConnectionRow = {
  id: string;
  school_id: string;
  requester_profile_id: string;
  receiver_profile_id: string;
  connection_type: ConnectionType;
  status: ConnectionStatus;
  created_at: string;
  updated_at: string;
  accepted_at: string | null;
};

export type NetworkPrivacyRow = {
  id: string;
  alumni_profile_id: string;
  show_in_network_map: boolean;
  show_mutual_connections: boolean;
  allow_connection_requests: boolean;
  created_at: string;
  updated_at: string;
};

export type NetworkProfileNode = {
  id: string;
  user_id: string;
  display_name: string | null;
  photo_url: string | null;
  batch_id: string;
  section_id: string | null;
  batches: { name: string; graduation_year: number | null } | null;
  sections: { name: string } | null;
};

export type NetworkEdge = {
  id: string;
  requester_profile_id: string;
  receiver_profile_id: string;
  connection_type: ConnectionType;
};

export type MutualAnchor = {
  profile: NetworkProfileNode;
  /** Alumni you both know (may be multiple; we pick one label for the card). */
  viaSummary: string;
};
