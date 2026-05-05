import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Create account",
};

function RegisterFallback() {
  return (
    <p className="text-center text-sm text-stone-500 dark:text-stone-400">
      Loading…
    </p>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFallback />}>
      <RegisterForm />
    </Suspense>
  );
}
