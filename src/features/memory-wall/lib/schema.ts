import { z } from "zod";

export const createMemorySchema = z.object({
  school_id: z.string().uuid(),
  batch_id: z
    .union([z.literal(""), z.string().uuid()])
    .optional()
    .transform((s) => (s === undefined || s === "" ? null : s)),
  section_id: z
    .union([z.literal(""), z.string().uuid()])
    .optional()
    .transform((s) => (s === undefined || s === "" ? null : s)),
  caption: z.string().trim().min(1, "Caption is required").max(2000),
});

export type CreateMemoryInput = z.input<typeof createMemorySchema>;
export type CreateMemoryValues = z.infer<typeof createMemorySchema>;
