import Link from "next/link";

export function FinalCTA() {
  return (
    <section className="relative left-1/2 w-[100vw] max-w-[100vw] -translate-x-1/2 overflow-hidden py-24 sm:py-28">
      <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_100%_at_50%_110%,rgba(0,0,0,0.22),transparent_58%)]" />
      <div className="pointer-events-none absolute -left-24 top-8 h-72 w-72 rounded-full bg-white/12 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-6 h-80 w-80 rounded-full bg-amber-200/25 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
          <h2 className="max-w-xl text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-[3.25rem] md:leading-[1.08]">
            Your batch is waiting.
          </h2>
          <Link
            href="#start-here"
            className="inline-flex min-h-14 shrink-0 items-center justify-center rounded-2xl bg-white px-12 text-lg font-bold text-fuchsia-700 shadow-xl shadow-black/20 transition duration-300 ease-out hover:scale-[1.04] hover:shadow-2xl active:scale-[0.98] motion-reduce:transition-none"
          >
            Find your classmates
          </Link>
        </div>
      </div>
    </section>
  );
}
