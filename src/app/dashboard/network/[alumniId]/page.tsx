import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { z } from "zod";
import { NetworkWebClient } from "@/features/alumni-network/components/network-web-client";
import { resolveClassmateSchoolContext } from "@/features/classmate-discovery/lib/access";
import {
  buildSubgraphAroundProfile,
  fetchProfilesByIds,
  fetchSharedConnectionsWithPeer,
} from "@/features/alumni-network/lib/queries";
import { SchoolPicker } from "@/features/school-batch-sections/components/school-picker";
import {
  fetchBatchesForSchool,
  fetchSectionsForSchool,
} from "@/features/school-batch-sections/lib/queries";
import { getAuthUser } from "@/features/auth/lib/auth-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ alumniId: string }>;
  searchParams: Promise<{ schoolId?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Alumni web" };
}

export default async function PeerNetworkPage({
  params,
  searchParams,
}: PageProps) {
  const { alumniId } = await params;
  const sp = await searchParams;
  const requested = sp.schoolId?.trim() || undefined;

  if (!z.string().uuid().safeParse(alumniId).success) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Invalid profile link.
        </p>
        <Link
          href="/dashboard/network"
          className="mt-4 inline-block text-sm font-medium text-teal-800 underline dark:text-teal-300"
        >
          Back to your web
        </Link>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) {
    return null;
  }

  const ctx = await resolveClassmateSchoolContext(
    `/dashboard/network/${alumniId}`,
    requested,
  );

  if (!ctx.ok) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-sm text-amber-800 dark:text-amber-200">{ctx.error}</p>
        <p className="mt-3">
          <Link href="/dashboard/network" className="text-sm font-medium underline">
            Alumni web
          </Link>
        </p>
      </main>
    );
  }

  if ("pickSchool" in ctx) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <SchoolPicker
          schools={ctx.schools}
          targetPath={`/dashboard/network/${alumniId}`}
          title="Alumni web"
          description="Choose a school to view this alum’s connection map."
          actionLabel="Continue →"
        />
      </main>
    );
  }

  const { schoolId, schools } = ctx;
  const schoolMeta = schools.find((s) => s.id === schoolId);
  if (!schoolMeta) {
    return null;
  }

  const { data: myProf, error: mpErr } = await supabase
    .from("alumni_profiles")
    .select("id")
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

  if (alumniId === myProfileId) {
    redirect(`/dashboard/network?schoolId=${schoolId}`);
  }

  const { data: peer, error: peerErr } = await supabase
    .from("alumni_profiles")
    .select("id, display_name")
    .eq("id", alumniId)
    .eq("school_id", schoolId)
    .eq("status", "approved")
    .maybeSingle();

  if (peerErr || !peer) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <p className="text-sm text-stone-600 dark:text-stone-400">
          This alum isn’t available on your school map.
        </p>
        <Link
          href="/dashboard/network"
          className="mt-4 inline-block text-sm font-medium text-teal-800 underline dark:text-teal-300"
        >
          Back to your web
        </Link>
      </main>
    );
  }

  const [subgraphRes, sharedRes, { data: batches, error: bErr }, { data: sections, error: sErr }] =
    await Promise.all([
      buildSubgraphAroundProfile(supabase, schoolId, alumniId, 3, {
        connectionTypes: null,
      }),
      fetchSharedConnectionsWithPeer(
        supabase,
        schoolId,
        myProfileId,
        alumniId,
      ),
      fetchBatchesForSchool(supabase, schoolId),
      fetchSectionsForSchool(supabase, schoolId),
    ]);

  const err =
    subgraphRes.error ?? sharedRes.error ?? bErr ?? sErr;
  if (err || !subgraphRes.result) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {err ?? "Could not load map."}
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
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {pErr}
        </p>
      </main>
    );
  }

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

  const peerName = (peer.display_name as string | null)?.trim() ?? "Alumni";

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <p className="text-xs font-medium uppercase text-stone-500">
        {schoolMeta.name}
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
        {peerName}&apos;s web
      </h1>
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
        Map centered on them. Dashed lines show how they marked each
        connection.
      </p>
      <p className="mt-3 text-sm">
        <Link
          href={`/dashboard/network?schoolId=${schoolId}`}
          className="font-medium text-teal-800 underline-offset-4 hover:underline dark:text-teal-300"
        >
          ← Your web
        </Link>
      </p>

      <div className="mt-8">
        <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />}>
          <NetworkWebClient
          schoolId={schoolId}
          schoolName={schoolMeta.name}
          schoolSlug={schoolMeta.slug}
          graphCenterProfileId={alumniId}
          viewerOwnProfileId={myProfileId}
          baseSubgraph={subgraphRes.result}
          profiles={profiles}
          mutuals={sharedRes.anchors}
          incoming={[]}
          requesterProfiles={{}}
          privacyRow={null}
          batchOptions={batchOptions}
          sectionOptions={sectionOptions}
          showAccountPanel={false}
          hubEnabled={false}
          initialTab="my"
          viewerBatchId={null}
          selectedBatchId={null}
          selectedSectionId={null}
          batchWeb={null}
          schoolWeb={null}
          mutualSectionTitle="People you both know"
          mutualSectionEmpty="No shared connections visible with your privacy settings."
          />
        </Suspense>
      </div>
    </main>
  );
}
