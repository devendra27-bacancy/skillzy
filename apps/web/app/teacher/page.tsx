import type { DashboardData, DeckBundle } from "@skillzy/types";
import { GoogleSignInButton } from "../../components/google-sign-in-button";
import { AppShell } from "../../components/shell";
import { TeacherDashboard } from "../../components/teacher-dashboard";
import { API_URL } from "../../lib/api";
import { unwrapApiResult } from "../../lib/api-result";
import { createSupabaseServerClient } from "../../lib/supabase/server";

async function getDashboard() {
  const response = await fetch(`${API_URL}/api/dashboard`, { cache: "no-store" });
  return unwrapApiResult<DashboardData>(response);
}

async function getDeckBundles() {
  const response = await fetch(`${API_URL}/api/decks`, { cache: "no-store" });
  return unwrapApiResult<DeckBundle[]>(response);
}

export default async function TeacherPage() {
  const supabase = await createSupabaseServerClient();
  const authResult = supabase ? await supabase.auth.getUser() : null;
  const authUser = authResult?.data.user ?? null;

  if (!authUser) {
    return (
      <AppShell className="max-w-3xl pt-16">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.25em] text-white/60">Teacher mode</p>
          <h1 className="text-4xl font-semibold text-white sm:text-5xl">
            Sign in with Google to open your Skillzy workspace.
          </h1>
          <p className="max-w-2xl text-white/70">
            Supabase Auth is now live for the teacher portal. Use your Google account to continue.
          </p>
          <GoogleSignInButton />
        </div>
      </AppShell>
    );
  }

  const [dashboard, bundles] = await Promise.all([getDashboard(), getDeckBundles()]);
  const displayName =
    authUser.user_metadata?.full_name ??
    authUser.user_metadata?.name ??
    authUser.email ??
    dashboard.teacher.name;
  const avatarUrl =
    authUser.user_metadata?.avatar_url ??
    authUser.user_metadata?.picture ??
    dashboard.teacher.avatarUrl;

  return (
    <TeacherDashboard
      dashboard={dashboard}
      bundles={bundles}
      authProfile={{
        name: displayName,
        email: authUser.email ?? dashboard.teacher.email,
        avatarUrl
      }}
    />
  );
}
