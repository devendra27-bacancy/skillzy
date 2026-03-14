import type { SessionSnapshot } from "@skillzy/types";
import { notFound } from "next/navigation";
import { AppShell } from "../../../../components/shell";
import { GoogleSignInButton } from "../../../../components/google-sign-in-button";
import { TeacherSession } from "../../../../components/teacher-session";
import { API_URL } from "../../../../lib/api";
import { unwrapApiResult } from "../../../../lib/api-result";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

async function getSession(sessionId: string) {
  const response = await fetch(`${API_URL}/api/sessions/${sessionId}`, { cache: "no-store" });
  if (response.status === 404) return null;
  return unwrapApiResult<SessionSnapshot>(response);
}

export default async function TeacherSessionPage({
  params
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const authResult = supabase ? await supabase.auth.getUser() : null;
  if (!authResult?.data.user) {
    return (
      <AppShell className="max-w-2xl pt-16">
        <GoogleSignInButton next="/teacher" />
      </AppShell>
    );
  }

  const { sessionId } = await params;
  const snapshot = await getSession(sessionId);
  if (!snapshot) notFound();

  return (
    <AppShell>
      <TeacherSession initialSnapshot={snapshot} />
    </AppShell>
  );
}
