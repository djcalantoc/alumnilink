import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/cn";

const appSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-app-shell",
  weight: ["400", "500", "600", "700", "800"],
});

type Props = {
  children: ReactNode;
  sidebar: ReactNode;
  topBar: ReactNode;
  /** e.g. alumni MobileBottomNav */
  bottomNav?: ReactNode;
  /** Alumni FAB etc. */
  floatingExtras?: ReactNode;
  className?: string;
};

/**
 * Shared authenticated chrome: soft canvas + floating sidebar + main column.
 */
export function AppShell({
  children,
  sidebar,
  topBar,
  bottomNav,
  floatingExtras,
  className,
}: Props) {
  return (
    <div
      data-app-shell
      className={cn(
        appSans.variable,
        "min-h-screen bg-[#eef1f8] p-3 antialiased dark:bg-stone-950 sm:p-4",
        className,
      )}
      style={{
        fontFamily: "var(--font-app-shell), system-ui, sans-serif",
        color: "#0b1c30",
      }}
    >
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-4 md:min-h-[calc(100vh-2rem)] md:flex-row md:items-start">
        {sidebar}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
          {topBar}
          <div className="flex flex-1 flex-col px-0 pb-28 pt-1 md:px-1 md:pb-12 md:pt-2 lg:px-2">
            {children}
          </div>
        </div>
      </div>
      {bottomNav}
      {floatingExtras}
    </div>
  );
}
