"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthErrorCard } from "@/components/auth/AuthErrorCard";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
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
    <AuthCard
      title="Good to see you again 👋"
      description="Sign in to your AlumniLink account to continue."
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {searchParams.get("error") === "auth" && (
          <AuthErrorCard message="That confirmation or reset link was invalid or expired. Try again." />
        )}
        {error && <AuthErrorCard message={error} />}

        <AuthInput
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />

        <div className="space-y-1">
          <AuthInput
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
          />
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <AuthSubmitButton loading={pending} loadingText="Signing in…">
          Sign in
        </AuthSubmitButton>

        <p className="text-center text-sm text-stone-500 dark:text-stone-400">
          New here?{" "}
          <Link
            href={
              nextParam
                ? `/register?next=${encodeURIComponent(nextParam)}`
                : "/register"
            }
            className="font-semibold text-violet-600 underline-offset-4 hover:underline dark:text-violet-400"
          >
            Join your batch
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
