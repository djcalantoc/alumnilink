"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  blockAlumniFromConnections,
  removeConnection,
  sendConnectionRequest,
} from "@/features/alumni-network/actions/connection-actions";
import { CONNECTION_TYPES } from "@/features/alumni-network/lib/constants";
import { CONNECTION_TYPE_LABELS } from "@/features/alumni-network/lib/constants";
import type { AlumniConnectionRow } from "@/features/alumni-network/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type Props = {
  schoolId: string;
  myProfileId: string;
  peerProfileId: string;
  /** Tighter layout for classmate grid cards (hides block link). */
  compact?: boolean;
};

export function KnowPersonButton({
  schoolId,
  myProfileId,
  peerProfileId,
  compact = false,
}: Props) {
  const router = useRouter();
  const [row, setRow] = useState<AlumniConnectionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [connType, setConnType] = useState<string>("classmate");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("alumni_connections")
        .select("*")
        .eq("school_id", schoolId)
        .or(
          `and(requester_profile_id.eq.${myProfileId},receiver_profile_id.eq.${peerProfileId}),and(requester_profile_id.eq.${peerProfileId},receiver_profile_id.eq.${myProfileId})`,
        )
        .order("created_at", { ascending: false })
        .limit(12);
      if (cancelled || error) {
        setLoading(false);
        return;
      }
      const rows = (data ?? []) as AlumniConnectionRow[];
      const pick =
        rows.find((r) => r.status === "pending") ??
        rows.find((r) => r.status === "accepted") ??
        rows[0] ??
        null;
      setRow(pick);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [schoolId, myProfileId, peerProfileId]);

  if (loading) {
    return (
      <p className="text-xs text-stone-500 dark:text-stone-400">Loading…</p>
    );
  }

  if (row?.status === "accepted") {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">
          {compact ? "Connected" : `Connected · ${CONNECTION_TYPE_LABELS[row.connection_type]}`}
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() => {
            setMsg(null);
            startTransition(async () => {
              const fd = new FormData();
              fd.append("connection_id", row.id);
              const r = await removeConnection(fd);
              if (!r.ok) {
                setMsg(r.error);
                return;
              }
              setRow(null);
              router.refresh();
            });
          }}
        >
          Remove connection
        </Button>
        {msg ? (
          <p className="text-xs text-red-600 dark:text-red-400">{msg}</p>
        ) : null}
      </div>
    );
  }

  if (row?.status === "pending") {
    if (row.requester_profile_id === myProfileId) {
      return (
        <p className="text-xs text-stone-600 dark:text-stone-400">
          Connection request sent ({CONNECTION_TYPE_LABELS[row.connection_type]}
          ).
        </p>
      );
    }
    return (
      <p className="text-xs text-amber-800 dark:text-amber-200">
        This person sent you a request — open{" "}
        <Link
          href="/dashboard/network"
          className="font-medium underline underline-offset-2"
        >
          Alumni web
        </Link>{" "}
        to respond.
      </p>
    );
  }

  if (row?.status === "declined" || row?.status === "removed") {
    /* allow new request */
  }

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      <div
        className={
          compact
            ? "flex flex-col gap-1.5"
            : ""
        }
      >
        <label
          className={
            compact
              ? "sr-only"
              : "block text-xs font-medium text-stone-600 dark:text-stone-400"
          }
        >
          I know this person as
        </label>
        <select
          value={connType}
          onChange={(e) => setConnType(e.target.value)}
          aria-label="How you know them"
          className={
            compact
              ? "w-full rounded-full border border-stone-200 bg-stone-50 px-2 py-1.5 text-[11px] dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
              : "mt-1 w-full rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
          }
        >
          {CONNECTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {CONNECTION_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>
      <Button
        type="button"
        size="sm"
        disabled={pending}
            className={
              compact
                ? "social-pill-btn min-h-10 w-full whitespace-normal rounded-full bg-stone-100 px-3 py-2 text-center text-[11px] font-medium leading-tight text-stone-800 hover:bg-stone-200 sm:text-xs dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700"
                : undefined
            }
        onClick={() => {
          setMsg(null);
          startTransition(async () => {
            const fd = new FormData();
            fd.append("school_id", schoolId);
            fd.append("requester_profile_id", myProfileId);
            fd.append("receiver_profile_id", peerProfileId);
            fd.append("connection_type", connType);
            const r = await sendConnectionRequest(fd);
            if (!r.ok) {
              setMsg(r.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        {pending ? "…" : "I know this person"}
      </Button>
      {!compact ? (
        <button
          type="button"
          className="block text-xs text-stone-500 underline underline-offset-2 hover:text-stone-800 dark:hover:text-stone-200"
          disabled={pending}
          onClick={() => {
            setMsg(null);
            startTransition(async () => {
              const fd = new FormData();
              fd.append("school_id", schoolId);
              fd.append("blocker_profile_id", myProfileId);
              fd.append("blocked_profile_id", peerProfileId);
              const r = await blockAlumniFromConnections(fd);
              if (!r.ok) {
                setMsg(r.error);
                return;
              }
              router.refresh();
            });
          }}
        >
          Block connection requests from this person
        </button>
      ) : null}
      {msg ? (
        <p className="text-xs text-amber-700 dark:text-amber-300">{msg}</p>
      ) : null}
    </div>
  );
}
