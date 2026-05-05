"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ClassmateRow } from "@/features/classmate-discovery/lib/types";
import {
  ClassmateReconnectButton,
  ClassmateSayHiButton,
} from "@/features/classmate-discovery/components/classmate-action-buttons";
import { KnowPersonButton } from "@/features/alumni-network/components/know-person-button";
import { ClassmateCard } from "@/components/social/ClassmateCard";
import { ReactionBar } from "@/features/reactions/components/reaction-bar";
import { SafeImage } from "@/components/common/SafeImage";
import { DefaultAvatar } from "@/components/common/placeholders";

export type PeopleDirectoryScope = "school" | "batchmates" | "classmates";

type BatchOption = {
  id: string;
  name: string;
  graduationYear: number | null;
};

type SectionOption = {
  id: string;
  name: string;
  batchId: string;
};

type PeerContact = { email: string | null; social: string | null };

type Props = {
  scope: PeopleDirectoryScope;
  title: string;
  subtitle: string;
  emptyMessage: string;
  schoolName: string;
  schoolSlug: string;
  schoolId: string;
  currentUserId: string;
  currentProfileId: string;
  contactByPeerUserId: Record<string, PeerContact>;
  classmates: ClassmateRow[];
  canSwitchSchool?: boolean;
  initialSearch?: string;
};

