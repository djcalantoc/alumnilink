import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventRow, EventResponseValue, ResponseCounts } from "./types";

export async function fetchPublishedEventsForSchool(
  supabase: SupabaseClient,
  schoolId: string,
): Promise<{ rows: EventRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("school_id", schoolId)
    .in("status", ["published", "cancelled", "completed"])
    .order("starts_at", { ascending: true });

  if (error) {
    return { rows: [], error: error.message };
  }
  return { rows: (data ?? []) as EventRow[], error: null };
}

export async function fetchAllEventsForSchoolAdmin(
  supabase: SupabaseClient,
  schoolId: string,
): Promise<{ rows: EventRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("school_id", schoolId)
    .order("starts_at", { ascending: true });

  if (error) {
    return { rows: [], error: error.message };
  }
  return { rows: (data ?? []) as EventRow[], error: null };
}

export type ResponseRow = {
  event_id: string;
  response: EventResponseValue;
  user_id: string;
};

export async function fetchResponsesForEvents(
  supabase: SupabaseClient,
  eventIds: string[],
): Promise<{ rows: ResponseRow[]; error: string | null }> {
  if (eventIds.length === 0) {
    return { rows: [], error: null };
  }
  const { data, error } = await supabase
    .from("event_responses")
    .select("event_id, response, user_id")
    .in("event_id", eventIds);

  if (error) {
    return { rows: [], error: error.message };
  }
  return { rows: (data ?? []) as ResponseRow[], error: null };
}

export function aggregateResponses(
  responses: ResponseRow[],
  currentUserId: string,
): {
  countsByEvent: Map<string, ResponseCounts>;
  myResponseByEvent: Map<string, EventResponseValue>;
} {
  const countsByEvent = new Map<string, ResponseCounts>();
  const myResponseByEvent = new Map<string, EventResponseValue>();

  for (const r of responses) {
    if (r.user_id === currentUserId) {
      myResponseByEvent.set(r.event_id, r.response);
    }
    const cur = countsByEvent.get(r.event_id) ?? {
      going: 0,
      interested: 0,
      notGoing: 0,
    };
    if (r.response === "going") {
      cur.going += 1;
    } else if (r.response === "maybe") {
      cur.interested += 1;
    } else {
      cur.notGoing += 1;
    }
    countsByEvent.set(r.event_id, cur);
  }

  return { countsByEvent, myResponseByEvent };
}
