"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { upsertNetworkPrivacy } from "@/features/alumni-network/actions/connection-actions";
import type { NetworkPrivacyRow } from "@/features/alumni-network/lib/types";
import { Button } from "@/components/ui/button";

type Props = {
  alumniProfileId: string;
  initial: NetworkPrivacyRow | null;
};

export function NetworkPrivacyForm({ alumniProfileId, initial }: Props) {
  const router = useRouter();
  const [showMap, setShowMap] = useState(initial?.show_in_network_map ?? true);
  const [showMutual, setShowMutual] = useState(
    initial?.show_mutual_connections ?? true,
  );
  const [allowReq, setAllowReq] = useState(
    initial?.allow_connection_requests ?? true,
  );
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950">
      <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
        Network privacy
      </h2>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          setMsg(null);
          const fd = new FormData();
          fd.append("alumni_profile_id", alumniProfileId);
          fd.append("show_in_network_map", showMap ? "true" : "false");
          fd.append("show_mutual_connections", showMutual ? "true" : "false");
          fd.append("allow_connection_requests", allowReq ? "true" : "false");
          startTransition(async () => {
            const r = await upsertNetworkPrivacy(fd);
            if (r.ok) {
              setMsg({ ok: true, text: "Saved." });
              router.refresh();
            } else {
              setMsg({ ok: false, text: r.error });
            }
          });
        }}
      >
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={showMap}
            onChange={(e) => setShowMap(e.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="font-medium text-stone-800 dark:text-stone-200">
              Show me on the network map
            </span>
            <span className="mt-0.5 block text-xs text-stone-500 dark:text-stone-400">
              If off, you won&apos;t appear as a node in others&apos; graphs
              (you can still use the feature).
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={showMutual}
            onChange={(e) => setShowMutual(e.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="font-medium text-stone-800 dark:text-stone-200">
              Show me in mutual-connection hints
            </span>
            <span className="mt-0.5 block text-xs text-stone-500 dark:text-stone-400">
              If off, others won&apos;t see you listed as someone you both know.
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={allowReq}
            onChange={(e) => setAllowReq(e.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="font-medium text-stone-800 dark:text-stone-200">
              Allow &quot;I know this person&quot; requests
            </span>
            <span className="mt-0.5 block text-xs text-stone-500 dark:text-stone-400">
              If off, alumni can&apos;t send you new connection requests.
            </span>
          </span>
        </label>
        {msg ? (
          <p
            className={
              msg.ok
                ? "text-sm text-emerald-700 dark:text-emerald-400"
                : "text-sm text-red-600 dark:text-red-400"
            }
            role="status"
          >
            {msg.text}
          </p>
        ) : null}
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save privacy"}
        </Button>
      </form>
    </section>
  );
}
