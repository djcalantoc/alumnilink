"use client";

import Link from "next/link";
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
import { getPublicAppUrl } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
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

    const supabase = createSupabaseBrowserClient();
    const origin = getPublicAppUrl();

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${origin}/auth/callback?type=recovery`,
      },
    );

    if (resetError) {
      setError(resetError.message);
      setPending(false);
      return;
    }

    setInfo(
      "If an account exists for that email, you will receive a reset link shortly.",
    );
    setPending(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>
          We will email you a link to choose a new password.
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
            Email
            <Input
              className="mt-1.5"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" disabled={pending}>
            {pending ? "Sending…" : "Send reset link"}
          </Button>
          <Link
            href="/login"
            className="text-sm text-stone-600 underline-offset-4 hover:underline dark:text-stone-400"
          >
            Back to sign in
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
