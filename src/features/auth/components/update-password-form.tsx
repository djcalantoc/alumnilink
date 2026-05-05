"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { resolveAuthLandingPath } from "@/features/auth/lib/resolve-redirect";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const form = e.currentTarget;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;
    const confirm = (
      form.elements.namedItem("confirmPassword") as HTMLInputElement
    ).value;

    if (password !== confirm) {
      setError("Passwords do not match.");
      setPending(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setPending(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const nextPath = user
      ? await resolveAuthLandingPath(supabase, user)
      : "/login";
    router.replace(nextPath);
    router.refresh();
    setPending(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New password</CardTitle>
        <CardDescription>
          Choose a new password for your account.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
            Password
            <Input
              className="mt-1.5"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </label>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
            Confirm password
            <Input
              className="mt-1.5"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </label>
        </CardContent>
        <CardFooter>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-between">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Update password"}
            </Button>
            <Link
              href="/login"
              className="text-sm text-stone-600 underline-offset-4 hover:underline dark:text-stone-400"
            >
              Cancel
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
