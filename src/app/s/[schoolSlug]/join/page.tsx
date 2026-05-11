import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GraduationCap, UserPlus } from "lucide-react";
import { AlumniProfileForm } from "@/features/alumni-profile/components/alumni-profile-form";
import type {
  AlumniProfileRow,
  BatchOption,
  SectionOption,
} from "@/features/alumni-profile/lib/types";
import { getAuthUser } from "@/features/auth/lib/auth-helpers";
import { getSafeNextPath } from "@/features/auth/lib/safe-next-path";
import { AuthCard } from "@/components/auth/AuthCard";
import { JoinBrandPanel } from "@/components/auth/JoinBrandPanel";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ schoolSlug: string }>;
  searchParams: Promise<{ batch_id?: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { schoolSlug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: school } = await supabase
    .from("schools")
    .select("name")
    .eq("slug", schoolSlug)
    .eq("status", "active")
    .maybeSingle();

  if (!school?.name) {
    return { title: "Join school" };
  }
  return { title: `Join ${school.name}` };
}

export default async function SchoolJoinPage({
  params,
  searchParams,
}: PageProps) {
  const { schoolSlug } = await params;
  const sp = await searchParams;
  const prefillBatchId = sp.batch_id?.trim() || null;
  const supabase = await createSupabaseServerClient();

  const { data: school, error: schoolErr } = await supabase
    .from("schools")
    .select("id, name, slug, visibility, status, primary_color, cover_photo_url")
    .eq("slug", schoolSlug)
    .eq("status", "active")
    .maybeSingle();

  if (schoolErr || !school) {
    notFound();
  }

  const user = await getAuthUser(supabase);
  const nextPath = getSafeNextPath(`/s/${schoolSlug}/join`);

  let batches: BatchOption[] = [];
  let sections: SectionOption[] = [];
  let existingProfile: AlumniProfileRow | null = null;
  let suggestedDisplayName = "";

  if (user) {
    const [
      { data: batchRows },
      { data: sectionRows },
      { data: profileRow },
      { data: userRow },
    ] = await Promise.all([
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
      supabase
        .from("alumni_profiles")
        .select("*")
        .eq("user_id", user.id)
        .eq("school_id", school.id)
        .maybeSingle(),
      supabase
        .from("users")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

    batches = (batchRows ?? []) as BatchOption[];
    sections = (sectionRows ?? []) as SectionOption[];
    existingProfile = profileRow as AlumniProfileRow | null;
    suggestedDisplayName =
      userRow?.full_name?.trim() ||
      (typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : "");
  }

  return (
    <div data-auth-chrome className="flex min-h-screen w-full">
      {/* Desktop: left brand panel */}
      <JoinBrandPanel
        schoolName={school.name}
        className="hidden w-[44%] max-w-[520px] lg:flex"
      />

      {/* Right side */}
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

        {/* Scrollable form area */}
        <div className="flex flex-1 items-start justify-center overflow-y-auto px-4 py-10 sm:px-6">
          {!user ? (
            /* ── Not signed in ── */
            <AuthCard
              title="Start your alumni profile 🎓"
              description={`Sign in or create an account to join the ${school.name} community.`}
            >
              <div className="space-y-4">
                <Link
                  href={
                    nextPath
                      ? `/register?next=${encodeURIComponent(nextPath)}`
                      : "/register"
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/25 transition-all duration-150 hover:from-violet-700 hover:to-fuchsia-600 hover:shadow-lg hover:shadow-violet-500/30 active:scale-[0.98]"
                >
                  <UserPlus className="h-4 w-4" />
                  Create account
                </Link>

                <Link
                  href={
                    nextPath
                      ? `/login?next=${encodeURIComponent(nextPath)}`
                      : "/login"
                  }
                  className="flex w-full items-center justify-center rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition-all duration-150 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 active:scale-[0.98] dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
                >
                  Sign in
                </Link>

                <p className="text-center text-xs leading-relaxed text-stone-400 dark:text-stone-500">
                  Your profile will be reviewed by the school&apos;s admin
                  before it appears in the alumni directory.
                </p>

                <div className="border-t border-stone-100 pt-3 dark:border-stone-800">
                  <Link
                    href="/"
                    className="flex items-center justify-center gap-1.5 text-sm font-medium text-stone-400 transition-colors hover:text-violet-600 dark:text-stone-500 dark:hover:text-violet-400"
                  >
                    ← Back home
                  </Link>
                </div>
              </div>
            </AuthCard>
          ) : (
            /* ── Signed in: show alumni profile form ── */
            <div className="w-full max-w-lg pb-10">
              <AlumniProfileForm
                key={existingProfile?.id ?? "new"}
                school={{
                  id: school.id,
                  name: school.name,
                  slug: school.slug,
                  visibility: school.visibility,
                  primary_color: school.primary_color,
                  cover_photo_url: school.cover_photo_url,
                }}
                batches={batches}
                sections={sections}
                existingProfile={existingProfile}
                joinSlug={school.slug}
                suggestedDisplayName={suggestedDisplayName}
                prefillBatchId={prefillBatchId}
              />
              <div className="mt-6 text-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-500 shadow-sm transition-all hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400 dark:hover:text-violet-400"
                >
                  ← Back home
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
