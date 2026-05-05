export function formatEventWhen(
  startsAt: string,
  endsAt: string | null,
): { primary: string; secondary: string | null } {
  try {
    const start = new Date(startsAt);
    const df = new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const tf = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    const primary = `${df.format(start)} · ${tf.format(start)}`;
    if (!endsAt) {
      return { primary, secondary: null };
    }
    const end = new Date(endsAt);
    const secondary = `Until ${tf.format(end)}`;
    return { primary, secondary };
  } catch {
    return { primary: startsAt, secondary: endsAt };
  }
}
