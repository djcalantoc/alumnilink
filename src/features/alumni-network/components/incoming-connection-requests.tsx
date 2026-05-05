"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { respondConnectionRequest } from "@/features/alumni-network/actions/connection-actions";
import type { AlumniConnectionRow } from "@/features/alumni-network/lib/types";
import { CONNECTION_TYPE_LABELS } from "@/features/alumni-network/lib/constants";
import type { NetworkProfileNode } from "@/features/alumni-network/lib/types";
import { Button } from "@/components/ui/button";

type Props = {
  rows: AlumniConnectionRow[];
  requesterProfiles: Record<string, NetworkProfileNode>;
};

export function IncomingConnectionRequests({
  rows,
  requesterProfiles,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
          Pending invitations
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          When someone says they know you, their request lands here.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
        Pending invitations
      </h2>
      {msg ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {msg}
        </p>
      ) : null}
      <ul className="space-y-3">
        {rows.map((r) => {
          const req = requesterProfiles[r.requester_profile_id];
          const name = req?.display_name?.trim() ?? "Alumni";
          return (
            <li
              key={r.id}
              className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950"
            >
              <p className="font-medium text-stone-900 dark:text-stone-50">
                {name}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Says: {CONNECTION_TYPE_LABELS[r.connection_type]}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={pending}
                  onClick={() => {
                    setMsg(null);
                    startTransition(async () => {
                      const fd = new FormData();
                      fd.append("connection_id", r.id);
                      fd.append("decision", "accepted");
                      const res = await respondConnectionRequest(fd);
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
                      fd.append("connection_id", r.id);
                      fd.append("decision", "declined");
                      const res = await respondConnectionRequest(fd);
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
          );
        })}
      </ul>
    </section>
  );
}
