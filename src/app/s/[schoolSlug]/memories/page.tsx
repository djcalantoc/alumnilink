import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchApprovedClassmatesForSchool } from "@/features/classmate-discovery/lib/queries";
import { getAuthUser } from "@/features/auth/lib/auth-helpers";
import { fetchMemoryTagsForMemories } from "@/features/memory-tagging/lib/queries";
import { PublicMemoriesView } from "@/features/memory-wall/components/public-memories-view";
import { fetchApprovedMemoriesForSchool } from "@/features/memory-wall/lib/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = { params: Promise<{ schoolSlug: string }> };

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
    return { title: "Memories" };
  }
  return { title: `${school.name} · Memories` };
}

export default async function SchoolMemoriesPage({ params }: PageProps) {
  const { schoolSlug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: school, error: schoolErr } = await supabase
    .from("schools")
    .select("id, name, slug, status, visibility")
    .eq("slug", schoolSlug)
    .eq("status", "active")
    .maybeSingle();

  if (schoolErr || !school) {
    notFound();
  }

  const user = await getAuthUser(supabase);

  const { rows, error } = await fetchApprovedMemoriesForSchool(
    supabase,
    school.id,
  );

  let engagement: import("@/features/memory-wall/components/public-memories-view").PublicMemoriesEngagement | null =
    null;
  if (user && rows.length > 0) {
    const { data: okProf } = await supabase
      .from("alumni_profiles")
      .select("id")
      .eq("school_id", school.id)
      .eq("user_id", user.id)
      .eq("status", "approved")
      .maybeSingle();
    if (okProf) {
      const [{ rows: classmates }, tagsRes] = await Promise.all([
        fetchApprovedClassmatesForSchool(supabase, school.id, user.id),
        fetchMemoryTagsForMemories(
          supabase,
          rows.map((m) => m.id),
        ),
      ]);
      if (!tagsRes.error) {
        engagement = {
          currentUserId: user.id,
          schoolId: school.id,
          classmates,
          tagsByMemory: tagsRes.byMemory,
        };
      }
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
          {school.name}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Memory wall
        </h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          Approved memories from alumni. Tap a photo to read the full caption.
        </p>
        {school.visibility === "private" ? (
          <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
            This school is private. You may need to sign in as an approved
            alumnus to see all posts.
          </p>
        ) : null}
      </div>

      {error ? (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 dark:border-red-900/50 dark:bg-red-950/40"
          role="alert"
        >
          <p className="font-medium text-red-900 dark:text-red-200">
            Could not load memories
          </p>
          <p className="mt-1 text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      ) : rows.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 px-6 py-14 text-center dark:border-stone-600 dark:bg-stone-900/40"
          role="status"
        >
          <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
            No memories yet.
          </p>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            Alumni can share photos from the dashboard once a moderator approves
            them.
          </p>
        </div>
      ) : (
        <PublicMemoriesView memories={rows} engagement={engagement} />
      )}

      <p className="mt-10 text-center text-sm text-stone-500 dark:text-stone-400">
        <Link
          href={`/s/${school.slug}/join`}
          className="font-medium text-stone-800 underline-offset-4 hover:underline dark:text-stone-200"
        >
          Alumni login / join
        </Link>
        {" · "}
        <Link
          href="/"
          className="font-medium text-stone-800 underline-offset-4 hover:underline dark:text-stone-200"
        >
          Home
        </Link>
      </p>
    </main>
  );
}
