"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthErrorCard } from "@/components/auth/AuthErrorCard";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
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
    <AuthCard
      title="Choose a new password 🔐"
      description="Pick a strong password for your AlumniLink account."
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {error && <AuthErrorCard message={error} />}

        <AuthInput
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          required
          minLength={8}
        />

        <AuthInput
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your new password"
          required
          minLength={8}
        />

        <AuthSubmitButton loading={pending} loadingText="Saving…">
          Update password
        </AuthSubmitButton>

        <p className="text-center text-sm text-stone-500 dark:text-stone-400">
          Changed your mind?{" "}
          <Link
            href="/login"
            className="font-semibold text-violet-600 underline-offset-4 hover:underline dark:text-violet-400"
          >
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
