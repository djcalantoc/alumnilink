import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import {
  isAuthRoute,
  isProtectedRoute,
  matchesPathPrefix,
} from "@/features/auth/lib/routes";
import {
  isPlatformOwner,
  isSuperAdmin,
  resolveAuthLandingPath,
  userHasApprovedSchoolAdmin,
} from "@/features/auth/lib/resolve-redirect";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { url, anonKey } = getSupabasePublicEnv();

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);

  // Only redirect on GET. POST to /login is used for Server Actions (e.g. ensurePublicUserProfile);
  // redirecting those requests breaks the action with "An unexpected response was received from the server."
  if (user && isAuthRoute(pathname) && request.method === "GET") {
    const landing = await resolveAuthLandingPath(supabase, user);
    return NextResponse.redirect(new URL(landing, request.url));
  }

  if (!user && isProtectedRoute(pathname)) {
    return NextResponse.redirect(loginUrl);
  }

  if (user) {
    const landing = await resolveAuthLandingPath(supabase, user);

    if (matchesPathPrefix(pathname, "/owner")) {
      if (!isPlatformOwner(user)) {
        return NextResponse.redirect(new URL(landing, request.url));
      }
    }

    if (matchesPathPrefix(pathname, "/admin")) {
      if (!isSuperAdmin(user)) {
        return NextResponse.redirect(new URL(landing, request.url));
      }
    }

    if (matchesPathPrefix(pathname, "/school-admin")) {
      const allowedSchoolAdmin =
        isSuperAdmin(user) ||
        (await userHasApprovedSchoolAdmin(supabase, user.id));
      if (!allowedSchoolAdmin) {
        return NextResponse.redirect(new URL(landing, request.url));
      }
    }
  }

  return supabaseResponse;
}
