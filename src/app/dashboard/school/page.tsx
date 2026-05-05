import type { Metadata } from "next";
import { PeopleDirectoryPage } from "@/features/classmate-discovery/components/people-directory-page";

export const metadata: Metadata = {
  title: "Your School",
};

type PageProps = {
  searchParams: Promise<{ schoolId?: string; q?: string }>;
};

export default async function DashboardSchoolPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  return (
    <PeopleDirectoryPage
      scope="school"
      pathname="/dashboard/school"
      searchParams={sp}
    />
  );
}
