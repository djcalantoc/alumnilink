"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  createMemory,
  fetchMemoryFormOptions,
} from "@/features/memory-wall/actions/memory-actions";
import type { MemorySchoolOption } from "@/features/memory-wall/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/cn";

type Props = {
  schools: MemorySchoolOption[];
};

export function MemoryUploadForm({ schools }: Props) {
  const router = useRouter();
  const [schoolId, setSchoolId] = useState(schools[0]?.id ?? "");
  const [batches, setBatches] = useState<
    { id: string; name: string; graduation_year: number | null }[]
  >([]);
  const [sections, setSections] = useState<
    { id: string; name: string; batch_id: string }[]
  >([]);
  const [batchId, setBatchId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [caption, setCaption] = useState("");
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [submitMsg, setSubmitMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [loadingOptions, startOptions] = useTransition();
  const [submitting, startSubmit] = useTransition();

  useEffect(() => {
    let cancelled = false;
    if (!schoolId) {
      startOptions(() => {
        setBatches([]);
        setSections([]);
        setOptionsError(null);
      });
      return;
    }
    void (async () => {
      const r = await fetchMemoryFormOptions(schoolId);
      if (cancelled) {
        return;
      }
      startOptions(() => {
        if (!r.ok) {
          setBatches([]);
          setSections([]);
          setOptionsError(r.error);
          return;
        }
        setOptionsError(null);
        setBatches(r.batches);
        setSections(r.sections);
        setBatchId("");
        setSectionId("");
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [schoolId]);

  const sectionChoices = batchId
    ? sections.filter((s) => s.batch_id === batchId)
    : [];

  if (schools.length === 0) {
    return (
      <Card className="social-card rounded-2xl border-stone-200/80 dark:border-stone-800">
        <CardHeader className="px-4 pt-5 sm:px-6">
          <CardTitle className="text-lg font-semibold">Share a memory</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-5 text-sm text-stone-600 sm:px-6 dark:text-stone-400">
          <p>
            Join a school and get your alumni profile approved — then the photo
            booth opens.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="social-card rounded-2xl border-stone-200/80 dark:border-stone-800">
      <CardHeader className="px-4 pt-5 sm:px-6">
        <CardTitle className="text-lg font-semibold">Share a memory</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-5 sm:px-6">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitMsg(null);
            const form = e.currentTarget;
            startSubmit(async () => {
              const fd = new FormData(form);
              const r = await createMemory(fd);
              if (r.ok) {
                setSubmitMsg({
                  type: "ok",
                  text: "It is on the way — moderators will give it a thumbs-up soon.",
                });
                setCaption("");
                form.reset();
                setBatchId("");
                setSectionId("");
                router.refresh();
              } else {
                setSubmitMsg({ type: "err", text: r.error });
              }
            });
          }}
        >
          {schools.length > 1 ? (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                School
              </span>
              <select
                name="school_id"
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                required
                className="w-full rounded-2xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm dark:border-stone-700 dark:bg-stone-900/60 dark:text-stone-100"
              >
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <input type="hidden" name="school_id" value={schoolId} />
          )}

          {optionsError ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {optionsError}
            </p>
          ) : null}

          <div
            className={cn(
              "space-y-4",
              loadingOptions && "pointer-events-none opacity-60",
            )}
          >
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                Photo (JPG, PNG, or WebP, max 5MB)
              </span>
              <input
                name="file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                className="w-full text-sm text-stone-600 file:mr-3 file:rounded-2xl file:border-0 file:bg-stone-900 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-white dark:text-stone-400 dark:file:bg-stone-100 dark:file:text-stone-900"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                Caption
              </span>
              <textarea
                name="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                required
                rows={3}
                maxLength={2000}
                placeholder="What’s happening in this photo?"
                className="w-full rounded-2xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm dark:border-stone-700 dark:bg-stone-900/60 dark:text-stone-100"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                Batch (optional)
              </span>
              <select
                name="batch_id"
                value={batchId}
                onChange={(e) => {
                  setBatchId(e.target.value);
                  setSectionId("");
                }}
                className="w-full rounded-2xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm dark:border-stone-700 dark:bg-stone-900/60 dark:text-stone-100"
              >
                <option value="">—</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                    {b.graduation_year != null ? ` (${b.graduation_year})` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                Section (optional)
              </span>
              <select
                name="section_id"
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                disabled={!batchId || sectionChoices.length === 0}
                className="w-full rounded-2xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900/60 dark:text-stone-100"
              >
                <option value="">—</option>
                {sectionChoices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {submitMsg ? (
            <p
              className={cn(
                "text-sm",
                submitMsg.type === "ok"
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400",
              )}
              role="status"
            >
              {submitMsg.text}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={submitting || loadingOptions || !schoolId}
            className="social-pill-btn rounded-full social-gradient text-white shadow-sm hover:opacity-95"
          >
            {submitting ? "Sharing…" : "Share memory"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
