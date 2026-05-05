import { z } from "zod";

const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{6})$/, "Use a hex color like #1c1917");

export const schoolTypes = [
  "university",
  "high_school",
  "k12",
  "vocational",
  "other",
] as const;

export const schoolVisibilities = ["public", "unlisted", "private"] as const;

export const schoolStatuses = [
  "pending_setup",
  "active",
  "inactive",
] as const;

export const schoolFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  short_name: z
    .string()
    .trim()
    .max(80)
    .transform((v) => (v === "" ? null : v)),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .max(80)
    .regex(
      /^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/,
      "Letters, numbers, and single hyphens only",
    )
    .transform((s) => s.toLowerCase()),
  school_type: z.enum(schoolTypes),
  address: z
    .string()
    .trim()
    .max(500)
    .transform((v) => (v === "" ? null : v)),
  city: z
    .string()
    .trim()
    .max(120)
    .transform((v) => (v === "" ? null : v)),
  primary_color: hexColor,
  secondary_color: hexColor,
  visibility: z.enum(schoolVisibilities),
  status: z.enum(schoolStatuses),
});

export type SchoolFormValues = z.infer<typeof schoolFormSchema>;
export type SchoolFormInput = z.input<typeof schoolFormSchema>;
