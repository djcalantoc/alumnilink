"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthUser } from "@/features/auth/lib/auth-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function sendReconnectRequest(formData: FormData): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const schoolId = String(formData.get("school_id") ?? "");
  const toUserId = String(formData.get("to_user_id") ?? "");
  if (!z.string().uuid().safeParse(schoolId).success) {
    return { ok: false, error: "Invalid school." };
  }
  if (!z.string().uuid().safeParse(toUserId).success) {
    return { ok: false, error: "Invalid user." };
  }

  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }
  if (toUserId === user.id) {
    return { ok: false, error: "Invalid request." };
  }

  const { error } = await supabase.from("reconnect_requests").insert({
    school_id: schoolId,
    from_user_id: user.id,
    to_user_id: toUserId,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "A pending request already exists between you two.",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/school");
  revalidatePath("/dashboard/batchmates");
  revalidatePath("/dashboard/classmates");
  revalidatePath("/dashboard/notifications");
  return { ok: true };
}

export async function respondReconnectRequest(formData: FormData): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const requestId = String(formData.get("request_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!z.string().uuid().safeParse(requestId).success) {
    return { ok: false, error: "Invalid request." };
  }
  if (!z.enum(["accepted", "declined"]).safeParse(decision).success) {
    return { ok: false, error: "Invalid decision." };
  }

  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { data, error } = await supabase
    .from("reconnect_requests")
    .update({
      status: decision,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("to_user_id", user.id)
    .eq("status", "pending")
    .select("id");

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data?.length) {
    return { ok: false, error: "Request not found or already handled." };
  }

  revalidatePath("/dashboard/school");
  revalidatePath("/dashboard/batchmates");
  revalidatePath("/dashboard/classmates");
  revalidatePath("/dashboard/notifications");
  return { ok: true };
}
