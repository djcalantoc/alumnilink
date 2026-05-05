import { NextResponse } from "next/server";
import { getSafeNextPath } from "@/features/auth/lib/safe-next-path";
import { resolveAuthLandingPath } from "@/features/auth/lib/resolve-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const next = getSafeNextPath(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=auth", origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?error=auth", origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login?error=auth", origin));
  }

  if (type === "recovery") {
    return NextResponse.redirect(new URL("/update-password", origin));
  }

  if (next) {
    return NextResponse.redirect(new URL(next, origin));
  }

  const landing = await resolveAuthLandingPath(supabase, user);
  return NextResponse.redirect(new URL(landing, origin));
}
