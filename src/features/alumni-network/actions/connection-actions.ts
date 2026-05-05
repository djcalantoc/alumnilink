"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CONNECTION_TYPES } from "@/features/alumni-network/lib/constants";
import { getAuthUser } from "@/features/auth/lib/auth-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const connectionTypeSchema = z.enum(CONNECTION_TYPES);

export async function sendConnectionRequest(formData: FormData): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const schoolId = String(formData.get("school_id") ?? "");
  const requesterProfileId = String(formData.get("requester_profile_id") ?? "");
  const receiverProfileId = String(formData.get("receiver_profile_id") ?? "");
  const connectionType = String(formData.get("connection_type") ?? "");

  if (!z.string().uuid().safeParse(schoolId).success) {
    return { ok: false, error: "Invalid school." };
  }
  if (!z.string().uuid().safeParse(requesterProfileId).success) {
    return { ok: false, error: "Invalid profile." };
  }
  if (!z.string().uuid().safeParse(receiverProfileId).success) {
    return { ok: false, error: "Invalid profile." };
  }
  const ct = connectionTypeSchema.safeParse(connectionType);
  if (!ct.success) {
    return { ok: false, error: "Invalid connection type." };
  }
  if (requesterProfileId === receiverProfileId) {
    return { ok: false, error: "Cannot connect to yourself." };
  }

  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { data: reqProf, error: rErr } = await supabase
    .from("alumni_profiles")
    .select("id, user_id")
    .eq("id", requesterProfileId)
    .eq("school_id", schoolId)
    .eq("status", "approved")
    .maybeSingle();
  if (rErr || !reqProf || reqProf.user_id !== user.id) {
    return { ok: false, error: "You cannot send from this profile." };
  }

  const { data: recvProf, error: vErr } = await supabase
    .from("alumni_profiles")
    .select("id")
    .eq("id", receiverProfileId)
    .eq("school_id", schoolId)
    .eq("status", "approved")
    .maybeSingle();
  if (vErr || !recvProf) {
    return { ok: false, error: "Alumni not found at this school." };
  }

  const { error } = await supabase.from("alumni_connections").insert({
    school_id: schoolId,
    requester_profile_id: requesterProfileId,
    receiver_profile_id: receiverProfileId,
    connection_type: ct.data,
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

  revalidatePath("/dashboard/network");
  revalidatePath("/dashboard/school");
  revalidatePath("/dashboard/batchmates");
  revalidatePath("/dashboard/classmates");
  revalidatePath("/dashboard/notifications");
  return { ok: true };
}

export async function respondConnectionRequest(formData: FormData): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const connectionId = String(formData.get("connection_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!z.string().uuid().safeParse(connectionId).success) {
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

  const patch: Record<string, string> = {
    status: decision,
    updated_at: new Date().toISOString(),
  };
  if (decision === "accepted") {
    patch.accepted_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("alumni_connections")
    .update(patch)
    .eq("id", connectionId)
    .eq("status", "pending")
    .select("id");

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data?.length) {
    return { ok: false, error: "Request not found or already handled." };
  }

  revalidatePath("/dashboard/network");
  revalidatePath("/dashboard/school");
  revalidatePath("/dashboard/batchmates");
  revalidatePath("/dashboard/classmates");
  revalidatePath("/dashboard/notifications");
  return { ok: true };
}

export async function removeConnection(formData: FormData): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const connectionId = String(formData.get("connection_id") ?? "");
  if (!z.string().uuid().safeParse(connectionId).success) {
    return { ok: false, error: "Invalid connection." };
  }

  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { data, error } = await supabase
    .from("alumni_connections")
    .update({
      status: "removed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", connectionId)
    .eq("status", "accepted")
    .select("id");

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data?.length) {
    return { ok: false, error: "Connection not found." };
  }

  revalidatePath("/dashboard/network");
  revalidatePath("/dashboard/school");
  revalidatePath("/dashboard/batchmates");
  revalidatePath("/dashboard/classmates");
  return { ok: true };
}

export async function blockAlumniFromConnections(formData: FormData): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const schoolId = String(formData.get("school_id") ?? "");
  const blockerProfileId = String(formData.get("blocker_profile_id") ?? "");
  const blockedProfileId = String(formData.get("blocked_profile_id") ?? "");
  if (
    !z.string().uuid().safeParse(schoolId).success ||
    !z.string().uuid().safeParse(blockerProfileId).success ||
    !z.string().uuid().safeParse(blockedProfileId).success
  ) {
    return { ok: false, error: "Invalid data." };
  }
  if (blockerProfileId === blockedProfileId) {
    return { ok: false, error: "Invalid block." };
  }

  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { data: self, error: sErr } = await supabase
    .from("alumni_profiles")
    .select("id")
    .eq("id", blockerProfileId)
    .eq("user_id", user.id)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (sErr || !self) {
    return { ok: false, error: "You cannot block from this profile." };
  }

  const { error } = await supabase.from("connection_blocks").insert({
    school_id: schoolId,
    blocker_profile_id: blockerProfileId,
    blocked_profile_id: blockedProfileId,
  });
  if (error) {
    if (error.code === "23505") {
      return { ok: true };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/network");
  revalidatePath("/dashboard/school");
  revalidatePath("/dashboard/batchmates");
  revalidatePath("/dashboard/classmates");
  return { ok: true };
}

export async function unblockAlumniFromConnections(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const schoolId = String(formData.get("school_id") ?? "");
  const blockerProfileId = String(formData.get("blocker_profile_id") ?? "");
  const blockedProfileId = String(formData.get("blocked_profile_id") ?? "");
  if (
    !z.string().uuid().safeParse(schoolId).success ||
    !z.string().uuid().safeParse(blockerProfileId).success ||
    !z.string().uuid().safeParse(blockedProfileId).success
  ) {
    return { ok: false, error: "Invalid data." };
  }

  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { data: self } = await supabase
    .from("alumni_profiles")
    .select("id")
    .eq("id", blockerProfileId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!self) {
    return { ok: false, error: "Not allowed." };
  }

  const { error } = await supabase
    .from("connection_blocks")
    .delete()
    .eq("school_id", schoolId)
    .eq("blocker_profile_id", blockerProfileId)
    .eq("blocked_profile_id", blockedProfileId);

  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/dashboard/network");
  return { ok: true };
}

export async function upsertNetworkPrivacy(formData: FormData): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const profileId = String(formData.get("alumni_profile_id") ?? "");
  if (!z.string().uuid().safeParse(profileId).success) {
    return { ok: false, error: "Invalid profile." };
  }

  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { data: prof } = await supabase
    .from("alumni_profiles")
    .select("id")
    .eq("id", profileId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!prof) {
    return { ok: false, error: "Not your profile." };
  }

  const showMap = String(formData.get("show_in_network_map")) === "true";
  const showMutual = String(formData.get("show_mutual_connections")) === "true";
  const allowReq = String(formData.get("allow_connection_requests")) === "true";

  const { error } = await supabase.from("network_privacy_settings").upsert(
    {
      alumni_profile_id: profileId,
      show_in_network_map: showMap,
      show_mutual_connections: showMutual,
      allow_connection_requests: allowReq,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "alumni_profile_id" },
  );

  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/dashboard/network");
  return { ok: true };
}
