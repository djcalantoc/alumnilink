import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { NetworkWebClient } from "@/features/alumni-network/components/network-web-client";
import type { NetworkWebTab } from "@/features/alumni-network/components/network-web-client";
import { resolveClassmateSchoolContext } from "@/features/classmate-discovery/lib/access";
import {
  buildBatchWebSubgraph,
  buildSubgraphAroundProfile,
  fetchIncomingConnectionRequests,
  fetchMutualConnectionsForViewer,
  fetchMyNetworkPrivacy,
  fetchProfilesByIds,
  fetchSchoolWebAggregatePayload,
} from "@/features/alumni-network/lib/queries";
import { SchoolPicker } from "@/features/school-batch-sections/components/school-picker";
import {
  fetchBatchesForSchool,
  fetchSectionsForSchool,
} from "@/features/school-batch-sections/lib/queries";
import { getAuthUser } from "@/features/auth/lib/auth-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Your Alumni Web",
};

type PageProps = {
  searchParams: Promise<{
    schoolId?: string;
    view?: string;
    batchId?: string;
    sectionId?: string;
  }>;
};

function NetworkLoadingFallback() {
  return (
    <div
      className="animate-pulse rounded-3xl bg-gradient-to-br from-violet-100/60 to-teal-100/40 px-4 py-16 sm:px-6"
      aria-busy="true"
      aria-label="Loading alumni web"
    />
  );
}

