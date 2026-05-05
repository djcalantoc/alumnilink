import type { Metadata } from "next";
import { PeopleDirectoryPage } from "@/features/classmate-discovery/components/people-directory-page";

export const metadata: Metadata = {
  title: "Batchmates",
};

type PageProps = {
  searchParams: Promise<{ schoolId?: string; q?: string }>;
};

export default async function DashboardBatchmatesPage({
  searchParams,
}: PageProps) {
  const sp = await searchParams;
  return (
    <PeopleDirectoryPage
      scope="batchmates"
      pathname="/dashboard/batchmates"
      searchParams={sp}
    />
  );
}
