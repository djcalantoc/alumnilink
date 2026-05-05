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
import { getPublicAppUrl } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = getSafeNextPath(searchParams.get("next"));
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setPending(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;
    const fullName = (form.elements.namedItem("fullName") as HTMLInputElement)
      .value;

    const supabase = createSupabaseBrowserClient();
    const origin = getPublicAppUrl();

    const { data, error: signError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        data: {
          full_name: fullName,
        },
      },
    });

    if (signError) {
      setError(signError.message);
      setPending(false);
      return;
    }

    if (data.session && data.user) {
      await ensurePublicUserProfile(fullName);
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
      return;
    }

    setInfo(
      "Check your inbox to confirm your email. After confirming, you can sign in.",
    );
    setPending(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>
          Register with your email. You can join a school after your profile is
          set up.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}
          {info ? (
            <p className="text-sm text-stone-600 dark:text-stone-400">{info}</p>
          ) : null}
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
            Full name
            <Input
              className="mt-1.5"
              name="fullName"
              type="text"
              autoComplete="name"
              required
            />
          </label>
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
              autoComplete="new-password"
              required
              minLength={8}
            />
          </label>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create account"}
          </Button>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Already have an account?{" "}
            <Link
              href={
                nextParam
                  ? `/login?next=${encodeURIComponent(nextParam)}`
                  : "/login"
              }
              className="font-medium text-stone-900 underline-offset-4 hover:underline dark:text-stone-100"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
