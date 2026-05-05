"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useTransition, useState, useEffect } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { SelectField } from "@/components/forms/select-field";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/common/SafeImage";
import { DefaultAvatar } from "@/components/common/placeholders";
import { ProfileHeader } from "@/components/social/ProfileHeader";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  saveAlumniProfile,
  uploadAlumniProfilePhoto,
} from "@/features/alumni-profile/actions/profile-actions";
import {
  alumniProfileFormSchema,
  type AlumniProfileFormInput,
  type AlumniProfileFormValues,
} from "@/features/alumni-profile/lib/profile-schema";
import type {
  AlumniProfileRow,
  BatchOption,
  SectionOption,
} from "@/features/alumni-profile/lib/types";
import { cn } from "@/lib/cn";

function buildAlumniProfileFormData(
  values: AlumniProfileFormValues,
  opts: { profileId?: string | null; joinSlug?: string | null },
): FormData {
  const fd = new FormData();
  fd.append("school_id", values.school_id);
  fd.append("batch_id", values.batch_id);
  fd.append("section_id", values.section_id ?? "");
  fd.append("display_name", values.display_name);
  fd.append("headline", values.headline ?? "");
  fd.append("location_city", values.location_city ?? "");
  fd.append("location_country", values.location_country ?? "");
  fd.append("social_url", values.social_url ?? "");
  fd.append("is_profile_public", values.is_profile_public ? "true" : "false");
  if (opts.profileId) {
    fd.append("profile_id", opts.profileId);
  }
  if (opts.joinSlug) {
    fd.append("revalidate_join_slug", opts.joinSlug);
  }
  return fd;
}

function defaultsForProfile(
  schoolId: string,
  profile: AlumniProfileRow | null,
  suggestedDisplayName: string,
): AlumniProfileFormInput {
  if (!profile) {
    return {
      school_id: schoolId,
      batch_id: "",
      section_id: "",
      display_name: suggestedDisplayName,
      headline: "",
      location_city: "",
      location_country: "",
      social_url: "",
      is_profile_public: false,
    };
  }
  return {
    school_id: schoolId,
    batch_id: profile.batch_id,
    section_id: profile.section_id ?? "",
    display_name: profile.display_name ?? "",
    headline: profile.headline ?? "",
    location_city: profile.location_city ?? "",
    location_country: profile.location_country ?? "",
    social_url: profile.social_url ?? "",
    is_profile_public: profile.is_profile_public,
  };
}

type AlumniProfileFormProps = {
  school: {
    id: string;
    name: string;
    slug: string;
    visibility: string;
    primary_color?: string | null;
    cover_photo_url?: string | null;
  };
  batches: BatchOption[];
  sections: SectionOption[];
  existingProfile: AlumniProfileRow | null;
  /** When set, revalidates the join page after save. */
  joinSlug?: string | null;
  suggestedDisplayName?: string;
  /** From landing / join URL — selects batch when creating a new profile. */
  prefillBatchId?: string | null;
};

