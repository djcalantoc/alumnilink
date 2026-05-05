import "server-only";

import { redirect } from "next/navigation";
import { getAuthUser } from "@/features/auth/lib/auth-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { EventSchoolOption } from "@/features/event-board/lib/types";

export type EventSchoolContextResult =
  | { ok: true; schoolId: string; schools: EventSchoolOption[] }
  | { ok: true; pickSchool: true; schools: EventSchoolOption[] }
  | { ok: false; error: string };

function dedupeSchools(
  rows: { schools: EventSchoolOption | null }[],
): EventSchoolOption[] {
  const m = new Map<string, EventSchoolOption>();
  for (const r of rows) {
    if (r.schools?.id) {
      m.set(r.schools.id, r.schools);
    }
  }
  return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function resolveAlumniEventSchoolContext(
  pathname: string,
  requestedSchoolId: string | undefined,
): Promise<EventSchoolContextResult> {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) {
    return { ok: false, error: "Sign in to view events." };
  }

  const { data: profileRows, error } = await supabase
    .from("alumni_profiles")
    .select(
      `
      schools ( id, name, slug )
    `,
    )
    .eq("user_id", user.id)
    .eq("status", "approved");

  if (error) {
    return { ok: false, error: error.message };
  }

  const schools = dedupeSchools(
    (profileRows ?? []) as unknown as { schools: EventSchoolOption | null }[],
  );

  if (schools.length === 0) {
    return {
      ok: false,
      error:
        "You need an approved alumni profile at a school to see its event board.",
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
