import { FinalCTA } from "@/components/landing/FinalCTA";
import { FloatingSearchCard } from "@/components/landing/FloatingSearchCard";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHero } from "@/components/landing/LandingHero";
import { MemoryPreviewGrid } from "@/components/landing/MemoryPreviewGrid";
import { StatsBar } from "@/components/landing/StatsBar";
import { WhyJoinCards } from "@/components/landing/WhyJoinCards";
import {
  MOCK_LANDING_BATCHES,
  MOCK_LANDING_MEMORIES,
  MOCK_LANDING_SCHOOLS,
} from "@/features/landing/lib/landing-mocks";
import {
  fetchLandingBatchesForSchools,
  fetchLandingMemoryPreviews,
  fetchLandingSchools,
  fetchLandingStats,
} from "@/features/landing/lib/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const [
    { rows: schools, error: schoolErr },
    { rows: memories, error: memErr },
    { stats, error: statsErr },
  ] = await Promise.all([
    fetchLandingSchools(supabase),
    fetchLandingMemoryPreviews(supabase),
    fetchLandingStats(supabase),
  ]);

  const useMockSchools = Boolean(schoolErr || schools.length === 0);
  const displaySchools = useMockSchools ? MOCK_LANDING_SCHOOLS : schools;

  const useMockMemories = Boolean(memErr || memories.length === 0);
  const displayMemories = useMockMemories
    ? MOCK_LANDING_MEMORIES
    : memories.slice(0, 16);

  const schoolIds = displaySchools.map((s) => s.id);
  const { rows: liveBatches, error: batchErr } =
    await fetchLandingBatchesForSchools(supabase, schoolIds);

  const mockBatchesInUse = displaySchools.some((s) =>
    s.id.startsWith("mock-school-"),
  );
  const displayBatches = [
    ...(batchErr ? [] : liveBatches),
    ...(mockBatchesInUse ? MOCK_LANDING_BATCHES : []),
  ];

  return (
    <main className="w-full flex-1 overflow-x-hidden bg-[#faf8ff]">
      <div className="relative">
        <LandingHero />

        <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="-mt-16 sm:-mt-20 md:-mt-24 lg:-mt-28">
            <FloatingSearchCard schools={displaySchools} batches={displayBatches} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-20 px-4 py-20 sm:px-6 lg:space-y-24 lg:px-8">
        {statsErr ? (
          <p
            className="text-center text-xs font-medium text-amber-800"
            role="status"
          >
            Live stats are still warming up — numbers blend what we can count
            with friendly estimates.
          </p>
        ) : null}

        <StatsBar stats={stats} />

        <section id="memories" className="scroll-mt-28">
          {memErr ? (
            <p
              className="mb-8 text-center text-xs font-medium text-amber-800/95"
              role="status"
            >
              Showing sample memories while we reconnect to the wall.
            </p>
          ) : null}
          <MemoryPreviewGrid memories={displayMemories} />
        </section>

        <section id="why-join" className="scroll-mt-28">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-balance text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              Why you&apos;ll actually open this
            </h2>
            <p className="mt-3 text-lg text-stone-600">
              Feels first. Paperwork never.
            </p>
          </div>
          <WhyJoinCards />
        </section>
      </div>

      <div className="mt-8">
        <FinalCTA />
      </div>

      <LandingFooter />
    </main>
  );
}
