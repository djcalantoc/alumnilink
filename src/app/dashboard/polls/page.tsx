import type { Metadata } from "next";
import Link from "next/link";
import { AlumniPollsPanel } from "@/features/polls/components/alumni-polls-panel";
import type { AlumniPollsBundle } from "@/features/polls/components/alumni-polls-panel";
import { resolveClassmateSchoolContext } from "@/features/classmate-discovery/lib/access";
import {
  fetchMyVotesForPollIds,
  fetchPollOptionsForPollIds,
  fetchPollsForSchool,
  fetchVisibleVoteRowsForPollIds,
} from "@/features/polls/lib/queries";
import type { AlumniPollContext } from "@/features/polls/lib/visibility";
import { SchoolPicker } from "@/features/school-batch-sections/components/school-picker";
import { getAuthUser } from "@/features/auth/lib/auth-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Polls",
};

type PageProps = {
  searchParams: Promise<{ schoolId?: string }>;
};

export default async function DashboardPollsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const requested = sp.schoolId?.trim() || undefined;

  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);

  if (!user) {
    return null;
  }

  const ctx = await resolveClassmateSchoolContext(
    "/dashboard/polls",
    requested,
  );

  if (!ctx.ok) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Polls
        </h1>
        <div
          className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          <p>{ctx.error}</p>
          <p className="mt-3">
            <Link
              href="/dashboard/profile"
              className="font-medium text-amber-950 underline-offset-4 hover:underline dark:text-amber-50"
            >
              View your profile
            </Link>
            {" · "}
            <Link
              href="/dashboard"
              className="font-medium text-amber-950 underline-offset-4 hover:underline dark:text-amber-50"
            >
              Dashboard
            </Link>
          </p>
        </div>
      </main>
    );
  }

  if ("pickSchool" in ctx) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <SchoolPicker
          schools={ctx.schools}
          targetPath="/dashboard/polls"
          title="Polls"
          description="Choose a school to see quick polls from your alumni community."
          actionLabel="View polls →"
        />
      </main>
    );
  }

  const { schoolId, schools } = ctx;
  const schoolMeta = schools.find((s) => s.id === schoolId);
  if (!schoolMeta) {
    return null;
  }

  const { data: profile, error: pErr } = await supabase
    .from("alumni_profiles")
    .select(
      `
      batch_id,
      section_id,
      batches ( name ),
      sections ( name )
    `,
    )
    .eq("user_id", user.id)
    .eq("school_id", schoolId)
    .eq("status", "approved")
    .maybeSingle();

  if (pErr || !profile) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {pErr?.message ?? "Could not load your alumni profile for this school."}
        </p>
      </main>
    );
  }

  const alumniCtx: AlumniPollContext = {
    batchId: profile.batch_id as string,
    sectionId: (profile.section_id as string | null) ?? null,
  };

  const batchRel = profile.batches as
    | { name: string }
    | { name: string }[]
    | null;
  const batchName = Array.isArray(batchRel)
    ? (batchRel[0]?.name ?? null)
    : (batchRel?.name ?? null);

  const sectionRel = profile.sections as
    | { name: string }
    | { name: string }[]
    | null;
  const sectionName = Array.isArray(sectionRel)
    ? (sectionRel[0]?.name ?? null)
    : (sectionRel?.name ?? null);

  const { rows: polls, error: pollsErr } = await fetchPollsForSchool(
    supabase,
    schoolId,
  );

  if (pollsErr) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {pollsErr}
        </p>
      </main>
    );
  }

  const pollIds = polls.map((p) => p.id);

  const [
    { byPoll: optionsByPoll, error: optErr },
    { byPoll: myVotes, error: voteErr },
    { rows: visibleVoteRows, error: visErr },
  ] = await Promise.all([
    fetchPollOptionsForPollIds(supabase, pollIds),
    fetchMyVotesForPollIds(supabase, pollIds, user.id),
    fetchVisibleVoteRowsForPollIds(supabase, pollIds),
  ]);

  if (optErr || voteErr || visErr) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {optErr ?? voteErr ?? visErr}
        </p>
      </main>
    );
  }

  const countsByPoll: Record<string, Record<string, number>> = {};
  for (const pollId of pollIds) {
    if (!myVotes[pollId]) {
      continue;
    }
    const tallies: Record<string, number> = {};
    for (const v of visibleVoteRows) {
      if (v.poll_id !== pollId) {
        continue;
      }
      tallies[v.option_id] = (tallies[v.option_id] ?? 0) + 1;
    }
    countsByPoll[pollId] = tallies;
  }

  const bundle: AlumniPollsBundle = {
    polls,
    optionsByPoll,
    myVotes,
    countsByPoll,
  };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            Polls
          </h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {schoolMeta.name} — quick votes, no feed.
          </p>
        </div>
        {schools.length > 1 ? (
          <Link
            href="/dashboard/polls"
            className="text-sm font-medium text-teal-800 underline-offset-4 hover:underline dark:text-teal-300"
          >
            Switch school
          </Link>
        ) : null}
      </div>

      <div className="mt-8">
        <AlumniPollsPanel
          bundle={bundle}
          alumniCtx={alumniCtx}
          batchName={batchName}
          sectionName={sectionName}
        />
      </div>
    </main>
  );
}
