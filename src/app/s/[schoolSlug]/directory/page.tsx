import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAuthUser } from "@/features/auth/lib/auth-helpers";
import { getSafeNextPath } from "@/features/auth/lib/safe-next-path";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SafeImage } from "@/components/common/SafeImage";
import { DefaultAvatar } from "@/components/common/placeholders";

type PageProps = { params: Promise<{ schoolSlug: string }> };

type DirectoryRow = {
  id: string;
  display_name: string | null;
  photo_url: string | null;
  headline: string | null;
  batch_id: string;
  section_id: string | null;
  batches: { name: string; graduation_year: number | null } | null;
  sections: { name: string } | null;
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
    return { title: "Directory" };
  }
  return { title: `${school.name} · Classmates` };
}

export default async function SchoolDirectoryPage({ params }: PageProps) {
  const { schoolSlug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: school, error: schoolErr } = await supabase
    .from("schools")
    .select("id, name, slug, status")
    .eq("slug", schoolSlug)
    .eq("status", "active")
    .maybeSingle();

  if (schoolErr || !school) {
    notFound();
  }

  const user = await getAuthUser(supabase);
  const nextPath = getSafeNextPath(`/s/${schoolSlug}/directory`);

  if (!user) {
    const q = nextPath
      ? `?next=${encodeURIComponent(nextPath)}`
      : "";
    redirect(`/login${q}`);
  }

  const { data: myProfile } = await supabase
    .from("alumni_profiles")
    .select("id, status")
    .eq("school_id", school.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!myProfile) {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Classmate directory
        </h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          Join {school.name} as an alumnus to see approved classmates who share
          their profile publicly.
        </p>
        <p className="mt-6">
          <Link
            href={`/s/${school.slug}/join`}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-medium text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
          >
            Register / join
          </Link>
        </p>
      </main>
    );
  }

  if (myProfile.status === "pending") {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Classmate directory
        </h1>
        <div
          className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          <p className="font-medium">Pending approval</p>
          <p className="mt-1 text-amber-900/90 dark:text-amber-200/90">
            Your alumni profile is waiting for a school moderator to approve it.
            You will be able to browse the directory once you are approved.
          </p>
          <p className="mt-3">
            <Link
              href="/dashboard/profile"
              className="font-medium text-amber-950 underline-offset-4 hover:underline dark:text-amber-50"
            >
              View your profile
            </Link>
          </p>
        </div>
      </main>
    );
  }

  if (myProfile.status === "archived") {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Classmate directory
        </h1>
        <p className="mt-4 text-sm text-stone-600 dark:text-stone-400">
          Your profile for this school is archived and cannot access the
          directory.
        </p>
      </main>
    );
  }

  if (myProfile.status === "rejected") {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Classmate directory
        </h1>
        <div
          className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-950 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
          role="status"
        >
          <p className="font-medium">Profile not approved</p>
          <p className="mt-1 text-red-900/90 dark:text-red-200/90">
            Your profile was not approved for this school’s directory. You can
            update your details and contact the school if you believe this is a
            mistake.
          </p>
          <p className="mt-3">
            <Link
              href="/dashboard/profile"
              className="font-medium text-red-950 underline-offset-4 hover:underline dark:text-red-50"
            >
              Edit profile
            </Link>
          </p>
        </div>
      </main>
    );
  }

  const { data: classmates, error: listErr } = await supabase
    .from("alumni_profiles")
    .select(
      `
      id,
      display_name,
      photo_url,
      headline,
      batch_id,
      section_id,
      batches ( name, graduation_year ),
      sections ( name )
    `,
    )
    .eq("school_id", school.id)
    .eq("status", "approved")
    .neq("user_id", user.id)
    .order("display_name", { ascending: true });

  if (listErr) {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {listErr.message}
        </p>
      </main>
    );
  }

  const rows = (classmates ?? []) as unknown as DirectoryRow[];

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
        {school.name}
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
        Classmate directory
      </h1>
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
        Approved alumni with a public profile at this school. Private profiles
        are hidden.
      </p>

      {rows.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-stone-200 bg-stone-50/80 px-4 py-8 text-center text-sm text-stone-600 dark:border-stone-700 dark:bg-stone-900/40 dark:text-stone-400">
          No public classmates to show yet.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {rows.map((row) => {
            const batchLabel = row.batches?.name ?? "—";
            const year =
              row.batches?.graduation_year != null
                ? ` (${row.batches.graduation_year})`
                : "";
            const sectionLabel = row.sections?.name;

            return (
              <li
                key={row.id}
                className="flex gap-3 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950"
              >
                <SafeImage
                  src={row.photo_url}
                  fallback={<DefaultAvatar />}
                  alt={`${row.display_name?.trim() || "Alumni"} profile photo`}
                  className="size-14 shrink-0 rounded-xl"
                  imgClassName="object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-stone-900 dark:text-stone-50">
                    {row.display_name?.trim() || "Alumni"}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {batchLabel}
                    {year}
                    {sectionLabel ? ` · ${sectionLabel}` : ""}
                  </p>
                  {row.headline ? (
                    <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                      {row.headline}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-10 text-center text-sm text-stone-500 dark:text-stone-400">
        <Link
          href={`/s/${school.slug}/join`}
          className="font-medium text-stone-800 underline-offset-4 hover:underline dark:text-stone-200"
        >
          Your profile
        </Link>
        {" · "}
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
