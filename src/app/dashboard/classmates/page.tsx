import type { Metadata } from "next";
import { PeopleDirectoryPage } from "@/features/classmate-discovery/components/people-directory-page";

export const metadata: Metadata = {
  title: "Classmates",
};

type PageProps = {
  searchParams: Promise<{ schoolId?: string; q?: string }>;
};

export default async function DashboardClassmatesPage({
  searchParams,
}: PageProps) {
  const sp = await searchParams;
  return (
    <PeopleDirectoryPage
      scope="classmates"
      pathname="/dashboard/classmates"
      searchParams={sp}
    />
  );
}
