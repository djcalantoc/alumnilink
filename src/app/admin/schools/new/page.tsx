import type { Metadata } from "next";
import { SchoolForm } from "@/features/super-admin-schools/components/school-form";

export const metadata: Metadata = {
  title: "New school",
};

export default function NewSchoolPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          New school
        </h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          Save the school first, then add logo and cover on the next screen.
        </p>
      </div>
      <SchoolForm mode="create" />
    </div>
  );
}
