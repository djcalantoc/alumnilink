"use server";

import { revalidatePath } from "next/cache";
import { createEventSchema, eventResponseSchema } from "@/features/event-board/lib/schema";
import { getAuthUser } from "@/features/auth/lib/auth-helpers";
import { assertCanManageEvents } from "@/features/school-batch-sections/lib/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type EventActionResult = { ok: true } | { ok: false; error: string };

export async function createSchoolEvent(
  formData: FormData,
): Promise<EventActionResult> {
  const raw = Object.fromEntries(formData.entries()) as Record<string, string>;
  const parsed = createEventSchema.safeParse({
    school_id: raw.school_id,
    title: raw.title,
    description: raw.description ?? "",
    location: raw.location ?? "",
    starts_at: raw.starts_at,
    ends_at: raw.ends_at ?? "",
    status: raw.status === "draft" ? "draft" : "published",
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const v = parsed.data;
  const startMs = Date.parse(v.starts_at);
  if (Number.isNaN(startMs)) {
    return { ok: false, error: "Invalid start date." };
  }
  let endsAtIso: string | null = null;
  if (v.ends_at) {
    const endMs = Date.parse(v.ends_at);
    if (Number.isNaN(endMs)) {
      return { ok: false, error: "Invalid end date." };
    }
    if (endMs < startMs) {
      return { ok: false, error: "End time must be after start time." };
    }
    endsAtIso = new Date(endMs).toISOString();
  }

  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const gate = await assertCanManageEvents(supabase, user, v.school_id);
  if (!gate.ok) {
    return { ok: false, error: gate.message };
  }

  const { error } = await supabase.from("events").insert({
    school_id: v.school_id,
    title: v.title,
    description: v.description,
    location: v.location,
    starts_at: new Date(startMs).toISOString(),
    ends_at: endsAtIso,
    status: v.status,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/school-admin/events");
  revalidatePath("/dashboard/events");
  return { ok: true };
}

export async function setEventResponse(
  formData: FormData,
): Promise<EventActionResult> {
  const parsed = eventResponseSchema.safeParse({
    event_id: formData.get("event_id"),
    response: formData.get("response"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Invalid request." };
  }

  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const { error } = await supabase.from("event_responses").upsert(
    {
      event_id: parsed.data.event_id,
      user_id: user.id,
      response: parsed.data.response,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "event_id,user_id" },
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/events");
  return { ok: true };
}

export async function updateEventStatus(
  formData: FormData,
): Promise<EventActionResult> {
  const eventId = formData.get("event_id");
  const schoolId = formData.get("school_id");
  const status = formData.get("status");

  if (
    typeof eventId !== "string" ||
    typeof schoolId !== "string" ||
    typeof status !== "string"
  ) {
    return { ok: false, error: "Invalid request." };
  }

  if (!["published", "draft", "cancelled"].includes(status)) {
    return { ok: false, error: "Invalid status." };
  }

  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const gate = await assertCanManageEvents(supabase, user, schoolId);
  if (!gate.ok) {
    return { ok: false, error: gate.message };
  }

  const { error } = await supabase
    .from("events")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .eq("school_id", schoolId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/school-admin/events");
  revalidatePath("/dashboard/events");
  return { ok: true };
}
