import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PollOptionRow, PollRow } from "@/features/polls/lib/types";

export async function fetchPollsForSchool(
  supabase: SupabaseClient,
  schoolId: string,
): Promise<{ rows: PollRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });
  if (error) {
    return { rows: [], error: error.message };
  }
  return { rows: (data ?? []) as PollRow[], error: null };
}

export async function fetchPollDetail(
  supabase: SupabaseClient,
  pollId: string,
): Promise<{
  poll: PollRow | null;
  options: PollOptionRow[];
  error: string | null;
}> {
  const { data: poll, error: pErr } = await supabase
    .from("polls")
    .select("*")
    .eq("id", pollId)
    .maybeSingle();

  if (pErr) {
    return { poll: null, options: [], error: pErr.message };
  }
  if (!poll) {
    return { poll: null, options: [], error: "Not found." };
  }

  const { data: options, error: oErr } = await supabase
    .from("poll_options")
    .select("*")
    .eq("poll_id", pollId)
    .order("sort_order", { ascending: true });

  if (oErr) {
    return { poll: poll as PollRow, options: [], error: oErr.message };
  }
  return {
    poll: poll as PollRow,
    options: (options ?? []) as PollOptionRow[],
    error: null,
  };
}

export async function fetchMyVote(
  supabase: SupabaseClient,
  pollId: string,
  userId: string,
): Promise<{ optionId: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from("poll_votes")
    .select("option_id")
    .eq("poll_id", pollId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { optionId: null, error: error.message };
  }
  return { optionId: data?.option_id ?? null, error: null };
}

export async function fetchVoteCounts(
  supabase: SupabaseClient,
  pollId: string,
): Promise<{ counts: Record<string, number>; error: string | null }> {
  const { data, error } = await supabase
    .from("poll_votes")
    .select("option_id")
    .eq("poll_id", pollId);

  if (error) {
    return { counts: {}, error: error.message };
  }
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.option_id] = (counts[row.option_id] ?? 0) + 1;
  }
  return { counts, error: null };
}

export async function fetchPollOptionsForPollIds(
  supabase: SupabaseClient,
  pollIds: string[],
): Promise<{ byPoll: Record<string, PollOptionRow[]>; error: string | null }> {
  if (pollIds.length === 0) {
    return { byPoll: {}, error: null };
  }
  const { data, error } = await supabase
    .from("poll_options")
    .select("*")
    .in("poll_id", pollIds)
    .order("sort_order", { ascending: true });

  if (error) {
    return { byPoll: {}, error: error.message };
  }
  const byPoll: Record<string, PollOptionRow[]> = {};
  for (const row of (data ?? []) as PollOptionRow[]) {
    if (!byPoll[row.poll_id]) {
      byPoll[row.poll_id] = [];
    }
    byPoll[row.poll_id].push(row);
  }
  for (const id of pollIds) {
    if (!byPoll[id]) {
      byPoll[id] = [];
    } else {
      byPoll[id].sort((a, b) => a.sort_order - b.sort_order);
    }
  }
  return { byPoll, error: null };
}

export async function fetchMyVotesForPollIds(
  supabase: SupabaseClient,
  pollIds: string[],
  userId: string,
): Promise<{ byPoll: Record<string, string>; error: string | null }> {
  if (pollIds.length === 0) {
    return { byPoll: {}, error: null };
  }
  const { data, error } = await supabase
    .from("poll_votes")
    .select("poll_id, option_id")
    .eq("user_id", userId)
    .in("poll_id", pollIds);

  if (error) {
    return { byPoll: {}, error: error.message };
  }
  const byPoll: Record<string, string> = {};
  for (const row of data ?? []) {
    byPoll[row.poll_id] = row.option_id;
  }
  return { byPoll, error: null };
}

/**
 * Vote rows visible under RLS (full tally only after the current user has voted on that poll).
 */
export async function fetchVisibleVoteRowsForPollIds(
  supabase: SupabaseClient,
  pollIds: string[],
): Promise<
  { rows: { poll_id: string; option_id: string }[]; error: string | null }
> {
  if (pollIds.length === 0) {
    return { rows: [], error: null };
  }
  const { data, error } = await supabase
    .from("poll_votes")
    .select("poll_id, option_id")
    .in("poll_id", pollIds);

  if (error) {
    return { rows: [], error: error.message };
  }
  return { rows: data ?? [], error: null };
}
