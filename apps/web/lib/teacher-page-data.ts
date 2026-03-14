import type { DashboardData } from "@skillzy/types";
import { API_URL } from "./api";
import { unwrapApiResult } from "./api-result";
import { createSupabaseServerClient } from "./supabase/server";

export interface TeacherRouteData {
  dashboard: DashboardData;
  profile: {
    name: string;
    email: string;
    avatarUrl?: string;
    initials: string;
  };
}

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export async function getTeacherDashboardData() {
  const response = await fetch(`${API_URL}/api/dashboard`, { cache: "no-store" });
  return unwrapApiResult<DashboardData>(response);
}

export async function getTeacherRouteData(): Promise<TeacherRouteData | null> {
  const supabase = await createSupabaseServerClient();
  const authResult = supabase ? await supabase.auth.getUser() : null;
  const authUser = authResult?.data.user ?? null;
  if (!authUser) return null;

  const dashboard = await getTeacherDashboardData();
  const displayName =
    authUser.user_metadata?.full_name ??
    authUser.user_metadata?.name ??
    authUser.email ??
    dashboard.teacher.name;

  return {
    dashboard,
    profile: {
      name: displayName,
      email: authUser.email ?? dashboard.teacher.email,
      avatarUrl:
        authUser.user_metadata?.avatar_url ??
        authUser.user_metadata?.picture ??
        dashboard.teacher.avatarUrl,
      initials: initialsFromName(displayName || "Teacher")
    }
  };
}
