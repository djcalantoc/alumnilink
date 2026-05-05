"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

type LogoutButtonProps = {
  className?: string;
  children?: ReactNode;
};

export function LogoutButton({ className, children }: LogoutButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.refresh();
    router.replace("/");
    setPending(false);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={pending}
      className={cn(className)}
    >
      {pending ? "Signing out…" : (children ?? "Log out")}
    </Button>
  );
}
