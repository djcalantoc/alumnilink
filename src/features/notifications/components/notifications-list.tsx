"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/features/notifications/actions/notification-actions";
import type { NotificationRow } from "@/features/notifications/lib/types";
import { Button } from "@/components/ui/button";

type Props = {
  notifications: NotificationRow[];
};

export function NotificationsList({ notifications }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (notifications.length === 0) {
    return (
      <div
        className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 px-6 py-12 text-center dark:border-stone-600 dark:bg-stone-900/40"
        role="status"
      >
        <p className="text-sm text-stone-600 dark:text-stone-400">
          No notifications yet. Tags, hellos, and reconnect updates will show up
          here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              await markAllNotificationsRead();
              router.refresh();
            });
          }}
        >
          Mark all read
        </Button>
      </div>
      <ul className="space-y-2">
        {notifications.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (!n.read_at) {
                  startTransition(async () => {
                    await markNotificationRead(n.id);
                    router.refresh();
                  });
                }
              }}
              className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
                n.read_at
                  ? "border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950"
                  : "border-teal-200 bg-teal-50/50 dark:border-teal-900 dark:bg-teal-950/30"
              }`}
            >
              <p className="font-medium text-stone-900 dark:text-stone-50">
                {n.title}
              </p>
              {n.body ? (
                <p className="mt-1 text-stone-600 dark:text-stone-400">
                  {n.body}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-stone-500 dark:text-stone-500">
                {new Date(n.created_at).toLocaleString()}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
