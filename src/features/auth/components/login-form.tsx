"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { ensurePublicUserProfile } from "@/features/auth/actions/ensure-user-profile";
import { resolveAuthLandingPath } from "@/features/auth/lib/resolve-redirect";
import { getSafeNextPath } from "@/features/auth/lib/safe-next-path";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const nextParam = getSafeNextPath(searchParams.get("next"));

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;

    const supabase = createSupabaseBrowserClient();
    const { data, error: signError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signError) {
      setError(signError.message);
      setPending(false);
      return;
    }

    if (!data.user) {
      setError("Could not sign in.");
      setPending(false);
      return;
    }

    // Persist session cookies before the Server Action runs (avoids flaky action responses).
    await supabase.auth.getSession();

    let ensured: Awaited<ReturnType<typeof ensurePublicUserProfile>>;
    try {
      ensured = await ensurePublicUserProfile();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not sync your profile with the server.",
      );
      setPending(false);
      return;
    }
    if (!ensured.ok) {
      setError(ensured.message);
      setPending(false);
      return;
    }

    if (nextParam) {
      router.replace(nextParam);
      router.refresh();
      setPending(false);
      return;
    }

    const landing = await resolveAuthLandingPath(supabase, data.user);
    router.replace(landing);
    router.refresh();
    setPending(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Use the email and password for your AlumniLink account.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {searchParams.get("error") === "auth" ? (
            <p className="text-sm text-red-600 dark:text-red-400">
              That confirmation or reset link was invalid or expired. Try again.
            </p>
          ) : null}
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
            Email
            <Input
              className="mt-1.5"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
            Password
            <Input
              className="mt-1.5"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
          <Link
            href="/forgot-password"
            className="text-sm text-stone-600 underline-offset-4 hover:underline dark:text-stone-400"
          >
            Forgot password?
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
