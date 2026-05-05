"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { setReaction } from "@/features/reactions/actions/reaction-actions";
import { REACTION_EMOJIS } from "@/features/reactions/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

type Props = {
  targetType: "memory" | "alumni_profile";
  targetId: string;
  schoolId: string;
};

export function ReactionBar({ targetType, targetId, schoolId }: Props) {
  const router = useRouter();
  const [mine, setMine] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [popEmoji, setPopEmoji] = useState<string | null>(null);
  const popTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (popTimer.current) {
        clearTimeout(popTimer.current);
      }
    };
  }, []);

  function triggerPop(emoji: string) {
    if (popTimer.current) {
      clearTimeout(popTimer.current);
    }
    setPopEmoji(emoji);
    popTimer.current = setTimeout(() => {
      setPopEmoji(null);
      popTimer.current = null;
    }, 380);
  }

  useEffect(() => {
    let cancelled = false;
    async function loadReactions() {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) {
        return;
      }
      const { data, error } = await supabase
        .from("reactions")
        .select("emoji, user_id")
        .eq("target_type", targetType)
        .eq("target_id", targetId);

      if (cancelled) {
        return;
      }
      if (error) {
        setErr(error.message);
        return;
      }
      const nextCounts: Record<string, number> = {};
      let myEmoji: string | null = null;
      for (const row of data ?? []) {
        nextCounts[row.emoji] = (nextCounts[row.emoji] ?? 0) + 1;
        if (row.user_id === user.id) {
          myEmoji = row.emoji;
        }
      }
      setCounts(nextCounts);
      setMine(myEmoji);
      setErr(null);
    }
    void loadReactions();
    return () => {
      cancelled = true;
    };
  }, [targetType, targetId]);

  async function pick(emoji: string) {
    setErr(null);
    const next = mine === emoji ? "clear" : emoji;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("target_type", targetType);
      fd.append("target_id", targetId);
      fd.append("school_id", schoolId);
      fd.append("emoji", next === "clear" ? "clear" : next);
      const r = await setReaction(fd);
      if (!r.ok) {
        setErr(r.error);
        return;
      }
      if (next !== "clear") {
        triggerPop(next);
      }
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("reactions")
          .select("emoji, user_id")
          .eq("target_type", targetType)
          .eq("target_id", targetId);
        if (!error && data) {
          const nextCounts: Record<string, number> = {};
          let myEmoji: string | null = null;
          for (const row of data) {
            nextCounts[row.emoji] = (nextCounts[row.emoji] ?? 0) + 1;
            if (row.user_id === user.id) {
              myEmoji = row.emoji;
            }
          }
          setCounts(nextCounts);
          setMine(myEmoji);
        }
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-3 border-t border-stone-100 pt-3 dark:border-stone-800">
      <p className="text-xs font-medium text-stone-600 dark:text-stone-400">
        Drop a feeling
      </p>
      {err ? (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{err}</p>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-1">
        {REACTION_EMOJIS.map((e) => {
          const c = counts[e] ?? 0;
          const active = mine === e;
          return (
            <button
              key={e}
              type="button"
              disabled={pending}
              onClick={() => pick(e)}
              className={cn(
                "inline-flex min-h-9 items-center gap-1 rounded-xl border px-2.5 text-sm transition-colors",
                popEmoji === e && "reaction-just-picked",
                active
                  ? "border-[var(--accent-from)]/50 bg-[var(--accent-soft)] dark:border-[var(--accent-from)]/40"
                  : "border-stone-200 bg-white hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-800",
              )}
            >
              <span aria-hidden>{e}</span>
              {c > 0 ? (
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  {c}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
