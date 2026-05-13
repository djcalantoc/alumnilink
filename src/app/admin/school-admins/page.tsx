import type { Metadata } from "next";
import { requireSuperAdmin } from "@/features/super-admin-schools/lib/guard";
import { SchoolAdminsTable } from "@/features/super-admin/components/school-admins-table";
import {
  fetchPaginatedSchoolAdmins,
  fetchPaginatedUsers,
} from "@/features/super-admin/lib/queries";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = { title: "School Admins — Super Admin" };

type Props = {
  searchParams: Promise<{ search?: string; school?: string; page?: string }>;
};

export default async function AdminSchoolAdminsPage({ searchParams }: Props) {
  const { supabase } = await requireSuperAdmin();
  const sp = await searchParams;

  const [adminData, { data: schoolRows }, usersData] = await Promise.all([
    fetchPaginatedSchoolAdmins(supabase, {
      search: sp.search,
      schoolId: sp.school,
      page: sp.page ? Number(sp.page) : 1,
    }),
    supabase.from("schools").select("id, name").order("name"),
    fetchPaginatedUsers(supabase, { page: 1 }),
  ]);

  const schools = (schoolRows ?? []) as { id: string; name: string }[];
  const users = usersData.rows.map((u) => ({
    id: u.id,
    email: u.email,
    full_name: u.full_name,
  }));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title="School Admins"
        description={`${adminData.totalCount.toLocaleString()} admin assignments across all schools.`}
      />
      <SchoolAdminsTable data={adminData} schools={schools} users={users} />
    </div>
  );
}
