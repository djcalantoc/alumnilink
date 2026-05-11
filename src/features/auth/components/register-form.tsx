"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthErrorCard, AuthInfoCard } from "@/components/auth/AuthErrorCard";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
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

    // Happy path: Supabase issued a session immediately (email confirmation is off).
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

    // No session yet — either email confirmation is on, or the email already
    // exists (Supabase returns the existing user silently to avoid enumeration).
    // Try signing in with the submitted credentials to cover the "confirmation
    // disabled" case and give a better message either way.
    if (data.user) {
      const { data: signInData, error: signInErr } =
        await supabase.auth.signInWithPassword({ email, password });

      if (!signInErr && signInData.session && signInData.user) {
        await ensurePublicUserProfile(fullName);
        if (nextParam) {
          router.replace(nextParam);
          router.refresh();
          setPending(false);
          return;
        }
        const landing = await resolveAuthLandingPath(supabase, signInData.user);
        router.replace(landing);
        router.refresh();
        setPending(false);
        return;
      }
    }

    // Fallback: email confirmation is required — ask them to check inbox.
    setInfo(
      "Almost there! Check your inbox and click the confirmation link to activate your account.",
    );
    setPending(false);
  }

  return (
    <AuthCard
      title="Join your batch today 🎓"
      description="Create your AlumniLink account. You can join a school after setup."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <AuthErrorCard message={error} />}
        {info && <AuthInfoCard message={info} />}

        <AuthInput
          label="Full name"
          name="fullName"
          type="text"
          autoComplete="name"
          placeholder="Your full name"
          required
        />

        <AuthInput
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />

        <AuthInput
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          required
          minLength={8}
        />

        <AuthSubmitButton
          loading={pending}
          loadingText="Creating account…"
          className="mt-1"
        >
          Create account
        </AuthSubmitButton>

        <p className="text-center text-sm text-stone-500 dark:text-stone-400">
          Already part of AlumniLink?{" "}
          <Link
            href={
              nextParam
                ? `/login?next=${encodeURIComponent(nextParam)}`
                : "/login"
            }
            className="font-semibold text-violet-600 underline-offset-4 hover:underline dark:text-violet-400"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