export function AlumniProfileForm({
  school,
  batches,
  sections,
  existingProfile,
  joinSlug = null,
  suggestedDisplayName = "",
  prefillBatchId = null,
}: AlumniProfileFormProps) {
  const router = useRouter();
  const noBatches = batches.length === 0;
  const [saveMsg, setSaveMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [photoMsg, setPhotoMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [isSaving, startSave] = useTransition();
  const [isPhoto, startPhoto] = useTransition();

  const defaultValues = useMemo(
    () =>
      defaultsForProfile(
        school.id,
        existingProfile,
        suggestedDisplayName,
      ),
    [school.id, existingProfile, suggestedDisplayName],
  );

  const methods = useForm<AlumniProfileFormInput, unknown, AlumniProfileFormValues>({
    resolver: zodResolver(alumniProfileFormSchema),
    defaultValues,
  });

  const { handleSubmit, setValue, register, control } = methods;
  const batchId = useWatch({ control, name: "batch_id", defaultValue: "" });
  const sectionId = useWatch({ control, name: "section_id", defaultValue: "" });
  const displayNameLive = useWatch({ control, name: "display_name", defaultValue: "" });
  const headlineLive = useWatch({ control, name: "headline", defaultValue: "" });

  const sectionOptions = useMemo(() => {
    if (!batchId) {
      return [];
    }
    return sections.filter((s) => s.batch_id === batchId);
  }, [batchId, sections]);

  useEffect(() => {
    if (
      typeof sectionId === "string" &&
      sectionId &&
      !sectionOptions.some((s) => s.id === sectionId)
    ) {
      setValue("section_id", "");
    }
  }, [batchId, sectionId, sectionOptions, setValue]);

  useEffect(() => {
    if (existingProfile || !prefillBatchId) {
      return;
    }
    if (batches.some((b) => b.id === prefillBatchId)) {
      setValue("batch_id", prefillBatchId);
    }
  }, [existingProfile, prefillBatchId, batches, setValue]);

  const batchForHeader = batches.find((b) => b.id === batchId);
  const sectionForHeader = sectionOptions.find((s) => s.id === sectionId);
  const batchLabel = batchForHeader
    ? `${batchForHeader.name}${
        batchForHeader.graduation_year != null
          ? ` · ${batchForHeader.graduation_year}`
          : ""
      }`
    : "Pick your batch below";
  const sectionForHeaderLabel = sectionForHeader?.name ?? null;

  const headerName =
    typeof displayNameLive === "string" && displayNameLive.trim()
      ? displayNameLive.trim()
      : existingProfile?.display_name?.trim() || "Your name";

  const headerHeadline =
    typeof headlineLive === "string" ? headlineLive : existingProfile?.headline ?? null;

  const statusMessage = existingProfile
    ? existingProfile.status === "approved"
      ? "You're on the wall — classmates can say hi."
      : existingProfile.status === "pending"
        ? "Almost there — moderators are giving your card a quick look."
        : existingProfile.status === "rejected"
          ? "This profile needs another pass — your school admin can help."
          : existingProfile.status === "archived"
            ? "This profile is tucked away for now."
            : null
    : "Add your batch so old friends can find you.";

  return (
    <div className="space-y-5">
      <ProfileHeader
        schoolName={school.name}
        displayName={headerName}
        headline={headerHeadline}
        photoUrl={existingProfile?.photo_url ?? null}
        coverUrl={school.cover_photo_url ?? null}
        primaryColor={school.primary_color ?? null}
        batchLabel={batchLabel}
        sectionLabel={sectionForHeaderLabel}
        statusMessage={statusMessage}
      >
        {existingProfile?.status === "approved" ? (
          <>
            <Link
              href={`/dashboard/classmates?schoolId=${encodeURIComponent(school.id)}`}
              className="social-pill-btn inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--accent-from)] sm:w-auto dark:text-[var(--accent-to)]"
            >
              Say Hi 👋
            </Link>
            <Link
              href={`/dashboard/school?schoolId=${encodeURIComponent(school.id)}`}
              className="social-pill-btn inline-flex min-h-11 w-full items-center justify-center rounded-full social-gradient px-4 py-2 text-sm font-semibold text-white shadow-sm sm:w-auto"
            >
              Reconnect
            </Link>
            <Link
              href={`/dashboard/network?schoolId=${encodeURIComponent(school.id)}`}
              className="social-pill-btn inline-flex min-h-11 w-full items-center justify-center rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-800 sm:w-auto dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
            >
              I Know This Person
            </Link>
            <div className="flex w-full flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
              <Link
                href={`/s/${school.slug}/memories`}
                className="font-medium underline-offset-4 hover:text-stone-800 hover:underline dark:hover:text-stone-200"
              >
                Memory wall
              </Link>
              <Link
                href={`/dashboard/events?schoolId=${encodeURIComponent(school.id)}`}
                className="font-medium underline-offset-4 hover:text-stone-800 hover:underline dark:hover:text-stone-200"
              >
                Events
              </Link>
              <Link
                href={`/s/${school.slug}/directory`}
                className="font-medium underline-offset-4 hover:text-stone-800 hover:underline dark:hover:text-stone-200"
              >
                Directory
              </Link>
            </div>
          </>
        ) : null}
      </ProfileHeader>

      <Card className="social-card rounded-2xl border-stone-200/80 dark:border-stone-800">
      <FormProvider {...methods}>
        <form
          className="flex flex-col"
          onSubmit={handleSubmit((values) => {
            setSaveMsg(null);
            startSave(async () => {
              const fd = buildAlumniProfileFormData(values, {
                profileId: existingProfile?.id,
                joinSlug,
              });
              const res = await saveAlumniProfile(fd);
              if (res.ok) {
                setSaveMsg({
                  type: "ok",
                  text: existingProfile
                    ? "Saved — your classmates will see the update."
                    : "You are on the list! Moderators usually wave you through soon.",
                });
                router.refresh();
              } else {
                setSaveMsg({ type: "err", text: res.error });
              }
            });
          })}
        >
          <CardContent className="flex flex-col gap-5 px-4 pb-2 pt-5 sm:px-6">
            <input type="hidden" {...register("school_id")} />

            {school.visibility === "private" ? (
              <p className="text-xs text-stone-500 dark:text-stone-400">
                This school is private — you can still update your card; some lists
                stay invite-only.
              </p>
            ) : null}

            {existingProfile?.status === "pending" ? (
              <div
                className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/35 dark:text-amber-100"
                role="status"
              >
                <p className="font-medium">Yearbook desk is on it</p>
                <p className="mt-1 text-amber-900/90 dark:text-amber-200/90">
                  Once you are approved, the classmate wall and memories open up.
                </p>
              </div>
            ) : null}

            {noBatches ? (
              <p
                className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
                role="status"
              >
                No batches are available for this school yet, or your account
                cannot view them. Ask a school administrator to add batches, or
                check that this page is for the right school.
              </p>
            ) : null}

            <TextField
              name="display_name"
              label="Full name"
              autoComplete="name"
              placeholder="Your name"
            />

            <SelectField
              name="batch_id"
              label="Batch"
              hint="Graduating class or cohort"
            >
              <option value="" disabled>
                Select batch
              </option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                  {b.graduation_year != null ? ` (${b.graduation_year})` : ""}
                </option>
              ))}
            </SelectField>

            <SelectField
              name="section_id"
              label="Section"
              hint="Optional — homeroom or stream"
              disabled={!batchId || sectionOptions.length === 0}
            >
              <option value="">None</option>
              {sectionOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </SelectField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                name="location_city"
                label="Current city"
                placeholder="City"
                autoComplete="address-level2"
              />
              <TextField
                name="location_country"
                label="Country"
                placeholder="Country"
                autoComplete="country-name"
              />
            </div>

            <TextareaField
              name="headline"
              label="Status line"
              hint="A short line classmates might see after you are approved"
              rows={2}
              placeholder="e.g. Product designer · NYC"
            />

            <TextField
              name="social_url"
              label="Social or website (optional)"
              type="url"
              inputMode="url"
              placeholder="https://"
            />

            <FormField
              label="Profile visibility"
              htmlFor="is_profile_public"
              hint="When approved, allow classmates at this school to see your public profile details."
            >
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 bg-stone-50/80 px-3 py-3 dark:border-stone-700 dark:bg-stone-900/40">
                <input
                  id="is_profile_public"
                  type="checkbox"
                  className="mt-0.5 size-4 rounded border-stone-300 text-stone-900 focus:ring-stone-400 dark:border-stone-600 dark:bg-stone-900"
                  {...register("is_profile_public")}
                />
                <span className="text-sm text-stone-700 dark:text-stone-300">
                  Make my profile public to approved alumni at this school
                </span>
              </label>
            </FormField>

            <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/50 p-4 dark:border-stone-600 dark:bg-stone-900/30">
              <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
                Profile photo
              </p>
              {!existingProfile?.id ? (
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                  Save this form once, then you can upload a photo.
                </p>
              ) : (
                <>
                  <div className="mt-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                    <SafeImage
                      src={existingProfile.photo_url}
                      fallback={<DefaultAvatar />}
                      alt="Your profile photo"
                      className="size-20 shrink-0 rounded-2xl ring-1 ring-stone-200 dark:ring-stone-700"
                      imgClassName="object-cover"
                    />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={isPhoto}
                      className="max-w-full text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white dark:text-stone-400 dark:file:bg-stone-100 dark:file:text-stone-900"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file || !existingProfile?.id) {
                          return;
                        }
                        setPhotoMsg(null);
                        startPhoto(async () => {
                          const fd = new FormData();
                          fd.append("profile_id", existingProfile.id);
                          fd.append("file", file);
                          const r = await uploadAlumniProfilePhoto(fd);
                          if (r.ok) {
                            setPhotoMsg({ type: "ok", text: "Photo updated." });
                            router.refresh();
                          } else {
                            setPhotoMsg({ type: "err", text: r.error });
                          }
                        });
                      }}
                    />
                  </div>
                  {photoMsg ? (
                    <p
                      className={cn(
                        "mt-2 text-xs",
                        photoMsg.type === "ok"
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400",
                      )}
                      role="alert"
                    >
                      {photoMsg.text}
                    </p>
                  ) : null}
                </>
              )}
            </div>

            {saveMsg ? (
              <p
                className={cn(
                  "text-sm",
                  saveMsg.type === "ok"
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400",
                )}
                role="alert"
              >
                {saveMsg.text}
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="flex flex-col gap-3 border-t border-stone-100 px-4 pb-6 pt-6 dark:border-stone-800 sm:flex-row sm:justify-end sm:px-6">
            <Button
              type="submit"
              disabled={isSaving || noBatches}
              className="social-pill-btn w-full rounded-full sm:w-auto"
            >
              {isSaving
                ? "Saving…"
                : existingProfile
                  ? "Save profile"
                  : "Join my batch"}
            </Button>
          </CardFooter>
        </form>
      </FormProvider>
    </Card>
    </div>
  );
}
