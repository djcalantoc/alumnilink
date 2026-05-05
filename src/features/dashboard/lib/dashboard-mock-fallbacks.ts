import type { ClassmateRow } from "@/features/classmate-discovery/lib/types";
import type { EventRow } from "@/features/event-board/lib/types";
import { formatEventWhen } from "@/features/event-board/lib/format";
import type {
  AlumniDashboardData,
  AlumniDashboardErrors,
  DashboardActivityItem,
  DashboardMemoryHighlight,
  DashboardUpcomingEvent,
} from "@/features/dashboard/lib/load-alumni-dashboard";

const MOCK_EVENT_ROW = (schoolId: string): EventRow => ({
  id: "00000000-0000-4000-8000-000000000001",
  school_id: schoolId,
  title: "Spring reunion weekend",
  description: null,
  location: "Campus quad",
  starts_at: new Date(Date.now() + 86400000 * 21).toISOString(),
  ends_at: null,
  status: "published",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const MOCK_EVENT_ROW_2 = (schoolId: string): EventRow => ({
  id: "00000000-0000-4000-8000-000000000002",
  school_id: schoolId,
  title: "Career Mentorship Webinar",
  description: null,
  location: "Online via Zoom",
  starts_at: new Date(Date.now() + 86400000 * 24).toISOString(),
  ends_at: null,
  status: "published",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

function mockUpcomingDetail(
  ev: EventRow,
  interested: number,
  going: number,
): DashboardUpcomingEvent {
  const { primary, secondary } = formatEventWhen(ev.starts_at, ev.ends_at);
  return {
    event: ev,
    interested,
    going,
    whenPrimary: primary,
    whenSecondary: secondary,
  };
}

const MOCK_IMG_A =
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=80";
const MOCK_IMG_B =
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80";
const MOCK_IMG_C =
  "https://images.unsplash.com/photo-1627556704290-2b1e5857a1e1?auto=format&fit=crop&w=900&q=80";

const MOCK_MEMORIES: DashboardMemoryHighlight[] = [
  {
    id: "mock-m-1",
    caption: "Yearbook signing day 📚",
    imageUrl: MOCK_IMG_A,
    reactionsLabel: "👍 12 · 😂 3",
  },
  {
    id: "mock-m-2",
    caption: "Last day of class",
    imageUrl: MOCK_IMG_B,
    reactionsLabel: "👍 8 · 😂 2",
  },
  {
    id: "mock-m-3",
    caption: "Sports fest memories",
    imageUrl: MOCK_IMG_C,
    reactionsLabel: "😂 14 · 👍 6",
  },
];

const MOCK_ACTIVITY: DashboardActivityItem[] = [
  {
    id: "mock-a-1",
    line: "Maria joined your school directory",
    timeLabel: "Today",
  },
  {
    id: "mock-a-2",
    line: "John shared a new memory",
    timeLabel: "Yesterday",
  },
  {
    id: "mock-a-3",
    line: "Ana voted in the class poll",
    timeLabel: "Mon",
  },
];

function mockClassmates(): ClassmateRow[] {
  return [
    {
      id: "00000000-0000-4000-8000-000000000010",
      user_id: "00000000-0000-4000-8000-000000000020",
      display_name: "Alex Rivera",
      photo_url: null,
      headline: "Designer · NYC",
      location_city: null,
      location_country: null,
      social_url: null,
      batch_id: "mock-batch",
      section_id: null,
      batches: { name: "Batch 2016", graduation_year: 2016 },
      sections: { name: "Rizal" },
    },
    {
      id: "00000000-0000-4000-8000-000000000011",
      user_id: "00000000-0000-4000-8000-000000000021",
      display_name: "Sam Lee",
      photo_url: null,
      headline: null,
      location_city: null,
      location_country: null,
      social_url: null,
      batch_id: "mock-batch",
      section_id: null,
      batches: { name: "Batch 2016", graduation_year: 2016 },
      sections: null,
    },
    {
      id: "00000000-0000-4000-8000-000000000012",
      user_id: "00000000-0000-4000-8000-000000000022",
      display_name: "Jordan Cruz",
      photo_url: null,
      headline: "Teacher · Manila",
      location_city: null,
      location_country: null,
      social_url: null,
      batch_id: "mock-batch",
      section_id: null,
      batches: { name: "Batch 2015", graduation_year: 2015 },
      sections: { name: "Bonifacio" },
    },
  ];
}

/**
 * Fills empty dashboard sections with tasteful placeholders when loads succeed but data is thin.
 */
export function applyDashboardMocks(
  data: AlumniDashboardData,
  errors: AlumniDashboardErrors,
): AlumniDashboardData {
  const mockFlags = { ...data.mockFlags };

  if (!data.school) {
    if (data.activity.length === 0 && !errors.notifications) {
      return {
        ...data,
        activity: MOCK_ACTIVITY,
        mockFlags: { ...mockFlags, activity: true },
      };
    }
    return data;
  }

  const schoolId = data.school.id;
  let upcomingEvent = data.upcomingEvent;
  let upcomingEvents = data.upcomingEvents;
  let memories = data.memories;
  let activity = data.activity;
  let classmates = data.classmates;

  if (!upcomingEvent && !errors.events) {
    upcomingEvents = [
      mockUpcomingDetail(MOCK_EVENT_ROW(schoolId), 18, 42),
      mockUpcomingDetail(MOCK_EVENT_ROW_2(schoolId), 156, 0),
    ];
    upcomingEvent = upcomingEvents[0] ?? null;
    mockFlags.event = true;
  } else if (upcomingEvents.length === 0 && upcomingEvent) {
    upcomingEvents = [upcomingEvent];
  }

  if (memories.length === 0 && !errors.memories) {
    memories = MOCK_MEMORIES;
    mockFlags.memories = true;
  }

  if (activity.length === 0 && !errors.notifications) {
    activity = MOCK_ACTIVITY;
    mockFlags.activity = true;
  }

  if (classmates.length === 0 && !errors.classmates) {
    classmates = mockClassmates();
    mockFlags.people = true;
  }

  return {
    ...data,
    upcomingEvent,
    upcomingEvents,
    memories,
    activity,
    classmates,
    mockFlags,
  };
}
