import Link from "next/link";
import { fetchAdminSchools } from "@/features/super-admin-schools/lib/queries";

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "active"
      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
      : status === "inactive"
        ? "bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-200"
        : "bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-200";

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export async function SchoolsList() {
  const { data, error } = await fetchAdminSchools();

  if (error) {
    return (
      <div
        className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/40"
        role="alert"
      >
        <p className="font-medium text-red-900 dark:text-red-200">
          Could not load schools
        </p>
        <p className="mt-1 text-sm text-red-800 dark:text-red-300">{error}</p>
        <p className="mt-3 text-sm text-red-800/90 dark:text-red-300/90">
          Check your Supabase connection and that migrations (including{" "}
          <code className="rounded bg-red-100 px-1 text-xs dark:bg-red-900">
            super_admin_schools
          </code>
          ) are applied.
        </p>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/50 px-6 py-12 text-center dark:border-stone-700 dark:bg-stone-950/40">
        <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
          No schools yet
        </p>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          Create your first school to get started.
        </p>
        <Link
          href="/admin/schools/new"
          className="mt-4 inline-block text-sm font-medium text-stone-900 underline-offset-4 hover:underline dark:text-stone-100"
        >
          New school
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800">
      <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-900/50">
            <th className="px-4 py-3 font-medium text-stone-900 dark:text-stone-100">
              School
            </th>
            <th className="hidden px-4 py-3 font-medium text-stone-900 sm:table-cell dark:text-stone-100">
              City
            </th>
            <th className="px-4 py-3 font-medium text-stone-900 dark:text-stone-100">
              Visibility
            </th>
            <th className="px-4 py-3 font-medium text-stone-900 dark:text-stone-100">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((school) => (
            <tr
              key={school.id}
              className="border-b border-stone-100 last:border-0 dark:border-stone-800/80"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/admin/schools/${school.id}`}
                  className="font-medium text-stone-900 underline-offset-4 hover:underline dark:text-stone-50"
                >
                  {school.name}
                </Link>
                <p className="text-xs text-stone-500 dark:text-stone-500">
                  /{school.slug}
                </p>
              </td>
              <td className="hidden px-4 py-3 text-stone-600 sm:table-cell dark:text-stone-400">
                {school.city ?? "—"}
              </td>
              <td className="px-4 py-3 text-stone-600 capitalize dark:text-stone-400">
                {school.visibility}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={school.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
