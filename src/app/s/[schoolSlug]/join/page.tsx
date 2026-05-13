import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GraduationCap, LogIn, UserPlus } from "lucide-react";
import { JoinBrandPanel } from "@/components/auth/JoinBrandPanel";
import { JoinBatchPicker } from "@/features/school-join/components/join-batch-picker";
import { JoinProfileForm } from "@/features/school-join/components/join-profile-form";
import { getAuthUser } from "@/features/auth/lib/auth-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ schoolSlug: string }>;
  searchParams: Promise<{
    batchId?: string;
    sectionId?: string;
  }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { schoolSlug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: school } = await supabase
    .from("schools")
    .select("name")
    .eq("slug", schoolSlug)
    .eq("status", "active")
    .maybeSingle();
  return { title: school?.name ? `Join ${school.name}` : "Join school" };
}

export default async function SchoolJoinPage({ params, searchParams }: PageProps) {
  const { schoolSlug } = await params;
  const sp = await searchParams;
  const batchId = sp.batchId?.trim() || null;
  const sectionId = sp.sectionId?.trim() || null;

  const supabase = await createSupabaseServerClient();

  /* ── Fetch school ── */
  const { data: school } = await supabase
    .from("schools")
    .select("id, name, slug, visibility, status, primary_color, cover_photo_url")
    .eq("slug", schoolSlug)
    .eq("status", "active")
    .maybeSingle();

  if (!school) notFound();

  /* ── Always fetch batches + sections (needed for Step 1 even if not logged in) ── */
  const [{ data: batchRows }, { data: sectionRows }] = await Promise.all([
    supabase
      .from("batches")
      .select("id, name, graduation_year")
      .eq("school_id", school.id)
      .order("graduation_year", { ascending: false }),
    supabase
      .from("sections")
      .select("id, name, batch_id")
      .eq("school_id", school.id)
      .order("name"),
  ]);

  const batches = (batchRows ?? []) as {
    id: string;
    name: string;
    graduation_year: number | null;
  }[];
  const sections = (sectionRows ?? []) as {
    id: string;
    name: string;
    batch_id: string;
  }[];

  /* ── Auth ── */
  const user = await getAuthUser(supabase);

  /* ── Determine batch / section labels for display ── */
  const selectedBatch = batchId ? batches.find((b) => b.id === batchId) : null;
  const selectedSection = sectionId ? sections.find((s) => s.id === sectionId) : null;
  const batchLabel = selectedBatch
    ? `${selectedBatch.name}${selectedBatch.graduation_year != null ? ` (${selectedBatch.graduation_year})` : ""}`
    : "";

  /* ── If logged in, fetch existing profile ── */
  let existingProfile: {
    id: string;
    status: string;
    batch_id: string;
    section_id: string | null;
  } | null = null;
  let suggestedDisplayName = "";

  if (user) {
    const [{ data: profileRow }, { data: userRow }] = await Promise.all([
      supabase
        .from("alumni_profiles")
        .select("id, status, batch_id, section_id")
        .eq("user_id", user.id)
        .eq("school_id", school.id)
        .maybeSingle(),
      supabase
        .from("users")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

    existingProfile = (profileRow ?? null) as {
      id: string;
      status: string;
      batch_id: string;
      section_id: string | null;
    } | null;
    suggestedDisplayName =
      userRow?.full_name?.trim() ||
      (typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : "");
  }

  /* ── Decide which step to show ── */
  //
  // STEP 1 — no batch selected yet
  // STEP 2 — batch selected but user not logged in (show auth options)
  // STEP 3 — batch selected + user logged in (profile completion)
  //
  const showStep1 = !batchId;
  const showStep2 = Boolean(batchId) && !user;
  const showStep3 = Boolean(batchId) && Boolean(user);

  /* The next-path for auth redirects must carry the batch/section params so
     the user lands back here with their selection intact. */
  const joinHref = `/s/${schoolSlug}/join${batchId ? `?batchId=${batchId}${sectionId ? `&sectionId=${sectionId}` : ""}` : ""}`;
  const encodedNext = encodeURIComponent(joinHref);

  return (
    <div data-auth-chrome className="flex min-h-screen w-full">
      {/* Desktop: left brand panel */}
      <JoinBrandPanel
        schoolName={school.name}
        className="hidden w-[44%] max-w-[520px] lg:flex"
      />

      {/* Right: content area */}
      <div className="flex flex-1 flex-col bg-stone-50 dark:bg-stone-950">
        {/* Mobile brand strip */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-violet-700 via-fuchsia-600 to-pink-500 px-5 py-4 lg:hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 ring-1 ring-white/30">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span className="min-w-0 truncate text-sm font-bold tracking-tight text-white">
            Join {school.name}
          </span>
        </div>

        {/* Scrollable content */}
        <div className="flex flex-1 items-start justify-center overflow-y-auto px-4 py-10 sm:px-6">
          {/* ── STEP 1: Batch & Section picker ── */}
          {showStep1 && (
            <JoinBatchPicker
              schoolSlug={school.slug}
              schoolName={school.name}
              batches={batches}
              sections={sections}
            />
          )}

          {/* ── STEP 2: Auth (not logged in, batch selected) ── */}
          {showStep2 && (
            <div className="w-full max-w-sm space-y-6">
              {/* Header */}
              <div className="text-center">
                <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
                  Create or sign in
                </h2>
                <p className="mt-1.5 text-sm text-stone-500 dark:text-stone-400">
                  One last step — set up your account to finish joining.
                </p>
              </div>

              {/* Step indicator */}
              <div className="flex items-center justify-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-200 text-xs font-bold text-violet-700 dark:bg-violet-900/50 dark:text-violet-400">
                  ✓
                </span>
                <span className="h-px w-8 bg-violet-200 dark:bg-violet-800" />
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                  2
                </span>
                <span className="h-px w-8 bg-stone-200 dark:bg-stone-700" />
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-stone-200 text-xs font-medium text-stone-400 dark:border-stone-700">
                  3
                </span>
              </div>

              {/* Batch summary pill */}
              {selectedBatch && (
                <div className="flex items-center justify-between rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3 dark:border-violet-900/40 dark:bg-violet-950/20">
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="h-4 w-4 shrink-0 text-violet-500" />
                    <span className="font-semibold text-violet-900 dark:text-violet-200">
                      {batchLabel}
                      {selectedSection && (
                        <span className="ml-2 font-normal text-violet-600 dark:text-violet-300">
                          · {selectedSection.name}
                        </span>
                      )}
                    </span>
                  </div>
                  <Link
                    href={`/s/${schoolSlug}/join`}
                    className="shrink-0 text-xs font-medium text-violet-500 underline-offset-4 hover:underline"
                  >
                    Change
                  </Link>
                </div>
              )}

              {/* Auth card */}
              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-950">
                <div className="space-y-3 px-5 py-6">
                  <Link
                    href={`/register?next=${encodedNext}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-violet-700 hover:to-fuchsia-600 hover:shadow-md hover:shadow-violet-500/25 active:scale-[0.98]"
                  >
                    <UserPlus className="h-4 w-4" />
                    Create account
                  </Link>
                  <Link
                    href={`/login?next=${encodedNext}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 active:scale-[0.98] dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign in
                  </Link>
                </div>
                <div className="border-t border-stone-100 bg-stone-50/60 px-5 py-3 dark:border-stone-800 dark:bg-stone-900/40">
                  <p className="text-center text-xs text-stone-400 dark:text-stone-500">
                    Your profile will be reviewed by the school admin before
                    appearing in the alumni directory.
                  </p>
                </div>
              </div>

              {/* Back link */}
              <div className="text-center">
                <Link
                  href={`/s/${schoolSlug}/join`}
                  className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-violet-600 dark:text-stone-500 dark:hover:text-violet-400"
                >
                  ← Back to batch selection
                </Link>
              </div>
            </div>
          )}

          {/* ── STEP 3: Profile completion (logged in + batch selected) ── */}
          {showStep3 && (
            <JoinProfileForm
              schoolId={school.id}
              schoolName={school.name}
              schoolSlug={school.slug}
              batchId={batchId!}
              batchLabel={batchLabel}
              sectionId={sectionId}
              sectionLabel={selectedSection?.name ?? null}
              existingProfileId={existingProfile?.id ?? null}
              suggestedDisplayName={suggestedDisplayName}
              currentStatus={existingProfile?.status ?? null}
            />
          )}
        </div>
      </div>
    </div>
  );
}
