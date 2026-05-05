import type { Metadata } from "next";
import { UpdatePasswordForm } from "@/features/auth/components/update-password-form";

export const metadata: Metadata = {
  title: "New password",
};

export default function UpdatePasswordPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6">
      <UpdatePasswordForm />
    </div>
  );
}
