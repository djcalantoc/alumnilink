const AUTH_ROUTE_PREFIXES = ["/login", "/register", "/forgot-password"] as const;

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/admin",
  "/school-admin",
  "/owner",
] as const;

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function matchesPathPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}
