"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormField } from "@/components/forms/form-field";
import { SafeImage } from "@/components/common/SafeImage";
import { PhotoFallback } from "@/components/common/PhotoFallback";
import { DEFAULT_SCHOOL_COVER, DEFAULT_SCHOOL_LOGO } from "@/lib/images";
import { uploadSchoolImage } from "@/features/super-admin-schools/actions/school-actions";

type SchoolImageFieldProps = {
  schoolId: string;
  kind: "logo" | "cover";
  label: string;
  currentUrl: string | null;
  /** Cover uses wide aspect; logo square-ish */
  variant: "logo" | "cover";
};

export function SchoolImageField({
  schoolId,
  kind,
  label,
  currentUrl,
  variant,
}: SchoolImageFieldProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fallbackSrc =
    variant === "cover" ? DEFAULT_SCHOOL_COVER : DEFAULT_SCHOOL_LOGO;

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) {
      return;
    }

    setError(null);
    setLoading(true);
    const fd = new FormData();
    fd.set("schoolId", schoolId);
    fd.set("kind", kind);
    fd.set("file", file);

    const res = await uploadSchoolImage(fd);
    setLoading(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    router.refresh();
  }

  return (
    <FormField label={label} error={error ?? undefined}>
      <div className="space-y-3">
        <div
          className={
            variant === "cover"
              ? "relative aspect-[3/1] w-full max-w-xl overflow-hidden rounded-xl border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-900"
              : "relative h-24 w-24 overflow-hidden rounded-xl border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-900"
          }
        >
          <SafeImage
            src={currentUrl}
            fallback={<PhotoFallback src={fallbackSrc} />}
            alt=""
            className="absolute inset-0 size-full rounded-[inherit]"
            imgClassName="object-cover"
          />
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={loading}
          onChange={onFile}
          className="block w-full text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-stone-900 hover:file:bg-stone-200 dark:text-stone-400 dark:file:bg-stone-800 dark:file:text-stone-100 dark:hover:file:bg-stone-700"
        />
        {loading ? (
          <p className="text-xs text-stone-500">Uploading…</p>
        ) : null}
      </div>
    </FormField>
  );
}
