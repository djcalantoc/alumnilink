import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { AlumniProfileForm } from "@/features/alumni-profile/components/alumni-profile-form";
import type {
  AlumniProfileRow,
  BatchOption,
  SchoolJoinMeta,
  SectionOption,
} from "@/features/alumni-profile/lib/types";
import { getAuthUser } from "@/features/auth/lib/auth-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Your profile",
};

export default async function DashboardProfilePage() {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);

  if (!user) {
    return null;
  }

  const { data: profiles, error } = await supabase
    .from("alumni_profiles")
    .select(
      `
      *,
      schools ( id, name, slug, visibility, status, primary_color, cover_photo_url )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          Could not load profiles: {error.message}
        </p>
      </main>
    );
  }

  const rows = profiles ?? [];

  if (rows.length === 0) {
    // Fetch active public schools so we can give a direct join link
    const { data: schools } = await supabase
      .from("schools")
      .select("id, name, slug")
      .eq("status", "active")
      .eq("visibility", "public")
      .order("name")
      .limit(8);

    const joinableSchools = (schools ?? []) as { id: string; name: string; slug: string }[];

    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Your profile
        </h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          You do not have an alumni profile yet. Join your school below to
          create one — a moderator will approve it before it appears in the
          directory.
        </p>

        {joinableSchools.length > 0 ? (
          <div className="mt-6 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 dark:text-stone-400">
              Available schools
            </p>
            {joinableSchools.map((s) => (
              <Link
                key={s.id}
                href={`/s/${s.slug}/join`}
                className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-white px-4 py-3 shadow-sm transition hover:border-violet-300 hover:shadow-md dark:border-stone-700 dark:bg-stone-900 dark:hover:border-violet-700"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/40 dark:to-fuchsia-900/30">
                  <GraduationCap className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-stone-900 dark:text-stone-50">
                    {s.name}
                  </span>
                  <span className="text-xs text-stone-400 dark:text-stone-500">
                    Tap to join this school
                  </span>
                </span>
                <span className="text-stone-300 dark:text-stone-600">→</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">
            No schools are available yet. Check back soon or use a direct
            invite link from your school admin.
          </p>
        )}

        <p className="mt-8">
          <Link
            href="/"
            className="text-sm font-medium text-stone-400 underline-offset-4 hover:text-violet-600 hover:underline dark:text-stone-500 dark:hover:text-violet-400"
          >
            ← Back home
          </Link>
        </p>
      </main>
    );
  }

  const enriched = await Promise.all(
    rows.map(async (row) => {
      const typed = row as AlumniProfileRow & { schools: SchoolJoinMeta | null };
      const { schools: school, ...profileRest } = typed;
      const alumniProfile = profileRest as AlumniProfileRow;

      if (!school) {
        return {
          alumniProfile,
          school: null as SchoolJoinMeta | null,
          batches: [] as BatchOption[],
          sections: [] as SectionOption[],
        };
      }

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

      return {
        alumniProfile,
        school,
        batches: (batchRows ?? []) as BatchOption[],
        sections: (sectionRows ?? []) as SectionOption[],
      };
    }),
  );

  return (
    <main className="w-full flex-1">
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
        Your profile
      </h1>
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
        The yearbook card everyone sees — refresh your vibe anytime.
      </p>

      <div className="mt-8 flex flex-col gap-10">
        {enriched.map(({ alumniProfile, school, batches, sections }) =>
          school ? (
            <AlumniProfileForm
              key={alumniProfile.id}
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
              existingProfile={alumniProfile}
            />
          ) : (
            <div
              key={alumniProfile.id}
              className="rounded-2xl border border-stone-200 px-4 py-5 text-sm text-stone-600 dark:border-stone-700 dark:text-stone-400"
            >
              Profile for a school that is no longer available (
              {alumniProfile.display_name ?? "—"}).
            </div>
          ),
        )}
      </div>

      <p className="mt-10 text-center text-sm text-stone-500 dark:text-stone-400">
        <Link
          href="/dashboard"
          className="font-medium text-stone-800 underline-offset-4 hover:underline dark:text-stone-200"
        >
          Dashboard
        </Link>
      </p>
    </main>
  );
}
