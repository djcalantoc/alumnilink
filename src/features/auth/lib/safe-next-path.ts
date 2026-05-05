/**
 * Avoid open redirects: only allow same-origin relative paths.
 */
export function getSafeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return null;
  }
  return next;
}
