import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/cn";

const FEATURE_CHIPS = [
  { icon: "👥", label: "Find classmates" },
  { icon: "📸", label: "Share memories" },
  { icon: "🎉", label: "Join reunions" },
] as const;

interface AuthBrandPanelProps {
  className?: string;
}

export function AuthBrandPanel({ className }: AuthBrandPanelProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col justify-center overflow-hidden bg-gradient-to-br from-violet-700 via-fuchsia-600 to-pink-500 px-10 py-16",
        className,
      )}
    >
      {/* Depth layers */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_30%,rgba(255,255,255,0.22),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-violet-950/20"
        aria-hidden
      />
      {/* Blur orbs */}
      <div
        className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-pink-400/20 blur-3xl"
        aria-hidden
      />

      {/* Floating decorative emojis */}
      <span
        className="landing-float pointer-events-none absolute right-12 top-16 text-3xl opacity-90 drop-shadow-lg"
        aria-hidden
      >
        ✨
      </span>
      <span
        className="landing-float landing-float-delay-sm pointer-events-none absolute left-8 top-28 text-2xl opacity-85"
        aria-hidden
      >
        💕
      </span>
      <span
        className="landing-float landing-float-delay-md pointer-events-none absolute bottom-36 left-14 text-2xl opacity-80"
        aria-hidden
      >
        ❤️
      </span>
      <span
        className="landing-float landing-float-delay-lg pointer-events-none absolute bottom-52 right-14 text-xl opacity-75"
        aria-hidden
      >
        ✨
      </span>
      <span
        className="landing-float pointer-events-none absolute bottom-20 right-8 text-2xl opacity-80"
        aria-hidden
      >
        💫
      </span>
      <span
        className="landing-float landing-float-delay-md pointer-events-none absolute left-1/2 top-16 -translate-x-1/2 text-lg opacity-70"
        aria-hidden
      >
        🎓
      </span>

      {/* Content */}
      <div className="relative z-10">
        {/* Logo */}
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            AlumniLink
          </span>
        </div>

        {/* Headline */}
        <h2 className="text-balance text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
          Welcome back to your
          <br />
          <span className="bg-gradient-to-r from-amber-100 via-white to-pink-100 bg-clip-text text-transparent">
            school memories.
          </span>
        </h2>

        {/* Subtitle */}
        <p className="mt-4 max-w-xs text-pretty text-base leading-relaxed text-white/85">
          Find classmates, relive photos, and grow your alumni web.
        </p>

        {/* Feature chips */}
        <div className="mt-8 flex flex-wrap gap-2">
          {FEATURE_CHIPS.map((chip) => (
            <span
              key={chip.label}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-medium text-white backdrop-blur-sm ring-1 ring-white/20"
            >
              <span aria-hidden>{chip.icon}</span>
              {chip.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
