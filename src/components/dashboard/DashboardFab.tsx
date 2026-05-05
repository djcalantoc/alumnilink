"use client";

import Link from "next/link";
import { MaterialIcon } from "@/components/dashboard/MaterialIcon";

export function DashboardFab() {
  return (
    <Link
      href="/dashboard/memories#share-memory"
      className="group fixed bottom-24 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-[#493ee5] text-white shadow-[0_8px_30px_rgb(73,62,229,0.4)] transition-all hover:scale-110 active:scale-95 md:bottom-8 md:right-8"
      aria-label="Share a memory"
    >
      <MaterialIcon name="add" className="text-2xl" />
      <span className="pointer-events-none absolute right-16 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
        Share memory
      </span>
    </Link>
  );
}
