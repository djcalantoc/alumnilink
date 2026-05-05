import { z } from "zod";

const emptyToNull = (v: string | undefined) =>
  v === undefined || v.trim() === "" ? null : v.trim();

export const alumniProfileFormSchema = z.object({
  school_id: z.string().trim().uuid(),
  batch_id: z
    .string()
    .trim()
    .min(1, "Choose your batch")
    .uuid("Choose your batch"),
  section_id: z
    .string()
    .trim()
    .optional()
    .transform((s) => {
      const t = s?.trim() ?? "";
      return t === "" ? null : t;
    })
    .refine(
      (s) => s === null || z.string().uuid().safeParse(s).success,
      "Invalid section",
    ),
  display_name: z.string().trim().min(1, "Name is required").max(120),
  headline: z
    .string()
    .trim()
    .max(160)
    .optional()
    .transform((s) => emptyToNull(s)),
  location_city: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((s) => emptyToNull(s)),
  location_country: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((s) => emptyToNull(s)),
  social_url: z
    .string()
    .trim()
    .max(2048)
    .optional()
    .transform((s) => emptyToNull(s))
    .superRefine((val, ctx) => {
      if (val === null) {
        return;
      }
      if (!/^https?:\/\//i.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Use http:// or https://",
        });
        return;
      }
      if (!URL.canParse(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a valid URL",
        });
      }
    }),
  is_profile_public: z.boolean().optional().default(false),
});

export type AlumniProfileFormValues = z.infer<typeof alumniProfileFormSchema>;

export type AlumniProfileFormInput = z.input<typeof alumniProfileFormSchema>;
