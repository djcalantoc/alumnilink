import Link from "next/link";
import { MemoryHighlights } from "@/components/member/MemoryHighlights";
import { MemberHero } from "@/components/member/MemberHero";
import {
  buildSocialStripItems,
  RecentSocialActivityStrip,
} from "@/components/member/RecentSocialActivityStrip";
import { NetworkPrompt } from "@/components/member/NetworkPrompt";
import { PeopleYouMayKnow } from "@/components/member/PeopleYouMayKnow";
import { QuickActionCard } from "@/components/member/QuickActionCard";
import { RecentActivity } from "@/components/member/RecentActivity";
import { UpcomingEvents } from "@/components/member/UpcomingEvents";
import { EmptyState } from "@/components/social/EmptyState";
import {
  dashboardHref,
  loadAlumniDashboard,
  type DashboardUpcomingEvent,
} from "@/features/dashboard/lib/load-alumni-dashboard";
import { getAuthUser } from "@/features/auth/lib/auth-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function DashboardHomeContent() {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);

  if (!user) {
    return null;
  }

  const { data, errors } = await loadAlumniDashboard(supabase, user);
  const {
    greetingName,
    school,
    exploreHref,
    upcomingEvents,
    memories,
    activity,
    classmates,
    mockFlags,
  } = data;

  const firstName =
    greetingName.trim().split(/\s+/)[0] ?? greetingName.trim() ?? "Friend";

  const memoriesWallHref = school
    ? `/s/${school.slug}/memories`
    : "/dashboard/memories";

  const upcomingEventsList = upcomingEvents.filter(
    (e): e is NonNullable<DashboardUpcomingEvent> => e != null,
  );

  const socialStripItems = buildSocialStripItems(activity);

  return (
    <div className="mx-auto max-w-[1440px] space-y-10 pb-6 lg:space-y-12">
      {/*
        Layout (member home):
        [ HERO + collage ] → [ SOCIAL ACTIVITY STRIP ] → [ QUICK ACTIONS (1 primary) ]
        → [ MAIN GRID: left = Events + Memories | right = Activity + People ] → [ NETWORK PROMPT ]
      */}
      <div className="space-y-6">
        <MemberHero
          firstName={firstName}
          exploreHref={exploreHref}
          primaryColor={school?.primaryColor}
          showProfileHint={!school}
        />
        <RecentSocialActivityStrip items={socialStripItems} />
      </div>

      <section aria-label="Quick actions">
        <h2 className="mb-5 text-xl font-bold tracking-tight text-[#0b1c30]">
          Quick actions
        </h2>
        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-3 pt-1 [scrollbar-width:thin] sm:-mx-0 sm:px-0 lg:grid lg:grid-cols-7 lg:gap-6 lg:overflow-visible lg:pb-0">
          <QuickActionCard
            variant="primary"
            href={dashboardHref("/dashboard/school", school)}
            icon="school"
            title="Your School"
          />
          <QuickActionCard
            href={dashboardHref("/dashboard/batchmates", school)}
            icon="groups"
            title="Batchmates"
            iconSurfaceClass="from-amber-50 via-orange-50 to-rose-100/80 text-amber-900 ring-amber-100/80"
          />
          <QuickActionCard
            href={dashboardHref("/dashboard/classmates", school)}
            icon="waving_hand"
            title="Classmates"
            iconSurfaceClass="from-emerald-50 via-teal-50 to-cyan-100/70 text-emerald-700 ring-emerald-100/75"
          />
          <QuickActionCard
            href="/dashboard/memories"
            icon="auto_stories"
            title="Memory Wall"
            iconSurfaceClass="from-pink-50 via-rose-50 to-fuchsia-100/90 text-rose-700 ring-pink-100/70"
          />
          <QuickActionCard
            href={dashboardHref("/dashboard/events", school)}
            icon="calendar_month"
            title="View Events"
            iconSurfaceClass="from-sky-50 via-blue-50 to-cyan-100/80 text-sky-700 ring-sky-100/75"
          />
          <QuickActionCard
            href={dashboardHref("/dashboard/polls", school)}
            icon="ballot"
            title="Join Polls"
            iconSurfaceClass="from-violet-50 via-purple-50 to-indigo-100/80 text-violet-700 ring-violet-100/75"
          />
          <QuickActionCard
            href={dashboardHref("/dashboard/network", school)}
            icon="public"
            title="Alumni Web"
            iconSurfaceClass="from-indigo-50 via-slate-50 to-blue-100/70 text-indigo-700 ring-indigo-100/70"
          />
        </div>
      </section>

      <div
        className="flex flex-col gap-10 lg:flex-row lg:gap-10"
        role="region"
        aria-label="Events, memories, activity, and people"
      >
        <div
          className="min-w-0 flex-1 space-y-10"
          role="region"
          aria-label="Events and memory highlights"
        >
          <UpcomingEvents
            school={school}
            events={upcomingEventsList}
            errorMessage={errors.events ?? null}
            isMock={Boolean(mockFlags.event)}
          />

          {errors.memories ? (
            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#0b1c30]">
                  Memory highlights
                </h2>
                <Link
                  href="/dashboard/memories"
                  className="text-sm font-bold text-indigo-600 hover:underline"
                >
                  Explore
                </Link>
              </div>
              <EmptyState
                icon="📸"
                title="Memories didn’t load"
                description={errors.memories}
                className="rounded-2xl border border-violet-100 bg-white py-10 shadow-lg"
                action={
                  <Link
                    href="/dashboard/memories"
                    className="text-sm font-bold text-indigo-600 underline-offset-4 hover:underline"
                  >
                    Memory wall
                  </Link>
                }
              />
            </section>
          ) : (
            <MemoryHighlights
              memories={memories}
              memoriesWallHref={memoriesWallHref}
              schoolLabel={school?.name ?? null}
              mockMemories={Boolean(mockFlags.memories)}
            />
          )}
        </div>

        <aside
          className="w-full shrink-0 space-y-8 lg:w-[320px] xl:w-80"
          aria-label="Recent activity and people you may know"
        >
          <RecentActivity
            items={activity}
            errorMessage={errors.notifications ?? null}
            isMock={Boolean(mockFlags.activity)}
          />
          <PeopleYouMayKnow
            school={school}
            classmates={classmates}
            interactionDisabled={Boolean(mockFlags.people)}
            errorMessage={errors.classmates ?? null}
          />
        </aside>
      </div>

      <NetworkPrompt school={school} />
    </div>
  );
}
