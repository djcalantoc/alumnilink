"use client";

import { useActionState, useRef, useState } from "react";
import { Check, Info, Save } from "lucide-react";
import { savePlatformSetting } from "@/features/super-admin/actions/admin-actions";
import type { PlatformSetting } from "@/features/super-admin/lib/types";
import { SETTING_BOOLEANS } from "@/features/super-admin/lib/types";
import { cn } from "@/lib/cn";

type Props = { settings: PlatformSetting[] };

function SettingRow({ setting }: { setting: PlatformSetting }) {
  const [state, action, pending] = useActionState(
    async (_: unknown, fd: FormData) => savePlatformSetting(fd),
    null,
  );
  const isBoolean = SETTING_BOOLEANS.has(setting.key);
  const [localVal, setLocalVal] = useState(setting.value ?? "");
  const textRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-3 border-b border-stone-100 py-5 last:border-0 dark:border-stone-800 sm:flex-row sm:items-start">
      <div className="flex-1 min-w-0">
        <label
          htmlFor={`setting-${setting.key}`}
          className="block text-sm font-semibold text-stone-900 dark:text-stone-50"
        >
          {setting.label}
        </label>
        {setting.hint && (
          <p className="mt-0.5 flex items-start gap-1 text-xs text-stone-400 dark:text-stone-500">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            {setting.hint}
          </p>
        )}
      </div>
      <form action={action} className="flex shrink-0 items-center gap-2">
        <input type="hidden" name="key" value={setting.key} />
        {isBoolean ? (
          <label className="relative inline-flex items-center cursor-pointer gap-2 select-none">
            <input
              type="checkbox"
              name="value"
              value="true"
              defaultChecked={setting.value === "true"}
              className="sr-only peer"
              onChange={(e) => {
                const fd = new FormData(e.currentTarget.form!);
                if (!e.currentTarget.checked) fd.set("value", "false");
                savePlatformSetting(fd).catch(console.error);
              }}
            />
            <div className="h-5 w-9 rounded-full bg-stone-200 peer-checked:bg-violet-600 transition-colors dark:bg-stone-700" />
            <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
          </label>
        ) : (
          <>
            <input
              id={`setting-${setting.key}`}
              ref={textRef}
              type="text"
              name="value"
              value={localVal}
              onChange={(e) => setLocalVal(e.target.value)}
              className="w-56 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
            />
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
              title="Save"
            >
              {state?.ok ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            </button>
          </>
        )}
      </form>
      {state && !state.ok && (
        <p className="text-xs text-red-600 dark:text-red-400 sm:col-span-2">
          {(state as { ok: false; error: string }).error}
        </p>
      )}
    </div>
  );
}

const SECTIONS: { title: string; keys: string[] }[] = [
  {
    title: "General",
    keys: ["platform_name", "support_email"],
  },
  {
    title: "Registration & Approvals",
    keys: [
      "allow_public_registration",
      "require_school_approval",
      "require_alumni_approval",
    ],
  },
  {
    title: "Platform",
    keys: ["maintenance_mode", "max_schools_per_admin"],
  },
  {
    title: "Legal",
    keys: ["terms_url", "privacy_url"],
  },
];

export function PlatformSettingsPanel({ settings }: Props) {
  const byKey = Object.fromEntries(settings.map((s) => [s.key, s]));

  if (settings.length === 0) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white px-6 py-16 text-center dark:border-stone-800 dark:bg-stone-950">
        <p className="text-sm text-stone-400">No settings available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {SECTIONS.map(({ title, keys }) => {
        const visible = keys.filter((k) => byKey[k]);
        if (visible.length === 0) return null;
        return (
          <div
            key={title}
            className="rounded-2xl border border-stone-200 bg-white px-6 dark:border-stone-800 dark:bg-stone-950"
          >
            <h2 className="border-b border-stone-100 py-4 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:border-stone-800 dark:text-stone-400">
              {title}
            </h2>
            {visible.map((k) => (
              <SettingRow key={k} setting={byKey[k]} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
