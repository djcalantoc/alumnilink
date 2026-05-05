import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SchoolForm } from "@/features/super-admin-schools/components/school-form";
import { SchoolImageField } from "@/features/super-admin-schools/components/school-image-field";
import { fetchAdminSchoolById } from "@/features/super-admin-schools/lib/queries";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { data } = await fetchAdminSchoolById(id);
  return {
    title: data ? data.name : "School",
  };
}

export default async function EditSchoolPage({ params }: PageProps) {
  const { id } = await params;
  const { data: school, error } = await fetchAdminSchoolById(id);

  if (error) {
    return (
      <div
        className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/40"
        role="alert"
      >
        <p className="font-medium text-red-900 dark:text-red-200">
          Could not load school
        </p>
        <p className="mt-1 text-sm text-red-800 dark:text-red-300">{error}</p>
      </div>
    );
  }

  if (!school) {
    notFound();
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          {school.name}
        </h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          Update details and branding. Slug changes affect URLs.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Branding</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-8 sm:grid-cols-2">
          <SchoolImageField
            schoolId={school.id}
            kind="logo"
            label="Logo"
            currentUrl={school.logo_url}
            variant="logo"
          />
          <div className="sm:col-span-2">
            <SchoolImageField
              schoolId={school.id}
              kind="cover"
              label="Cover photo"
              currentUrl={school.cover_photo_url}
              variant="cover"
            />
          </div>
        </CardContent>
      </Card>

      <SchoolForm mode="edit" school={school} />
    </div>
  );
}
