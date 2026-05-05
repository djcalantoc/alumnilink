import { z } from "zod";

export const batchFormSchema = z.object({
  school_id: z.string().uuid(),
  name: z.string().trim().min(1, "Name is required").max(200),
  graduation_year: z
    .string()
    .trim()
    .optional()
    .transform((s) => {
      if (s === undefined || s === "") {
        return null;
      }
      const n = Number(s);
      return Number.isFinite(n) ? n : NaN;
    })
    .refine(
      (n) => n === null || (Number.isInteger(n) && n >= 1900 && n <= 2100),
      { message: "Year must be a whole number between 1900 and 2100" },
    ),
});

export const sectionFormSchema = z.object({
  school_id: z.string().uuid(),
  batch_id: z.string().uuid(),
  name: z.string().trim().min(1, "Name is required").max(200),
});

export type BatchFormValues = z.infer<typeof batchFormSchema>;
export type SectionFormValues = z.infer<typeof sectionFormSchema>;
