"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CheckCircle2,
  ChevronLeft,
  Clock,
  GraduationCap,
  Layers,
} from "lucide-react";
import { saveAlumniProfile } from "@/features/alumni-profile/actions/profile-actions";
import { cn } from "@/lib/cn";

const schema = z.object({
  display_name: z.string().min(2, "Enter at least 2 characters.").max(80),
  headline: z.string().max(120).optional(),
  location_city: z.string().max(60).optional(),
  location_country: z.string().max(60).optional(),
  social_url: z
    .string()
    .max(255)
    .refine((v) => !v || v.startsWith("https://") || v.startsWith("http://"), {
      message: "Must start with https://",
    })
    .optional(),
  is_profile_public: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

type Props = {
  schoolId: string;
  schoolName: string;
  schoolSlug: string;
  batchId: string;
  batchLabel: string;
  sectionId: string | null;
  sectionLabel: string | null;
  existingProfileId: string | null;
  suggestedDisplayName: string;
  currentStatus: string | null;
};

const inputCls =
  "w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 outline-none ring-violet-500 transition placeholder:text-stone-400 focus:border-violet-400 focus:ring-1 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500";

export function JoinProfileForm({
  schoolId,
  schoolName,
  schoolSlug,
  batchId,
  batchLabel,
  sectionId,
  sectionLabel,
  existingProfileId,
  suggestedDisplayName,
  currentStatus,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { display_name: suggestedDisplayName },
  });

  function onSubmit(values: FormValues) {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("school_id", schoolId);
      fd.append("batch_id", batchId);
      fd.append("section_id", sectionId ?? "");
      fd.append("display_name", values.display_name);
      fd.append("headline", values.headline ?? "");
      fd.append("location_city", values.location_city ?? "");
      fd.append("location_country", values.location_country ?? "");
      fd.append("social_url", values.social_url ?? "");
      fd.append(
        "is_profile_public",
        values.is_profile_public ? "true" : "false",
      );
      fd.append("revalidate_join_slug", schoolSlug);
      if (existingProfileId) {
        fd.append("profile_id", existingProfileId);
      }

      const res = await saveAlumniProfile(fd);
      if (res.ok) {
        setDone(true);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  /* ── Already-pending guard ── */
  if (currentStatus === "pending" && !done) {
    return (
      <div className="w-full max-w-sm space-y-5">
        <div className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 px-5 py-6 text-center dark:border-amber-800/50 dark:bg-amber-950/30">
          <Clock className="mx-auto mb-2 h-8 w-8 text-amber-500" />
          <p className="font-semibold text-amber-900 dark:text-amber-200">
            Waiting for approval
          </p>
          <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-300/80">
            Your alumni profile is under review by the school admin. You'll have
            full access once approved.
          </p>
        </div>
        <BatchSummary batchLabel={batchLabel} sectionLabel={sectionLabel} />
        <div className="text-center">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-violet-600 underline-offset-4 hover:underline dark:text-violet-400"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  /* ── Already-approved guard ── */
  if (currentStatus === "approved" && !done) {
    return (
      <div className="w-full max-w-sm space-y-5">
        <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-6 text-center dark:border-emerald-800/50 dark:bg-emerald-950/30">
          <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
          <p className="font-semibold text-emerald-900 dark:text-emerald-200">
            You're an approved member!
          </p>
          <p className="mt-1 text-sm text-emerald-800/80 dark:text-emerald-300/80">
            You already have an active profile for {schoolName}. Head to your
            dashboard to connect with classmates.
          </p>
        </div>
        <div className="text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  /* ── Success state ── */
  if (done) {
    return (
      <div className="w-full max-w-sm space-y-5 text-center">
        <div className="overflow-hidden rounded-2xl border border-violet-200 bg-violet-50 px-5 py-8 dark:border-violet-800/50 dark:bg-violet-950/30">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30">
            <CheckCircle2 className="h-7 w-7 text-white" />
          </div>
          <p className="text-lg font-bold text-violet-900 dark:text-violet-200">
            Profile submitted!
          </p>
          <p className="mt-2 text-sm text-violet-800/80 dark:text-violet-300/80">
            Your alumni profile has been submitted and is waiting for school
            admin approval. We'll update your account once it's approved.
          </p>
        </div>
        <BatchSummary batchLabel={batchLabel} sectionLabel={sectionLabel} />
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
        >
          Go to dashboard
        </Link>
      </div>
    );
  }

  /* ── Profile form ── */
  return (
    <div className="w-full max-w-sm space-y-5">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
          Complete your profile
        </h2>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Just a few details and you're in.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-200 text-xs font-bold text-violet-700 dark:bg-violet-900/50 dark:text-violet-400">
          ✓
        </span>
        <span className="h-px w-8 bg-violet-200 dark:bg-violet-800" />
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-200 text-xs font-bold text-violet-700 dark:bg-violet-900/50 dark:text-violet-400">
          ✓
        </span>
        <span className="h-px w-8 bg-violet-200 dark:bg-violet-800" />
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
          3
        </span>
      </div>

      {/* Locked batch summary */}
      <BatchSummary
        batchLabel={batchLabel}
        sectionLabel={sectionLabel}
        schoolSlug={schoolSlug}
        batchId={batchId}
        sectionId={sectionId}
      />

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-950"
      >
        <div className="space-y-4 px-5 py-6">
          {/* Display name */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-stone-700 dark:text-stone-300">
              Full name
              <span className="ml-1 text-red-500">*</span>
            </label>
            <input
              {...register("display_name")}
              placeholder="Your full name"
              autoComplete="name"
              className={inputCls}
            />
            {errors.display_name && (
              <p className="mt-1 text-xs text-red-600">{errors.display_name.message}</p>
            )}
          </div>

          {/* Headline */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-stone-700 dark:text-stone-300">
              Status line{" "}
              <span className="font-normal text-stone-400">optional</span>
            </label>
            <input
              {...register("headline")}
              placeholder="e.g. Nurse at PGH · Manila"
              className={inputCls}
            />
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-stone-700 dark:text-stone-300">
                City{" "}
                <span className="font-normal text-stone-400">optional</span>
              </label>
              <input
                {...register("location_city")}
                placeholder="City"
                autoComplete="address-level2"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-stone-700 dark:text-stone-300">
                Country{" "}
                <span className="font-normal text-stone-400">optional</span>
              </label>
              <input
                {...register("location_country")}
                placeholder="Country"
                autoComplete="country-name"
                className={inputCls}
              />
            </div>
          </div>

          {/* Social */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-stone-700 dark:text-stone-300">
              Social or website{" "}
              <span className="font-normal text-stone-400">optional</span>
            </label>
            <input
              {...register("social_url")}
              type="url"
              placeholder="https://"
              className={inputCls}
            />
            {errors.social_url && (
              <p className="mt-1 text-xs text-red-600">{errors.social_url.message}</p>
            )}
          </div>

          {/* Visibility toggle */}
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 bg-stone-50/80 px-3 py-3 dark:border-stone-700 dark:bg-stone-900/40">
            <input
              type="checkbox"
              {...register("is_profile_public")}
              className="mt-0.5 size-4 rounded border-stone-300 text-violet-600 focus:ring-violet-500"
            />
            <span className="text-sm text-stone-600 dark:text-stone-400">
              Allow approved classmates to view my profile details
            </span>
          </label>
        </div>

        {/* Error */}
        {error && (
          <div className="border-t border-red-100 bg-red-50 px-5 py-3 dark:border-red-900/30 dark:bg-red-950/30">
            <p className="text-sm text-red-700 dark:text-red-400" role="alert">
              {error}
            </p>
          </div>
        )}

        {/* Submit */}
        <div className="border-t border-stone-100 bg-stone-50/60 px-5 py-4 dark:border-stone-800 dark:bg-stone-900/40">
          <button
            type="submit"
            disabled={isPending}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition",
              "bg-gradient-to-r from-violet-600 to-fuchsia-500",
              "hover:from-violet-700 hover:to-fuchsia-600 hover:shadow-md hover:shadow-violet-500/25",
              "active:scale-[0.98] disabled:opacity-60",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2",
            )}
          >
            {isPending ? "Submitting…" : "Submit Alumni Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* Shared batch/section summary pill */
function BatchSummary({
  batchLabel,
  sectionLabel,
  schoolSlug,
  batchId,
  sectionId,
}: {
  batchLabel: string;
  sectionLabel: string | null;
  schoolSlug?: string;
  batchId?: string;
  sectionId?: string | null;
}) {
  const changeHref =
    schoolSlug ? `/s/${schoolSlug}/join` : undefined;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3 dark:border-violet-900/40 dark:bg-violet-950/20">
      <div className="flex items-center gap-3 min-w-0">
        <GraduationCap className="h-4 w-4 shrink-0 text-violet-500" />
        <div className="min-w-0 text-sm">
          <span className="font-semibold text-violet-900 dark:text-violet-200">
            {batchLabel}
          </span>
          {sectionLabel && (
            <>
              <Layers className="mx-1.5 inline h-3 w-3 text-violet-400" />
              <span className="text-violet-700 dark:text-violet-300">
                {sectionLabel}
              </span>
            </>
          )}
        </div>
      </div>
      {changeHref && (
        <Link
          href={changeHref}
          className="shrink-0 text-xs font-medium text-violet-500 underline-offset-4 hover:underline dark:text-violet-400"
        >
          Change
        </Link>
      )}
    </div>
  );
}
