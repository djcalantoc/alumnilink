import "server-only";

import { redirect } from "next/navigation";
import { getAuthUser } from "@/features/auth/lib/auth-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ClassmateSchool } from "@/features/classmate-discovery/lib/types";

export type ClassmateSchoolContextResult =
  | {
      ok: true;
      schoolId: string;
      schools: ClassmateSchool[];
    }
  | {
      ok: true;
      pickSchool: true;
      schools: ClassmateSchool[];
    }
  | { ok: false; error: string };

function dedupeSchools(
  rows: { school_id: string; schools: ClassmateSchool | null }[],
): ClassmateSchool[] {
  const map = new Map<string, ClassmateSchool>();
  for (const r of rows) {
    if (r.schools?.id) {
      map.set(r.schools.id, r.schools);
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function resolveClassmateSchoolContext(
  pathname: string,
  requestedSchoolId: string | undefined,
): Promise<ClassmateSchoolContextResult> {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) {
    return { ok: false, error: "Sign in to view classmates." };
  }

  const { data: profileRows, error } = await supabase
    .from("alumni_profiles")
    .select(
      `
      school_id,
      schools ( id, name, slug )
    `,
    )
    .eq("user_id", user.id)
    .eq("status", "approved");

  if (error) {
    return { ok: false, error: error.message };
  }

  const schools = dedupeSchools(
    (profileRows ?? []) as unknown as {
      school_id: string;
      schools: ClassmateSchool | null;
    }[],
  );

  if (schools.length === 0) {
    return {
      ok: false,
      error:
        "You need an approved alumni profile at a school before you can browse classmates.",
    };
  }

  if (
    requestedSchoolId &&
    schools.some((s) => s.id === requestedSchoolId)
  ) {
    return { ok: true, schoolId: requestedSchoolId, schools };
  }

  if (!requestedSchoolId && schools.length === 1) {
    redirect(`${pathname}?schoolId=${schools[0].id}`);
  }

  if (!requestedSchoolId && schools.length > 1) {
    return { ok: true, pickSchool: true, schools };
  }

  if (requestedSchoolId && !schools.some((s) => s.id === requestedSchoolId)) {
    return {
      ok: false,
      error: "That school is not available for your alumni memberships.",
    };
  }

  return { ok: false, error: "Choose a school to continue." };
}
