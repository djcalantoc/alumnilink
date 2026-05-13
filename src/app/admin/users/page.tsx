import type { Metadata } from "next";
import { requireSuperAdmin } from "@/features/super-admin-schools/lib/guard";
import { UsersTable } from "@/features/super-admin/components/users-table";
import { fetchPaginatedUsers } from "@/features/super-admin/lib/queries";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = { title: "Users — Super Admin" };

type Props = {
  searchParams: Promise<{ search?: string; page?: string }>;
};

export default async function AdminUsersPage({ searchParams }: Props) {
  const { supabase } = await requireSuperAdmin();
  const sp = await searchParams;

  const data = await fetchPaginatedUsers(supabase, {
    search: sp.search,
    page: sp.page ? Number(sp.page) : 1,
  });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title="Users"
        description={`${data.totalCount.toLocaleString()} total registered users across all schools.`}
      />
      <UsersTable data={data} />
    </div>
  );
}
