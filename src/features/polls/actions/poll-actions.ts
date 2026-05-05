"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthUser } from "@/features/auth/lib/auth-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const pollTypes = z.enum(["nostalgic", "event", "batch"]);

export async function createSchoolPoll(formData: FormData): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const schoolId = String(formData.get("school_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const pollType = String(formData.get("poll_type") ?? "");
  const batchId = String(formData.get("batch_id") ?? "").trim();
  const sectionId = String(formData.get("section_id") ?? "").trim();
  const optionsRaw = String(formData.get("options") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!z.string().uuid().safeParse(schoolId).success) {
    return { ok: false, error: "Invalid school." };
  }
  if (title.length < 2) {
    return { ok: false, error: "Title is required." };
  }
  const pt = pollTypes.safeParse(pollType);
  if (!pt.success) {
    return { ok: false, error: "Invalid poll type." };
  }
  if (optionsRaw.length < 2) {
    return { ok: false, error: "Add at least two options (one per line)." };
  }

  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { data: poll, error: pErr } = await supabase
    .from("polls")
    .insert({
      school_id: schoolId,
      created_by_user_id: user.id,
      poll_type: pt.data,
      title,
      description: description || null,
      batch_id: batchId && z.string().uuid().safeParse(batchId).success ? batchId : null,
      section_id:
        sectionId && z.string().uuid().safeParse(sectionId).success
          ? sectionId
          : null,
      status: "open",
    })
    .select("id")
    .single();

  if (pErr || !poll) {
    return { ok: false, error: pErr?.message ?? "Could not create poll." };
  }

  const optionRows = optionsRaw.map((label, i) => ({
    poll_id: poll.id,
    label,
    sort_order: i,
  }));

  const { error: oErr } = await supabase.from("poll_options").insert(optionRows);
  if (oErr) {
    return { ok: false, error: oErr.message };
  }

  revalidatePath("/school-admin/polls");
  revalidatePath("/dashboard/polls");
  return { ok: true };
}

export async function voteOnPoll(formData: FormData): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const pollId = String(formData.get("poll_id") ?? "");
  const optionId = String(formData.get("option_id") ?? "");
  if (!z.string().uuid().safeParse(pollId).success) {
    return { ok: false, error: "Invalid poll." };
  }
  if (!z.string().uuid().safeParse(optionId).success) {
    return { ok: false, error: "Invalid option." };
  }

  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { data: poll } = await supabase
    .from("polls")
    .select("id, school_id, status")
    .eq("id", pollId)
    .maybeSingle();

  if (!poll || poll.status !== "open") {
    return { ok: false, error: "Poll is not open." };
  }

  const { data: opt } = await supabase
    .from("poll_options")
    .select("id")
    .eq("id", optionId)
    .eq("poll_id", pollId)
    .maybeSingle();
  if (!opt) {
    return { ok: false, error: "Invalid option." };
  }

  const { error } = await supabase.from("poll_votes").insert({
    poll_id: pollId,
    option_id: optionId,
    user_id: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "You already voted on this poll." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/polls");
  return { ok: true };
}

export async function closeSchoolPoll(formData: FormData): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const pollId = String(formData.get("poll_id") ?? "");
  const schoolId = String(formData.get("school_id") ?? "");
  if (!z.string().uuid().safeParse(pollId).success) {
    return { ok: false, error: "Invalid poll." };
  }
  if (!z.string().uuid().safeParse(schoolId).success) {
    return { ok: false, error: "Invalid school." };
  }

  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { error } = await supabase
    .from("polls")
    .update({ status: "closed", updated_at: new Date().toISOString() })
    .eq("id", pollId)
    .eq("school_id", schoolId);

  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/school-admin/polls");
  revalidatePath("/dashboard/polls");
  return { ok: true };
}
