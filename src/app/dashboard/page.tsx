import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardHomeContent } from "@/features/dashboard/components/dashboard-home-content";
import { DashboardHomeSkeleton } from "@/features/dashboard/components/dashboard-home-skeleton";

export const metadata: Metadata = {
  title: "Home",
};

export default function DashboardPage() {
  return (
    <main className="w-full flex-1">
      <Suspense fallback={<DashboardHomeSkeleton />}>
        <DashboardHomeContent />
      </Suspense>
    </main>
  );
}
