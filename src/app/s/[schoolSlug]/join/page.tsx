import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlumniProfileForm } from "@/features/alumni-profile/components/alumni-profile-form";
import type {
  AlumniProfileRow,
  BatchOption,
  SectionOption,
} from "@/features/alumni-profile/lib/types";
import { getAuthUser } from "@/features/auth/lib/auth-helpers";
import { getSafeNextPath } from "@/features/auth/lib/safe-next-path";
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
    const [{ data: batchRows }, { data: sectionRows }, { data: profileRow }, { data: userRow }] =
      await Promise.all([
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
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
          Alumni registration
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Join {school.name}
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Create or update your alumni profile. A moderator will approve it
          before it appears in the directory.
        </p>
      </div>

      {!user ? (
        <div className="rounded-2xl border border-stone-200 bg-stone-50/80 px-4 py-6 dark:border-stone-700 dark:bg-stone-900/40">
          <p className="text-sm text-stone-700 dark:text-stone-300">
            Sign in to register as an alumnus of this school.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link
              href={nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-medium text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
            >
              Sign in
            </Link>
            <Link
              href={
                nextPath
                  ? `/register?next=${encodeURIComponent(nextPath)}`
                  : "/register"
              }
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-transparent px-4 text-sm font-medium text-stone-900 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-100 dark:hover:bg-stone-800"
            >
              Create account
            </Link>
          </div>
        </div>
      ) : (
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
      )}

      <p className="mt-8 text-center text-sm text-stone-500 dark:text-stone-400">
        <Link
          href="/"
          className="font-medium text-stone-800 underline-offset-4 hover:underline dark:text-stone-200"
        >
          Back home
        </Link>
      </p>
    </main>
  );
}
