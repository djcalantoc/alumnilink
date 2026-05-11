"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthErrorCard, AuthInfoCard } from "@/components/auth/AuthErrorCard";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
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
    <AuthCard
      title="Reset your password"
      description="Enter your email and we'll send you a link to choose a new password."
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {error && <AuthErrorCard message={error} />}
        {info && <AuthInfoCard message={info} />}

        <AuthInput
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />

        <AuthSubmitButton loading={pending} loadingText="Sending…">
          Send reset link
        </AuthSubmitButton>

        <p className="text-center text-sm text-stone-500 dark:text-stone-400">
          <Link
            href="/login"
            className="font-semibold text-violet-600 underline-offset-4 hover:underline dark:text-violet-400"
          >
            ← Back to sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
