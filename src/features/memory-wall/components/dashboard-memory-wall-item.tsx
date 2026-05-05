"use client";

import type { ReactNode } from "react";
import { MemoryCard } from "@/components/social/MemoryCard";
import type { MemoryStatus } from "@/features/memory-wall/lib/types";
import type { MemoryWithRelations } from "@/features/memory-wall/lib/types";
import { ReactionBar } from "@/features/reactions/components/reaction-bar";

type Props = {
  memory: MemoryWithRelations;
  chips: string[];
  statusLine: string;
};

function reactionsForStatus(memory: MemoryWithRelations): ReactNode {
  if (memory.status === "approved") {
    return (
      <ReactionBar
        targetType="memory"
        targetId={memory.id}
        schoolId={memory.school_id}
      />
    );
  }
  const hint = statusHint(memory.status);
  return hint ? (
    <p className="text-xs text-stone-500 dark:text-stone-400">{hint}</p>
  ) : null;
}

function statusHint(status: MemoryStatus): string | null {
  switch (status) {
    case "pending":
      return "Reactions unlock after moderation.";
    case "rejected":
      return "This memory is not on the public wall.";
    case "hidden":
      return "Only you see this one for now.";
    default:
      return null;
  }
}

export function DashboardMemoryWallItem({ memory, chips, statusLine }: Props) {
  return (
    <MemoryCard
      variant="wall"
      caption={memory.body}
      mediaUrls={memory.media_urls}
      schoolName={memory.schools?.name ?? undefined}
      eyebrow={memory.title}
      chips={chips}
      statusLine={statusLine}
      reactions={reactionsForStatus(memory)}
    />
  );
}
