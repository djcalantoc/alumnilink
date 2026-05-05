import { z } from "zod";

export const createEventSchema = z
  .object({
    school_id: z.string().uuid(),
    title: z.string().trim().min(1, "Title is required").max(200),
    description: z.string().trim().max(8000).optional(),
    location: z.string().trim().max(500).optional(),
    starts_at: z.string().min(1, "Start date and time required"),
    ends_at: z.string().trim().optional(),
    status: z.enum(["draft", "published"]),
  })
  .transform((d) => ({
    ...d,
    description:
      !d.description || d.description.trim() === ""
        ? null
        : d.description.trim(),
    location:
      !d.location || d.location.trim() === "" ? null : d.location.trim(),
    ends_at:
      !d.ends_at || d.ends_at.trim() === "" ? null : d.ends_at.trim(),
  }))
  .superRefine((d, ctx) => {
    const startMs = Date.parse(d.starts_at);
    if (Number.isNaN(startMs)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid start date.",
        path: ["starts_at"],
      });
      return;
    }
    if (!d.ends_at) {
      return;
    }
    const endMs = Date.parse(d.ends_at);
    if (Number.isNaN(endMs)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid end date.",
        path: ["ends_at"],
      });
      return;
    }
    if (endMs < startMs) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time must be after start time.",
        path: ["ends_at"],
      });
    }
  });

export type CreateEventValues = z.infer<typeof createEventSchema>;

export const eventResponseSchema = z.object({
  event_id: z.string().uuid(),
  response: z.enum(["going", "maybe", "not_going"]),
});
