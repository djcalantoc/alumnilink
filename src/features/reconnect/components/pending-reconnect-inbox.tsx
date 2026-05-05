"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { respondReconnectRequest } from "@/features/reconnect/actions/reconnect-actions";
import { Button } from "@/components/ui/button";

type Row = { id: string; from_user_id: string; label: string };

type Props = {
  items: Row[];
};

export function PendingReconnectInbox({ items }: Props) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 rounded-2xl border border-teal-200 bg-teal-50/60 px-4 py-4 dark:border-teal-900 dark:bg-teal-950/30">
      <p className="text-sm font-medium text-teal-950 dark:text-teal-100">
        Reconnect requests
      </p>
      {msg ? (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{msg}</p>
      ) : null}
      <ul className="mt-3 space-y-3">
        {items.map((r) => (
          <li
            key={r.id}
            className="flex flex-col gap-2 rounded-xl border border-teal-100 bg-white/80 p-3 dark:border-teal-900 dark:bg-stone-950 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-sm text-stone-800 dark:text-stone-200">
              <span className="font-medium">{r.label}</span> wants to reconnect
              and share contact details.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                disabled={pending}
                onClick={() => {
                  setMsg(null);
                  startTransition(async () => {
                    const fd = new FormData();
                    fd.append("request_id", r.id);
                    fd.append("decision", "accepted");
                    const res = await respondReconnectRequest(fd);
                    if (!res.ok) {
                      setMsg(res.error);
                      return;
                    }
                    router.refresh();
                  });
                }}
              >
                Accept
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={pending}
                onClick={() => {
                  setMsg(null);
                  startTransition(async () => {
                    const fd = new FormData();
                    fd.append("request_id", r.id);
                    fd.append("decision", "declined");
                    const res = await respondReconnectRequest(fd);
                    if (!res.ok) {
                      setMsg(res.error);
                      return;
                    }
                    router.refresh();
                  });
                }}
              >
                Decline
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
