import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { ClassmateRow } from "@/features/classmate-discovery/lib/types";
import {
  aggregateResponses,
  fetchPublishedEventsForSchool,
  fetchResponsesForEvents,
} from "@/features/event-board/lib/queries";
import type { EventRow } from "@/features/event-board/lib/types";
import { formatEventWhen } from "@/features/event-board/lib/format";
import { fetchApprovedClassmatesForSchool } from "@/features/classmate-discovery/lib/queries";
import {
  countUnreadNotifications,
  fetchNotificationsForUser,
} from "@/features/notifications/lib/queries";
import type { NotificationRow } from "@/features/notifications/lib/types";
import { fetchApprovedMemoriesForSchool } from "@/features/memory-wall/lib/queries";
import { primaryImageUrl } from "@/features/memory-wall/lib/types";
import { applyDashboardMocks } from "@/features/dashboard/lib/dashboard-mock-fallbacks";

export type DashboardSchool = {
  id: string;
  name: string;
  slug: string;
  primaryColor: string | null;
};

export type DashboardUpcomingEvent = {
  event: EventRow;
  interested: number;
  going: number;
  whenPrimary: string;
  whenSecondary: string | null;
} | null;

export type DashboardMemoryHighlight = {
  id: string;
  caption: string | null;
  imageUrl: string | null;
  reactionsLabel: string | null;
};

export type DashboardActivityItem = {
  id: string;
  line: string;
  timeLabel: string;
};

function schoolQuerySuffix(school: DashboardSchool | null): string {
  return school ? `?schoolId=${school.id}` : "";
}

export function dashboardHref(
  path:
    | "/dashboard/school"
    | "/dashboard/batchmates"
    | "/dashboard/classmates"
    | "/dashboard/events"
    | "/dashboard/polls"
    | "/dashboard/network",
  school: DashboardSchool | null,
): string {
  return `${path}${schoolQuerySuffix(school)}`;
}

function formatActivityTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    if (sameDay) {
      return new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }).format(d);
    }
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(d);
  } catch {
    return "";
  }
}

function activityLine(n: NotificationRow): string {
  if (n.title?.trim()) {
    return n.title.trim();
  }
  switch (n.type) {
    case "say_hi":
      return "Someone waved hello 👋";
    case "memory_tag":
      return "You were tagged in a memory";
    case "poll_created":
      return "New poll to vote on";
    case "reconnect_request":
      return "Reconnect request";
    case "connection_request":
      return "Connection request";
    default:
      return "Something new on campus";
  }
}

async function fetchMemoryReactionLabels(
  supabase: SupabaseClient,
  memoryIds: string[],
): Promise<Map<string, string>> {
  if (memoryIds.length === 0) {
    return new Map();
  }
  const { data, error } = await supabase
    .from("reactions")
    .select("target_id, emoji")
    .eq("target_type", "memory")
    .in("target_id", memoryIds);

  if (error || !data) {
    return new Map();
  }

  const tallies = new Map<string, Map<string, number>>();
  for (const row of data as { target_id: string; emoji: string }[]) {
    if (!tallies.has(row.target_id)) {
      tallies.set(row.target_id, new Map());
    }
    const m = tallies.get(row.target_id)!;
    m.set(row.emoji, (m.get(row.emoji) ?? 0) + 1);
  }

  const out = new Map<string, string>();
  for (const [tid, emojiMap] of tallies) {
    const parts = [...emojiMap.entries()].map(([e, c]) => `${e} ${c}`);
    out.set(tid, parts.join(" · "));
  }
  return out;
}

export type AlumniDashboardMockFlags = {
  event?: boolean;
  memories?: boolean;
  activity?: boolean;
  people?: boolean;
};

export type AlumniDashboardData = {
  greetingName: string;
  school: DashboardSchool | null;
  exploreHref: string;
  /** @deprecated Use upcomingEvents */
  upcomingEvent: DashboardUpcomingEvent;
  /** Up to two next events for dashboard cards */
  upcomingEvents: DashboardUpcomingEvent[];
  unreadNotificationCount: number;
  memories: DashboardMemoryHighlight[];
  activity: DashboardActivityItem[];
  classmates: ClassmateRow[];
  mockFlags: AlumniDashboardMockFlags;
};

export type AlumniDashboardErrors = {
  events?: string;
  memories?: string;
  classmates?: string;
  notifications?: string;
};

export type AlumniDashboardLoadResult = {
  data: AlumniDashboardData;
  errors: AlumniDashboardErrors;
};

async function buildUpcomingEventDetail(
  supabase: SupabaseClient,
  user: User,
  pick: EventRow,
): Promise<DashboardUpcomingEvent> {
  const { rows: responses } = await fetchResponsesForEvents(supabase, [
    pick.id,
  ]);
  const { countsByEvent } = aggregateResponses(responses, user.id);
  const counts = countsByEvent.get(pick.id) ?? {
    going: 0,
    interested: 0,
    notGoing: 0,
  };
  const { primary, secondary } = formatEventWhen(pick.starts_at, pick.ends_at);
  return {
    event: pick,
    interested: counts.interested,
    going: counts.going,
    whenPrimary: primary,
    whenSecondary: secondary,
  };
}