export default async function DashboardNetworkPage({
  searchParams,
}: PageProps) {
  const sp = await searchParams;
  const requested = sp.schoolId?.trim() || undefined;

  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) {
    return null;
  }

  const ctx = await resolveClassmateSchoolContext(
    "/dashboard/network",
    requested,
  );

  if (!ctx.ok) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Alumni web
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
          targetPath="/dashboard/network"
          title="Your Alumni Web"
          description="Choose a school to explore your connection maps."
          actionLabel="Open map →"
        />
      </main>
    );
  }

  const { schoolId, schools } = ctx;
  const schoolMeta = schools.find((s) => s.id === schoolId);
  if (!schoolMeta) {
    return null;
  }

  const rawView = sp.view?.trim().toLowerCase();
  const initialTab: NetworkWebTab =
    rawView === "batch" || rawView === "school" || rawView === "my"
      ? rawView
      : "my";

  const { data: myProf, error: mpErr } = await supabase
    .from("alumni_profiles")
    .select("id, batch_id, section_id")
    .eq("user_id", user.id)
    .eq("school_id", schoolId)
    .eq("status", "approved")
    .maybeSingle();

  if (mpErr || !myProf) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {mpErr?.message ?? "No approved profile at this school."}
        </p>
      </main>
    );
  }

  const myProfileId = myProf.id as string;
  const viewerBatchId = (myProf.batch_id as string | null) ?? null;
  const requestedBatchId = sp.batchId?.trim() || undefined;
  const requestedSectionId = sp.sectionId?.trim() || undefined;

  const [
    subgraphRes,
    mutualRes,
    { rows: incoming, error: inErr },
    { row: privacyRow, error: prErr },
    { data: batches, error: bErr },
    { data: sections, error: sErr },
    schoolAggRes,
  ] = await Promise.all([
    buildSubgraphAroundProfile(supabase, schoolId, myProfileId, 3, {
      connectionTypes: null,
    }),
    fetchMutualConnectionsForViewer(supabase, schoolId, myProfileId),
    fetchIncomingConnectionRequests(supabase, schoolId, myProfileId),
    fetchMyNetworkPrivacy(supabase, myProfileId),
    fetchBatchesForSchool(supabase, schoolId),
    fetchSectionsForSchool(supabase, schoolId),
    fetchSchoolWebAggregatePayload(supabase, schoolId),
  ]);

  const mutuals = mutualRes.anchors;
  const mutErr = mutualRes.error;

  const batchOptions = (batches ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    year: b.graduation_year,
  }));
  const sectionOptions = (sections ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    batchId: s.batch_id,
  }));

  const fallbackBatchId = batchOptions[0]?.id ?? null;
  const selectedBatchId =
    requestedBatchId &&
    batchOptions.some((b) => b.id === requestedBatchId)
      ? requestedBatchId
      : viewerBatchId ?? fallbackBatchId;

  const selectedSectionId =
    requestedSectionId &&
    sectionOptions.some((s) => s.id === requestedSectionId)
      ? requestedSectionId
      : null;

  let batchWebPayload: Awaited<
    ReturnType<typeof buildBatchWebSubgraph>
  > | null = null;
  let batchProfilesMap: Awaited<
    ReturnType<typeof fetchProfilesByIds>
  >["map"] = {};

  if (selectedBatchId) {
    batchWebPayload = await buildBatchWebSubgraph(
      supabase,
      schoolId,
      selectedBatchId,
      selectedSectionId,
      myProfileId,
    );
    if (!batchWebPayload.error && batchWebPayload.subgraph.profileIds.length) {
      const pf = await fetchProfilesByIds(
        supabase,
        schoolId,
        batchWebPayload.subgraph.profileIds,
      );
      if (!pf.error) {
        batchProfilesMap = pf.map;
      }
    }
  }

  const err =
    subgraphRes.error ??
    mutErr ??
    inErr ??
    prErr ??
    bErr ??
    sErr ??
    schoolAggRes.error ??
    batchWebPayload?.error;
  if (err || !subgraphRes.result) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {err ?? "Could not load network."}
        </p>
      </main>
    );
  }

  const { map: profiles, error: pErr } = await fetchProfilesByIds(
    supabase,
    schoolId,
    subgraphRes.result.profileIds,
  );
  if (pErr) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {pErr}
        </p>
      </main>
    );
  }

  const requesterIds = [...new Set(incoming.map((r) => r.requester_profile_id))];
  const { map: requesterProfiles, error: rqErr } = await fetchProfilesByIds(
    supabase,
    schoolId,
    requesterIds,
  );
  if (rqErr) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {rqErr}
        </p>
      </main>
    );
  }

  const batchWeb =
    selectedBatchId &&
    batchWebPayload &&
    !batchWebPayload.error
      ? {
          batchId: selectedBatchId,
          subgraph: batchWebPayload.subgraph,
          stats: batchWebPayload.stats,
          profiles: batchProfilesMap,
          rootProfileId: batchWebPayload.rootProfileId,
        }
      : null;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            Alumni web
          </h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {schoolMeta.name} — personal, batch, and school views.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          {schools.length > 1 ? (
            <Link
              href="/dashboard/network"
              className="font-medium text-teal-800 underline-offset-4 hover:underline dark:text-teal-300"
            >
              Switch school
            </Link>
          ) : null}
          <Link
            href={`/dashboard/classmates?schoolId=${encodeURIComponent(schoolId)}`}
            className="font-medium text-stone-700 underline-offset-4 hover:underline dark:text-stone-300"
          >
            Classmates
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <Suspense fallback={<NetworkLoadingFallback />}>
          <NetworkWebClient
            schoolId={schoolId}
            schoolName={schoolMeta.name}
            schoolSlug={schoolMeta.slug}
            graphCenterProfileId={myProfileId}
            viewerOwnProfileId={myProfileId}
            baseSubgraph={subgraphRes.result}
            profiles={profiles}
            mutuals={mutuals}
            incoming={incoming}
            requesterProfiles={requesterProfiles}
            privacyRow={privacyRow}
            batchOptions={batchOptions}
            sectionOptions={sectionOptions}
            showAccountPanel
            hubEnabled
            initialTab={initialTab}
            viewerBatchId={viewerBatchId}
            selectedBatchId={selectedBatchId}
            selectedSectionId={selectedSectionId}
            batchWeb={batchWeb}
            schoolWeb={schoolAggRes.payload}
          />
        </Suspense>
      </div>
    </main>
  );
}
