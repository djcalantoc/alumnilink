import { GraduationCap, Heart, Image, Users } from "lucide-react";
import { cn } from "@/lib/cn";

const FEATURE_CHIPS = [
  { icon: Users, label: "Find classmates" },
  { icon: Image, label: "Share memories" },
  { icon: GraduationCap, label: "Join reunions" },
  { icon: Heart, label: "Grow your alumni web" },
] as const;

interface JoinBrandPanelProps {
  schoolName: string;
  className?: string;
}

export function JoinBrandPanel({ schoolName, className }: JoinBrandPanelProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col justify-center overflow-hidden bg-gradient-to-br from-violet-700 via-fuchsia-600 to-pink-500 px-10 py-16",
        className,
      )}
    >
      {/* Depth / glow layers */}
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
        className="landing-float pointer-events-none absolute right-10 top-14 text-3xl opacity-90 drop-shadow-lg"
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
        className="landing-float landing-float-delay-lg pointer-events-none absolute bottom-52 right-12 text-xl opacity-75"
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

        {/* Headline — school-specific */}
        <h2 className="text-balance text-2xl font-bold leading-snug tracking-tight text-white xl:text-3xl">
          Join{" "}
          <span className="bg-gradient-to-r from-amber-100 via-white to-pink-100 bg-clip-text text-transparent">
            {schoolName}
          </span>
        </h2>

        {/* Subtitle */}
        <p className="mt-4 max-w-xs text-pretty text-base leading-relaxed text-white/85">
          Find your batch, reconnect with classmates, and share memories from
          your school days.
        </p>

        {/* Feature chips */}
        <div className="mt-8 flex flex-wrap gap-2">
          {FEATURE_CHIPS.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-medium text-white backdrop-blur-sm ring-1 ring-white/20"
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {label}
            </span>
          ))}
        </div>

        {/* Moderation note */}
        <p className="mt-10 max-w-xs text-xs leading-relaxed text-white/60">
          Your profile will be reviewed by the school&apos;s admin before it
          appears in the alumni directory.
        </p>
      </div>
    </div>
  );
}
