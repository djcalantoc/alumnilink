import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { requirePlatformOwner } from "@/features/platform-owner/lib/guard";

export const metadata: Metadata = {
  title: "Schools",
};

export default async function OwnerSchoolsPage() {
  const { supabase } = await requirePlatformOwner();

  const { data, error } = await supabase
    .from("schools")
    .select("id, name, slug, status")
    .order("name", { ascending: true })
    .limit(80);

  const rows =
    !error && data?.length
      ? (data as { id: string; name: string; slug: string; status: string | null }[])
      : [
          { id: "1", name: "Northfield Academy", slug: "northfield", status: "active" },
          { id: "2", name: "Riverside College", slug: "riverside", status: "active" },
        ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title="Schools"
        description="Cross-platform directory of institutions on AlumniLink."
      />

      {error ? (
        <p className="text-sm text-amber-700 dark:text-amber-300" role="status">
          Showing sample rows — could not load schools ({error.message}).
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-lg shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-950/95 dark:shadow-black/40">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-100 bg-stone-50/80 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:border-stone-800 dark:bg-stone-900/50 dark:text-stone-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {rows.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium text-stone-900 dark:text-stone-50">
                  {s.name}
                </td>
                <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                  {s.slug}
                </td>
                <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                  {s.status ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
