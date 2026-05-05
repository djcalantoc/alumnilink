/**
 * Shared domain types for AlumniLink.
 * Feature-specific types should live under `src/features/<feature>/`.
 */

export type SiteConfig = {
  name: string;
  tagline: string;
};

export type { AppRole, AuthLandingPath } from "@/features/auth/lib/auth-helpers";
