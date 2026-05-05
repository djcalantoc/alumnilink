"use client";

import { useEffect, useId, useRef } from "react";
import Link from "next/link";
import {
  ClassmateReconnectButton,
  ClassmateSayHiButton,
} from "@/features/classmate-discovery/components/classmate-action-buttons";
import { KnowPersonButton } from "@/features/alumni-network/components/know-person-button";
import type { NetworkProfileNode } from "@/features/alumni-network/lib/types";
import { SafeImage } from "@/components/common/SafeImage";
import { DefaultAvatar } from "@/components/common/placeholders";

type Props = {
  schoolId: string;
  viewerOwnProfileId: string;
  peer: NetworkProfileNode | null;
  open: boolean;
  onClose: () => void;
  badge?: string;
};

export function NetworkProfileMiniSheet({
  schoolId,
  viewerOwnProfileId,
  peer,
  open,
  onClose,
  badge,
}: Props) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) {
      return;
    }
    if (open && peer) {
      if (!el.open) {
        el.showModal();
      }
    } else if (el.open) {
      el.close();
    }
  }, [open, peer]);

  if (!peer) {
    return null;
  }

  const name = peer.display_name?.trim() ?? "Alumni";
  const isSelf = peer.id === viewerOwnProfileId;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="w-[calc(100vw-2rem)] max-w-md rounded-2xl border border-stone-200 bg-white p-0 text-stone-900 shadow-xl backdrop:bg-stone-900/45 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-50"
    >
      <div className="max-h-[85vh] overflow-y-auto p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <SafeImage
            src={peer.photo_url}
            fallback={<DefaultAvatar />}
            alt={`${name} profile photo`}
            className="size-16 shrink-0 rounded-2xl"
            imgClassName="object-cover"
          />
          <div className="min-w-0 flex-1">
            {badge ? (
              <span className="mb-1 inline-block rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                {badge}
              </span>
            ) : null}
            <h2
              id={titleId}
              className="text-lg font-semibold text-stone-900 dark:text-stone-50"
            >
              {name}
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {peer.batches?.name ?? "—"}
              {peer.batches?.graduation_year != null
                ? ` · ${peer.batches.graduation_year}`
                : ""}
              {peer.sections?.name ? ` · ${peer.sections.name}` : ""}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-stone-100 pt-4 dark:border-stone-800">
          <Link
            href={`/dashboard/network/${peer.id}`}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-stone-900 px-4 text-sm font-semibold text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
          >
            Full profile map
          </Link>
        </div>

        {!isSelf ? (
          <div className="mt-4 space-y-3 border-t border-stone-100 pt-4 dark:border-stone-800">
            <KnowPersonButton
              schoolId={schoolId}
              myProfileId={viewerOwnProfileId}
              peerProfileId={peer.id}
            />
            <div className="flex flex-wrap gap-2">
              <ClassmateSayHiButton
                schoolId={schoolId}
                peerUserId={peer.user_id}
              />
              <ClassmateReconnectButton
                schoolId={schoolId}
                peerUserId={peer.user_id}
              />
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex justify-end border-t border-stone-100 pt-4 dark:border-stone-800">
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 rounded-xl bg-stone-200 px-4 text-sm font-medium text-stone-900 hover:bg-stone-300 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700"
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}
