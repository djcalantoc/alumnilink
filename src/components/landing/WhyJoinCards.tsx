import { cn } from "@/lib/cn";

const cards = [
  {
    icon: "👥",
    title: "Your people",
    description: "Hallway energy — not LinkedIn energy.",
    gradient:
      "from-violet-200/95 via-rose-50/90 to-fuchsia-100/85 ring-violet-200/60",
  },
  {
    icon: "📸",
    title: "Memory wall",
    description: "Prom pics & lunch-table lore, blown up big.",
    gradient:
      "from-amber-100/95 via-orange-50/90 to-rose-100/85 ring-amber-200/50",
  },
  {
    icon: "🎉",
    title: "Reunions",
    description: "RSVP when the bell rings — see who’s really coming.",
    gradient:
      "from-sky-100/95 via-indigo-50/85 to-violet-100/85 ring-sky-200/55",
  },
  {
    icon: "🕸️",
    title: "Alumni web",
    description: "Soft “we know each other” threads — no doomscroll.",
    gradient:
      "from-emerald-100/95 via-teal-50/88 to-cyan-100/80 ring-emerald-200/50",
  },
];

type Props = {
  className?: string;
};

export function WhyJoinCards({ className }: Props) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6",
        className,
      )}
    >
      {cards.map((c) => (
        <div
          key={c.title}
          className={cn(
            "rounded-2xl bg-gradient-to-br p-7 shadow-lg ring-1",
            "transition duration-300 hover:-translate-y-1.5 hover:shadow-xl motion-reduce:transition-none",
            c.gradient,
          )}
        >
          <span className="text-4xl leading-none" aria-hidden>
            {c.icon}
          </span>
          <h3 className="mt-5 text-xl font-bold text-stone-900">{c.title}</h3>
          <p className="mt-2 text-sm font-medium leading-snug text-stone-700/95">
            {c.description}
          </p>
        </div>
      ))}
    </div>
  );
}
