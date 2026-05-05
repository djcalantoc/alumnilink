"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { sendReconnectRequest } from "@/features/reconnect/actions/reconnect-actions";
import { sendSayHi } from "@/features/say-hi/actions/say-hi-actions";
import { Button } from "@/components/ui/button";

type Props = {
  schoolId: string;
  peerUserId: string;
};

export function ClassmateSayHiButton({ schoolId, peerUserId }: Props) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="social-pill-btn rounded-full border-0 bg-[var(--accent-soft)] text-[var(--accent-from)] hover:brightness-95 dark:text-[var(--accent-to)]"
        disabled={pending}
        onClick={() => {
          setMsg(null);
          startTransition(async () => {
            const fd = new FormData();
            fd.append("school_id", schoolId);
            fd.append("to_user_id", peerUserId);
            const r = await sendSayHi(fd);
            if (!r.ok) {
              setMsg(r.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        {pending ? "…" : "Say Hi 👋"}
      </Button>
      {msg ? (
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{msg}</p>
      ) : null}
    </div>
  );
}

export function ClassmateReconnectButton({ schoolId, peerUserId }: Props) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <Button
        type="button"
        size="sm"
        className="social-pill-btn rounded-full social-gradient text-white shadow-sm hover:opacity-95"
        disabled={pending}
        onClick={() => {
          setMsg(null);
          startTransition(async () => {
            const fd = new FormData();
            fd.append("school_id", schoolId);
            fd.append("to_user_id", peerUserId);
            const r = await sendReconnectRequest(fd);
            if (!r.ok) {
              setMsg(r.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        {pending ? "…" : "Reconnect"}
      </Button>
      {msg ? (
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{msg}</p>
      ) : null}
    </div>
  );
}
