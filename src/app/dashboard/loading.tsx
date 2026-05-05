import { DashboardHomeSkeleton } from "@/features/dashboard/components/dashboard-home-skeleton";

export default function DashboardLoading() {
  return (
    <main className="w-full flex-1">
      <DashboardHomeSkeleton />
    </main>
  );
}
