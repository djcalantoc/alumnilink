"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setEventResponse } from "@/features/event-board/actions/event-actions";
import type { EventResponseValue } from "@/features/event-board/lib/types";
import { cn } from "@/lib/cn";

type Props = {
  eventId: string;
  disabled?: boolean;
  myResponse: EventResponseValue | null;
  /** Softer alumni layout: emphasize Going / Interested */
  variant?: "default" | "social";
};

const choices: { value: EventResponseValue; label: string }[] = [
  { value: "going", label: "Going" },
  { value: "maybe", label: "Interested" },
  { value: "not_going", label: "Not going" },
];

export function EventResponseBar({
  eventId,
  disabled = false,
  myResponse,
  variant = "default",
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function submit(response: EventResponseValue) {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("event_id", eventId);
      fd.append("response", response);
      await setEventResponse(fd);
      router.refresh();
    });
  }

  if (variant === "social") {
    const primary = choices.filter((c) => c.value !== "not_going");
    return (
      <div className="mt-2 space-y-3">
        <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
          RSVP
        </p>
        <div className="flex flex-wrap gap-2">
          {primary.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              disabled={disabled || pending}
              onClick={() => submit(value)}
              className={cn(
                "social-pill-btn min-h-11 flex-1 rounded-full border px-4 py-2 text-sm font-semibold transition-colors sm:flex-none sm:min-w-[8.5rem]",
                myResponse === value
                  ? "social-gradient border-transparent text-white shadow-sm"
                  : "border-stone-200 bg-white text-stone-800 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={disabled || pending}
          onClick={() => submit("not_going")}
          className={cn(
            "text-xs font-medium text-stone-500 underline-offset-4 hover:text-stone-800 hover:underline disabled:opacity-50 dark:text-stone-400 dark:hover:text-stone-200",
            myResponse === "not_going" && "text-stone-900 dark:text-stone-100",
          )}
        >
          Not going
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3 border-t border-stone-100 pt-3 dark:border-stone-800">
      <p className="text-xs font-medium text-stone-600 dark:text-stone-400">
        Your response
      </p>
      <div className="flex flex-wrap gap-2">
        {choices.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            disabled={disabled || pending}
            onClick={() => submit(value)}
            className={cn(
              "min-h-9 rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors",
              myResponse === value
                ? "border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900"
                : "border-stone-300 bg-white text-stone-800 hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
