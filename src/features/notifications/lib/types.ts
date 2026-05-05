export type NotificationType =
  | "memory_tag"
  | "say_hi"
  | "reconnect_request"
  | "reconnect_accepted"
  | "reconnect_declined"
  | "poll_created"
  | "connection_request"
  | "connection_accepted"
  | "connection_declined";

export type NotificationRow = {
  id: string;
  user_id: string;
  actor_user_id: string | null;
  school_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};
