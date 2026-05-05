import Link from "next/link";
import { fetchApprovedDirectoryProfiles } from "@/features/classmate-discovery/lib/queries";
import type { DirectoryFetchScope } from "@/features/classmate-discovery/lib/queries";
import { resolveClassmateSchoolContext } from "@/features/classmate-discovery/lib/access";
import { PeopleDirectory } from "@/features/classmate-discovery/components/people-directory";
import type { PeopleDirectoryScope } from "@/features/classmate-discovery/components/people-directory";
import { PendingReconnectInbox } from "@/features/reconnect/components/pending-reconnect-inbox";
import {
  fetchAcceptedReconnectContacts,
  fetchPendingReconnectIncoming,
} from "@/features/reconnect/lib/queries";
import { SchoolPicker } from "@/features/school-batch-sections/components/school-picker";
import { getAuthUser } from "@/features/auth/lib/auth-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const COPY: Record<
  PeopleDirectoryScope,
  {
    title: string;
    subtitle: string;
    empty: string;
    pickerDescription: string;
    pickerAction: string;
  }
> = {
  school: {
    title: "Your School",
    subtitle: "Everyone connected to your school community.",
    empty: "No alumni have joined this school yet.",
    pickerDescription: "Choose a school to continue.",
    pickerAction: "Continue →",
  },
  batchmates: {
    title: "Batchmates",
    subtitle: "People from your graduation year.",
    empty: "No batchmates have joined yet.",
    pickerDescription: "Choose a school to see people from your graduation year.",
    pickerAction: "View batchmates →",
  },
  classmates: {
    title: "Classmates",
    subtitle: "People from your section.",
    empty: "No classmates from your section yet.",
    pickerDescription:
      "Choose a school to see classmates from your batch and section.",
    pickerAction: "View classmates →",
  },
};

type SearchParams = { schoolId?: string; q?: string };

export async function PeopleDirectoryPage({
  scope,
  pathname,
  searchParams,
}: {
  scope: PeopleDirectoryScope;
  pathname: string;
  searchParams: SearchParams;
}) {
  const requested = searchParams.schoolId?.trim() || undefined;
  const initialSearch = searchParams.q?.trim() || "";

  const supabase = await createSupabaseServerClient();
  const user = await getAuthUser(supabase);

  if (!user) {
    return null;
  }

  const ctx = await resolveClassmateSchoolContext(pathname, requested);

  if (!ctx.ok) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          {COPY[scope].title}
        </h1>
        <div
          className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          <p>{ctx.error}</p>
          <p className="mt-3">
            <Link
              href="/dashboard/profile"
              className="font-medium text-amber-950 underline-offset-4 hover:underline dark:text-amber-50"
            >
              View your profile
            </Link>
            {" · "}
            <Link
              href="/dashboard"
              className="font-medium text-amber-950 underline-offset-4 hover:underline dark:text-amber-50"
            >
              Dashboard
            </Link>
          </p>
        </div>
      </main>
    );
  }

  if ("pickSchool" in ctx) {
    const c = COPY[scope];
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <SchoolPicker
          schools={ctx.schools}
          targetPath={pathname}
          title={c.title}
          description={c.pickerDescription}
          actionLabel={c.pickerAction}
        />
      </main>
    );
  }

  const { schoolId, schools } = ctx;
  const schoolMeta = schools.find((s) => s.id === schoolId);
  if (!schoolMeta) {
    return null;
  }

  const { data: myProf, error: profErr } = await supabase
    .from("alumni_profiles")
    .select("id, batch_id, section_id")
    .eq("user_id", user.id)
    .eq("school_id", schoolId)
    .eq("status", "approved")
    .maybeSingle();

  if (profErr || !myProf) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {profErr?.message ?? "Profile not found for this school."}
        </p>
      </main>
    );
  }

  let fetchScope: DirectoryFetchScope | null = null;
  if (scope === "school") {
    fetchScope = { kind: "school" };
  } else if (scope === "batchmates") {
    if (!myProf.batch_id) {
      return (
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">
            {COPY.batchmates.title}
          </h1>
          <div
            className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
            role="status"
          >
            <p>Add your batch on your profile to see people from your graduation year.</p>
            <p className="mt-3">
              <Link
                href="/dashboard/profile"
                className="font-medium text-amber-950 underline hover:underline dark:text-amber-50"
              >
                Update profile
              </Link>
            </p>
          </div>
        </main>
      );
    }
    fetchScope = { kind: "batch", batchId: myProf.batch_id as string };
  } else {
    if (!myProf.batch_id || !myProf.section_id) {
      return (
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">
            {COPY.classmates.title}
          </h1>
          <div
            className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
            role="status"
          >
            <p>
              Add your batch and section on your profile to see classmates from your
              section.
            </p>
            <p className="mt-3">
              <Link
                href="/dashboard/profile"
                className="font-medium text-amber-950 underline hover:underline dark:text-amber-50"
              >
                Update profile
              </Link>
            </p>
          </div>
        </main>
      );
    }
    fetchScope = {
      kind: "section",
      batchId: myProf.batch_id as string,
      sectionId: myProf.section_id as string,
    };
  }

  const [
    { rows, error },
    { map: contactByPeerUserId, error: rcErr },
    { rows: pendingIn, error: prErr },
  ] = await Promise.all([
    fetchApprovedDirectoryProfiles(
      supabase,
      schoolId,
      user.id,
      fetchScope,
    ),
    fetchAcceptedReconnectContacts(supabase, schoolId, user.id),
    fetchPendingReconnectIncoming(supabase, schoolId, user.id),
  ]);

  if (error) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      </main>
    );
  }

  if (rcErr || prErr) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {rcErr ?? prErr}
        </p>
      </main>
    );
  }

  const nameByUserId = new Map(rows.map((r) => [r.user_id, r.display_name]));
  const pendingItems = pendingIn.map((p) => ({
    id: p.id,
    from_user_id: p.from_user_id,
    label:
      nameByUserId.get(p.from_user_id)?.trim() ||
      "A classmate",
  }));

  const c = COPY[scope];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
      <PendingReconnectInbox items={pendingItems} />
      <PeopleDirectory
        scope={scope}
        title={c.title}
        subtitle={c.subtitle}
        emptyMessage={c.empty}
        schoolName={schoolMeta.name}
        schoolSlug={schoolMeta.slug}
        schoolId={schoolId}
        currentUserId={user.id}
        currentProfileId={myProf.id as string}
        contactByPeerUserId={contactByPeerUserId}
        classmates={rows}
        canSwitchSchool={schools.length > 1}
        initialSearch={initialSearch}
      />
    </main>
  );
}
