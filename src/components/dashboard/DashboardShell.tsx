import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { DashboardFab } from "@/components/dashboard/DashboardFab";
import {
  DashboardSidebar,
  type DashboardDirectoryNav,
} from "@/components/dashboard/DashboardSidebar";
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-dashboard-sans",
  weight: ["400", "500", "600", "700", "800"],
});

type Props = {
  children: ReactNode;
  directoryNav: DashboardDirectoryNav;
  peopleSearchBasePath: string;
  avatarUrl: string | null;
  displayName: string | null;
  unreadNotifications: number;
};

export function DashboardShell({
  children,
  directoryNav,
  peopleSearchBasePath,
  avatarUrl,
  displayName,
  unreadNotifications,
}: Props) {
  return (
    <div
      className={`${plusJakarta.variable} min-h-screen bg-[#f8f9ff] text-[#0b1c30] antialiased`}
      style={{
        fontFamily: "var(--font-dashboard-sans), system-ui, sans-serif",
      }}
    >
      <DashboardSidebar directoryNav={directoryNav} />
      <DashboardTopBar
        avatarUrl={avatarUrl}
        displayName={displayName}
        unreadNotifications={unreadNotifications}
        peopleSearchBasePath={peopleSearchBasePath}
      />
      <div className="min-h-screen pb-28 pt-16 md:pl-72 md:pb-12 md:pr-10 md:pt-16">
        <div className="px-4 py-6 md:px-0 md:py-8">{children}</div>
      </div>
      <DashboardFab />
    </div>
  );
}
