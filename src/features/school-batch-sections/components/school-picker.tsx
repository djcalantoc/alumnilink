import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AccessibleSchool } from "@/features/school-batch-sections/lib/access";

type SchoolPickerProps = {
  schools: AccessibleSchool[];
  /** Path without query, e.g. /school-admin/batches */
  targetPath: string;
  title: string;
  description: string;
  /** Card footer line (default: manage schools). */
  actionLabel?: string;
};

export function SchoolPicker({
  schools,
  targetPath,
  title,
  description,
  actionLabel = "Manage this school →",
}: SchoolPickerProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          {title}
        </h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          {description}
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {schools.map((school) => (
          <li key={school.id}>
            <Link href={`${targetPath}?schoolId=${school.id}`} className="block">
              <Card className="h-full transition-colors hover:border-stone-400 dark:hover:border-stone-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{school.name}</CardTitle>
                  <CardDescription className="font-mono text-xs">
                    {school.slug}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-stone-600 dark:text-stone-400">
                  {actionLabel}
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
