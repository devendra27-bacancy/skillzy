import type { DashboardData, DeckBundle } from "@skillzy/types";
import { TeacherAuthGate } from "../../components/teacher-auth-gate";
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
      <TeacherAuthGate
        next="/teacher"
        title="Open your teacher workspace"
        description="Sign in once to create sessions, manage templates, run live quizzes, and export reports."
      />
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