function buildBatchOptions(rows: ClassmateRow[]): BatchOption[] {
  const m = new Map<string, BatchOption>();
  for (const c of rows) {
    if (!m.has(c.batch_id)) {
      m.set(c.batch_id, {
        id: c.batch_id,
        name: c.batches?.name ?? "Batch",
        graduationYear: c.batches?.graduation_year ?? null,
      });
    }
  }
  return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function buildSectionOptions(
  rows: ClassmateRow[],
  batchId: string | null,
): SectionOption[] {
  const m = new Map<string, SectionOption>();
  for (const c of rows) {
    if (!c.section_id || !c.sections?.name) {
      continue;
    }
    if (batchId && c.batch_id !== batchId) {
      continue;
    }
    if (!m.has(c.section_id)) {
      m.set(c.section_id, {
        id: c.section_id,
        name: c.sections.name,
        batchId: c.batch_id,
      });
    }
  }
  return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function PeopleDirectory({
  scope,
  title,
  subtitle,
  emptyMessage,
  schoolName,
  schoolSlug,
  schoolId,
  currentUserId,
  currentProfileId,
  contactByPeerUserId,
  classmates,
  canSwitchSchool = false,
  initialSearch = "",
}: Props) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [search, setSearch] = useState(initialSearch);
  const [batchId, setBatchId] = useState<string>("");
  const [sectionId, setSectionId] = useState<string>("");
  const [selected, setSelected] = useState<ClassmateRow | null>(null);

  const batchOptions = useMemo(
    () => buildBatchOptions(classmates),
    [classmates],
  );

  const effectiveBatchForSections =
    scope === "school"
      ? batchId || null
      : classmates[0]?.batch_id ?? null;

  const sectionOptions = useMemo(
    () => buildSectionOptions(classmates, effectiveBatchForSections),
    [classmates, effectiveBatchForSections],
  );

  const sectionForFilter = useMemo(() => {
    if (!sectionId) {
      return "";
    }
    return sectionOptions.some((s) => s.id === sectionId) ? sectionId : "";
  }, [sectionId, sectionOptions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return classmates.filter((c) => {
      if (scope === "school") {
        if (batchId && c.batch_id !== batchId) {
          return false;
        }
        if (sectionForFilter && c.section_id !== sectionForFilter) {
          return false;
        }
      } else if (scope === "batchmates") {
        if (sectionForFilter && c.section_id !== sectionForFilter) {
          return false;
        }
      }
      if (!q) {
        return true;
      }
      const name = (c.display_name ?? "").toLowerCase();
      const line = (c.headline ?? "").toLowerCase();
      return name.includes(q) || line.includes(q);
    });
  }, [
    classmates,
    search,
    scope,
    batchId,
    sectionForFilter,
  ]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) {
      return;
    }
    if (selected) {
      if (!el.open) {
        el.showModal();
      }
    } else if (el.open) {
      el.close();
    }
  }, [selected]);

  const showBatchFilter = scope === "school";
  const showSectionFilter = scope === "school" || scope === "batchmates";
  const showJoinLink = scope === "school";

  return (
    <div className="space-y-6">
      <div className="social-card sticky top-0 z-10 -mx-4 rounded-2xl border border-stone-200/80 bg-white/90 px-4 pb-4 pt-4 backdrop-blur-md dark:border-stone-800 dark:bg-stone-950/90 sm:-mx-6 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--accent-from)]">
          {schoolName}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          {title}
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          {subtitle}
        </p>
        {canSwitchSchool ? (
          <p className="mt-2">
            <Link
              href="/dashboard/school"
              className="text-sm font-medium text-stone-800 underline-offset-4 hover:underline dark:text-stone-200"
            >
              Change school
            </Link>
          </p>
        ) : null}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <label className="block min-w-0 flex-1 sm:min-w-[12rem]">
            <span className="mb-1 block text-xs font-medium text-stone-600 dark:text-stone-400">
              Find someone
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or headline"
              autoComplete="off"
              className="w-full rounded-full border border-stone-200/90 bg-stone-50/70 px-4 py-3 text-sm text-stone-900 shadow-inner shadow-stone-900/5 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-from)]/35 dark:border-stone-700 dark:bg-stone-900/50 dark:text-stone-100"
            />
          </label>
          {showBatchFilter ? (
            <label className="block min-w-0 flex-1 sm:min-w-[10rem]">
              <span className="mb-1 block text-xs font-medium text-stone-600 dark:text-stone-400">
                Batch
              </span>
              <select
                value={batchId}
                onChange={(e) => {
                  setBatchId(e.target.value);
                  setSectionId("");
                }}
                className="w-full rounded-full border border-stone-200/90 bg-stone-50/70 px-4 py-3 text-sm text-stone-900 dark:border-stone-700 dark:bg-stone-900/50 dark:text-stone-100"
              >
                <option value="">Everyone</option>
                {batchOptions.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                    {b.graduationYear != null ? ` (${b.graduationYear})` : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {showSectionFilter ? (
            <label className="block min-w-0 flex-1 sm:min-w-[10rem]">
              <span className="mb-1 block text-xs font-medium text-stone-600 dark:text-stone-400">
                Section
              </span>
              <select
                value={sectionForFilter}
                onChange={(e) => setSectionId(e.target.value)}
                disabled={sectionOptions.length === 0}
                className="w-full rounded-full border border-stone-200/90 bg-stone-50/70 px-4 py-3 text-sm text-stone-900 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900/50 dark:text-stone-100"
              >
                <option value="">
                  {scope === "batchmates"
                    ? "All sections in your batch"
                    : "All sections"}
                </option>
                {sectionOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 px-6 py-14 text-center dark:border-stone-600 dark:bg-stone-900/40"
          role="status"
        >
          <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
            {emptyMessage}
          </p>
          {showJoinLink ? (
            <>
              <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
                Share your school&apos;s join link so more alumni can register.
              </p>
              <p className="mt-5">
                <Link
                  href={`/s/${schoolSlug}/join`}
                  className="text-sm font-medium text-stone-900 underline-offset-4 hover:underline dark:text-stone-100"
                >
                  Open join page
                </Link>
              </p>
            </>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {filtered.map((c) => (
            <ClassmateCard
              key={c.id}
              classmate={c}
              schoolId={schoolId}
              currentProfileId={currentProfileId}
              onOpenDetail={() => setSelected(c)}
            />
          ))}
        </div>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onCancel={(e) => {
          e.preventDefault();
          setSelected(null);
        }}
        className="w-[calc(100vw-2rem)] max-w-md rounded-2xl border border-stone-200 bg-white p-0 text-stone-900 shadow-xl backdrop:bg-stone-900/40 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-50"
      >
        {selected ? (
          <div className="max-h-[85vh] overflow-y-auto p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <SafeImage
                src={selected.photo_url}
                fallback={<DefaultAvatar />}
                alt={`${selected.display_name?.trim() || "Alumni"} profile photo`}
                className="size-20 shrink-0 rounded-2xl"
                imgClassName="object-cover"
              />
              <div className="min-w-0 flex-1">
                <h2
                  id={titleId}
                  className="text-lg font-semibold text-stone-900 dark:text-stone-50"
                >
                  {selected.display_name?.trim() || "Alumni"}
                </h2>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  {selected.batches?.name ?? "—"}
                  {selected.batches?.graduation_year != null
                    ? ` · ${selected.batches.graduation_year}`
                    : ""}
                  {selected.sections?.name
                    ? ` · ${selected.sections.name}`
                    : ""}
                </p>
              </div>
            </div>

            {selected.headline ? (
              <p className="mt-4 text-sm text-stone-700 dark:text-stone-300">
                {selected.headline}
              </p>
            ) : null}

            {[selected.location_city, selected.location_country].some(Boolean) ? (
              <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
                <span className="font-medium text-stone-700 dark:text-stone-300">
                  Location:{" "}
                </span>
                {[selected.location_city, selected.location_country]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            ) : null}

            {selected.social_url ? (
              <p className="mt-3 text-sm">
                <span className="font-medium text-stone-700 dark:text-stone-300">
                  Link:{" "}
                </span>
                <a
                  href={selected.social_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-stone-900 underline-offset-2 hover:underline dark:text-stone-100"
                >
                  {selected.social_url}
                </a>
              </p>
            ) : null}

            {(() => {
              const shared = contactByPeerUserId[selected.user_id];
              if (!shared) {
                return null;
              }
              return (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 px-3 py-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
                  <p className="text-xs font-medium text-emerald-900 dark:text-emerald-100">
                    Shared after reconnect
                  </p>
                  {shared.email ? (
                    <p className="mt-2 break-all text-stone-800 dark:text-stone-200">
                      <span className="font-medium">Email: </span>
                      <a
                        href={`mailto:${shared.email}`}
                        className="underline-offset-2 hover:underline"
                      >
                        {shared.email}
                      </a>
                    </p>
                  ) : null}
                  {shared.social ? (
                    <p className="mt-2 break-all text-stone-800 dark:text-stone-200">
                      <span className="font-medium">Social: </span>
                      <a
                        href={shared.social}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline-offset-2 hover:underline"
                      >
                        {shared.social}
                      </a>
                    </p>
                  ) : null}
                </div>
              );
            })()}

            {selected.user_id !== currentUserId ? (
              <>
                <ReactionBar
                  targetType="alumni_profile"
                  targetId={selected.id}
                  schoolId={schoolId}
                />
                <div className="mt-4 space-y-3 border-t border-stone-100 pt-4 dark:border-stone-800">
                  <KnowPersonButton
                    schoolId={schoolId}
                    myProfileId={currentProfileId}
                    peerProfileId={selected.id}
                  />
                  <div className="flex flex-wrap gap-2">
                    <ClassmateSayHiButton
                      schoolId={schoolId}
                      peerUserId={selected.user_id}
                    />
                    <ClassmateReconnectButton
                      schoolId={schoolId}
                      peerUserId={selected.user_id}
                    />
                  </div>
                </div>
              </>
            ) : null}

            <div className="mt-6 flex justify-end gap-2 border-t border-stone-100 pt-4 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="min-h-10 rounded-xl bg-stone-900 px-4 text-sm font-medium text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
