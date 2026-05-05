"use client";

import { useState } from "react";
import type { ClassmateRow } from "@/features/classmate-discovery/lib/types";
import type { MemoryTagRow } from "@/features/memory-tagging/lib/types";
import { MemoryLightbox } from "@/features/memory-wall/components/memory-lightbox";
import { MemoryMasonryGrid } from "@/features/memory-wall/components/memory-masonry-grid";
import type { MemoryWithRelations } from "@/features/memory-wall/lib/types";

export type PublicMemoriesEngagement = {
  currentUserId: string;
  schoolId: string;
  classmates: ClassmateRow[];
  tagsByMemory: Record<string, MemoryTagRow[]>;
};

type Props = {
  memories: MemoryWithRelations[];
  engagement?: PublicMemoriesEngagement | null;
};

export function PublicMemoriesView({ memories, engagement }: Props) {
  const [selected, setSelected] = useState<MemoryWithRelations | null>(null);

  const engagementForSelected =
    selected && engagement && selected.school_id === engagement.schoolId
      ? {
          currentUserId: engagement.currentUserId,
          schoolId: engagement.schoolId,
          classmates: engagement.classmates,
          tags: engagement.tagsByMemory[selected.id] ?? [],
        }
      : null;

  return (
    <>
      <MemoryMasonryGrid
        memories={memories}
        interactive
        onSelect={setSelected}
      />
      <MemoryLightbox
        memory={selected}
        onClose={() => setSelected(null)}
        engagement={engagementForSelected}
      />
    </>
  );
}
