import type { PollRow } from "@/features/polls/lib/types";

export type AlumniPollContext = {
  batchId: string;
  sectionId: string | null;
};

/**
 * Polls may target a batch and/or section. Null means all alumni at the school.
 */
export function pollVisibleForAlumni(
  poll: Pick<PollRow, "batch_id" | "section_id">,
  ctx: AlumniPollContext,
): boolean {
  if (poll.batch_id && poll.batch_id !== ctx.batchId) {
    return false;
  }
  if (poll.section_id) {
    if (!ctx.sectionId || poll.section_id !== ctx.sectionId) {
      return false;
    }
  }
  return true;
}
