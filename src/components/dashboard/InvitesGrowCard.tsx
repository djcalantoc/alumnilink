import Link from "next/link";

export function InvitesGrowCard() {
  return (
    <section className="rounded-xl bg-gradient-to-br from-pink-100 to-indigo-500 p-6 text-[#3d0026] shadow-inner">
      <h4 className="text-sm font-bold">Help us grow!</h4>
      <p className="mt-2 text-xs leading-relaxed opacity-80">
        Invite a few classmates — the wall gets louder (in a good way) when
        your batch shows up together.
      </p>
      <Link
        href="/dashboard/school"
        className="mt-4 flex min-h-10 w-full items-center justify-center rounded-lg bg-[#3d0026] text-xs font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        Invite friends
      </Link>
    </section>
  );
}
