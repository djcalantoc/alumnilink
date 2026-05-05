import type { Metadata } from "next";
import Link from "next/link";
import { DashboardMemoryList } from "@/features/memory-wall/components/dashboard-memory-list";
import { MemoryUploadForm } from "@/features/memory-wall/components/memory-upload-form";
import { fetchMemoriesByAuthor } from "@/features/memory-wall/lib/queries";
import type { MemorySchoolOption } from "@/features/memory-wall/lib/types";
import { getAuthUser } from "@/features/auth/lib/auth-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Memory wall",
};

function dedupeSchools(
  rows: { schools: MemorySchoolOption | null }[],
): MemorySchoolOption[] {
  const m = new Map<string, MemorySchoolOption>();
  for (const r of rows) {
    if (r.schools?.id) {
      m.set(r.schools.id, r.schools);
    }
  }
  return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export default async function DashboardMemoriesPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);

  if (!user) {
    return null;
  }

  const [{ rows: memories, error: memErr }, { data: profileRows, error: profErr }] =
    await Promise.all([
      fetchMemoriesByAuthor(supabase, user.id),
      supabase
        .from("alumni_profiles")
        .select(
          `
          schools ( id, name, slug )
        `,
        )
        .eq("user_id", user.id)
        .eq("status", "approved"),
    ]);

  const schools = dedupeSchools(
    (profileRows ?? []) as unknown as { schools: MemorySchoolOption | null }[],
  );

  return (
    <main className="w-full flex-1 pb-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            Memory wall
          </h1>
          <p className="mt-2 max-w-xl text-sm text-stone-600 dark:text-stone-400">
            Share a throwback — moderators give it a quick nod before it hits the
            public wall.
          </p>
        </div>
        <a
          href="#share-memory"
          className="social-pill-btn inline-flex min-h-11 shrink-0 items-center justify-center rounded-full social-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
        >
          Share a memory
        </a>
      </div>

      <div className="space-y-10">
        <section id="share-memory" className="scroll-mt-28">
          <MemoryUploadForm schools={schools} />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
            Your reel
          </h2>
          {profErr ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {profErr.message}
            </p>
          ) : null}
          {memErr ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {memErr}
            </p>
          ) : (
            <DashboardMemoryList memories={memories} />
          )}
        </section>
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
