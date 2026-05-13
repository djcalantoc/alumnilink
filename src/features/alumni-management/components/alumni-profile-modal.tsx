"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  Layers,
  Link2,
  MapPin,
  User,
  X,
  XCircle,
} from "lucide-react";
import type { AlumniRecord } from "@/features/alumni-management/lib/types";
import { SafeImage } from "@/components/common/SafeImage";
import { DefaultAvatar } from "@/components/common/placeholders";

type Props = {
  profile: AlumniRecord;
  onClose: () => void;
};

function StatusChip({ status, sectionId }: { status: string; sectionId: string | null }) {
  if (status === "approved")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
        <CheckCircle2 className="h-4 w-4" /> Approved
      </span>
    );
  if (status === "rejected")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-400">
        <XCircle className="h-4 w-4" /> Rejected
      </span>
    );
  if (!sectionId)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700 dark:bg-orange-950/40 dark:text-orange-400">
        <Clock className="h-4 w-4" /> Needs Routing
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
      <Clock className="h-4 w-4" /> Pending Review
    </span>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800">
        <Icon className="h-3.5 w-3.5 text-stone-500 dark:text-stone-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-stone-400 dark:text-stone-500">{label}</p>
        <p className="mt-0.5 break-words text-sm text-stone-800 dark:text-stone-200">{value}</p>
      </div>
    </div>
  );
}

export function AlumniProfileModal({ profile, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const email = (profile.users as { email?: string | null } | null)?.email ?? null;

  const location = [profile.location_city, profile.location_country]
    .filter(Boolean)
    .join(", ");

  if (typeof window === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Profile: ${profile.display_name ?? "Alumni"}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-stone-950"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover / avatar strip */}
        <div className="relative h-24 bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-500">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg bg-black/30 text-white hover:bg-black/50"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute -bottom-9 left-5">
            <SafeImage
              src={profile.photo_url}
              fallback={<DefaultAvatar />}
              alt={profile.display_name ?? ""}
              className="size-18 rounded-2xl border-4 border-white shadow-lg dark:border-stone-950"
              imgClassName="object-cover"
            />
          </div>
        </div>

        {/* Content */}
        <div className="mt-10 space-y-5 overflow-y-auto px-5 pb-6" style={{ maxHeight: "70vh" }}>
          {/* Name + status */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50">
                {profile.display_name?.trim() || "Unnamed Alumni"}
              </h2>
              {profile.headline && (
                <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">
                  {profile.headline}
                </p>
              )}
            </div>
            <StatusChip status={profile.status} sectionId={profile.section_id} />
          </div>

          {/* Info grid */}
          <div className="space-y-3">
            <Row icon={User} label="Email" value={email} />
            <Row
              icon={GraduationCap}
              label="Batch"
              value={
                profile.batches
                  ? `${profile.batches.name}${profile.batches.graduation_year != null ? ` (${profile.batches.graduation_year})` : ""}`
                  : null
              }
            />
            <Row icon={Layers} label="Section" value={profile.sections?.name ?? null} />
            <Row icon={MapPin} label="Location" value={location || null} />
            <Row
              icon={Link2}
              label="Social / Website"
              value={
                profile.social_url ? (
                  <a
                    href={profile.social_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-600 underline-offset-4 hover:underline dark:text-violet-400"
                  >
                    {profile.social_url}
                  </a>
                ) : null
              }
            />
            <Row
              icon={Calendar}
              label="Registered"
              value={new Date(profile.created_at).toLocaleDateString(undefined, {
                dateStyle: "long",
              })}
            />
            <Row
              icon={Calendar}
              label="Last updated"
              value={new Date(profile.updated_at).toLocaleDateString(undefined, {
                dateStyle: "long",
              })}
            />
          </div>

          {/* Visibility */}
          <div className="rounded-xl border border-stone-100 bg-stone-50 px-4 py-3 dark:border-stone-800 dark:bg-stone-900/40">
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
              Profile visibility
            </p>
            <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">
              {profile.is_profile_public
                ? "Public to approved alumni at this school"
                : "Private — only visible to school admins"}
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