export async function loadAlumniDashboard(
  supabase: SupabaseClient,
  user: User,
): Promise<AlumniDashboardLoadResult> {
  const errors: AlumniDashboardErrors = {};

  const { count: unreadNotifCount, error: unreadErr } =
    await countUnreadNotifications(supabase, user.id);
  const unreadNotificationCount =
    !unreadErr && typeof unreadNotifCount === "number"
      ? unreadNotifCount
      : 0;

  const { data: userRow } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const greetingName =
    userRow?.full_name?.trim() ||
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : null) ||
    user.email?.split("@")[0]?.trim() ||
    "Friend";

  const { data: profileRows } = await supabase
    .from("alumni_profiles")
    .select(
      `
      id,
      schools ( id, name, slug, primary_color )
    `,
    )
    .eq("user_id", user.id)
    .eq("status", "approved")
    .order("created_at", { ascending: true });

  const row0 = profileRows?.[0] as
    | {
        id: string;
        schools: {
          id: string;
          name: string;
          slug: string;
          primary_color: string | null;
        } | null;
      }
    | undefined;

  const school: DashboardSchool | null = row0?.schools
    ? {
        id: row0.schools.id,
        name: row0.schools.name,
        slug: row0.schools.slug,
        primaryColor: row0.schools.primary_color,
      }
    : null;

  const exploreHref = school
    ? `/dashboard/school?schoolId=${school.id}`
    : "/dashboard/profile";

  let upcomingEvent: DashboardUpcomingEvent = null;
  let upcomingEvents: DashboardUpcomingEvent[] = [];
  let memories: DashboardMemoryHighlight[] = [];
  let classmates: ClassmateRow[] = [];
  let activity: DashboardActivityItem[] = [];

  if (school) {
    const [{ rows: events, error: evErr }, { rows: notif, error: nErr }] =
      await Promise.all([
        fetchPublishedEventsForSchool(supabase, school.id),
        fetchNotificationsForUser(supabase, user.id, 14),
      ]);

    if (evErr) {
      errors.events = evErr;
    }
    if (nErr) {
      errors.notifications = nErr;
    }

    if (!evErr && events.length > 0) {
      const now = Date.now();
      const publishedUpcoming = events.filter(
        (e) =>
          e.status === "published" && new Date(e.starts_at).getTime() >= now,
      );
      const sorted = publishedUpcoming.sort(
        (a, b) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
      );
      const picks = sorted.slice(0, 2);
      if (picks.length > 0) {
        const details = await Promise.all(
          picks.map((p) => buildUpcomingEventDetail(supabase, user, p)),
        );
        upcomingEvents = details;
        upcomingEvent = details[0] ?? null;
      }
    }

    const { rows: memRows, error: mErr } =
      await fetchApprovedMemoriesForSchool(supabase, school.id);
    if (mErr) {
      errors.memories = mErr;
    }
    if (!mErr && memRows.length > 0) {
      const slice = memRows.slice(0, 6);
      const ids = slice.map((m) => m.id);
      const reactionLabels = await fetchMemoryReactionLabels(supabase, ids);
      memories = slice.map((m) => ({
        id: m.id,
        caption: m.body,
        imageUrl: primaryImageUrl(m.media_urls),
        reactionsLabel: reactionLabels.get(m.id) ?? null,
      }));
    }

    const { rows: classRows, error: cErr } =
      await fetchApprovedClassmatesForSchool(supabase, school.id, user.id);
    if (cErr) {
      errors.classmates = cErr;
    }
    if (!cErr && classRows.length > 0) {
      classmates = classRows.slice(0, 5);
    }

    if (!nErr && notif.length > 0) {
      activity = notif.map((n) => ({
        id: n.id,
        line: activityLine(n),
        timeLabel: formatActivityTime(n.created_at),
      }));
    }
  } else {
    const { rows: notif, error: nErr } = await fetchNotificationsForUser(
      supabase,
      user.id,
      10,
    );
    if (nErr) {
      errors.notifications = nErr;
    }
    if (!nErr && notif.length > 0) {
      activity = notif.map((n) => ({
        id: n.id,
        line: activityLine(n),
        timeLabel: formatActivityTime(n.created_at),
      }));
    }
  }

  const base: AlumniDashboardData = {
    greetingName,
    school,
    exploreHref,
    upcomingEvent,
    upcomingEvents,
    unreadNotificationCount,
    memories,
    activity,
    classmates,
    mockFlags: {},
  };

  const data = applyDashboardMocks(base, errors);

  return { data, errors };
}
