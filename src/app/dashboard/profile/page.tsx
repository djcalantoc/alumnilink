import type { Metadata } from "next";
import Link from "next/link";
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
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Your profile
        </h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          You do not have an alumni profile yet. Join a school from its public
          link to create one.
        </p>
        <p className="mt-6">
          <Link
            href="/"
            className="text-sm font-medium text-stone-900 underline-offset-4 hover:underline dark:text-stone-100"
          >
            Back home
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
