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

/** Alumni member chrome: padded shell, floating sidebar card, main column with sticky top bar. */
export function MemberShell({
  children,
  directoryNav,
  peopleSearchBasePath,
  avatarUrl,
  displayName,
  unreadNotifications,
}: Props) {
  return (
    <div
      className={`${plusJakarta.variable} min-h-screen bg-gray-50 p-4 text-[#0b1c30] antialiased`}
      style={{
        fontFamily: "var(--font-dashboard-sans), system-ui, sans-serif",
      }}
    >
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 md:min-h-[calc(100vh-2rem)] md:flex-row md:items-start">
        <DashboardSidebar directoryNav={directoryNav} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <DashboardTopBar
            avatarUrl={avatarUrl}
            displayName={displayName}
            unreadNotifications={unreadNotifications}
            peopleSearchBasePath={peopleSearchBasePath}
          />
          <div className="flex flex-1 flex-col px-0 pb-28 pt-2 md:px-1 md:pb-12 md:pt-3 lg:px-2">
            {children}
          </div>
        </div>
      </div>

      <DashboardFab />
    </div>
  );
}
