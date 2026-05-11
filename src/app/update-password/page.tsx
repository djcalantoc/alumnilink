import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { UpdatePasswordForm } from "@/features/auth/components/update-password-form";

export const metadata: Metadata = {
  title: "New password",
};

export default function UpdatePasswordPage() {
  return (
    <div data-auth-chrome className="flex min-h-screen w-full">
      <AuthBrandPanel className="hidden w-[44%] max-w-[520px] lg:flex" />

      <div className="flex flex-1 flex-col bg-stone-50 dark:bg-stone-950">
        {/* Mobile brand strip */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-violet-700 via-fuchsia-600 to-pink-500 px-5 py-4 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 ring-1 ring-white/30">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold tracking-tight text-white">
            AlumniLink
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
          <UpdatePasswordForm />
        </div>
      </div>
    </div>
  );
}
