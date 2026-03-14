import type { SessionSnapshot } from "@skillzy/types";
import { notFound } from "next/navigation";
import { AppShell } from "../../../components/shell";
import { StudentSession } from "../../../components/student-session";
import { API_URL } from "../../../lib/api";
import { unwrapApiResult } from "../../../lib/api-result";

async function getSession(sessionId: string) {
  const response = await fetch(`${API_URL}/api/sessions/${sessionId}`, { cache: "no-store" });
  if (response.status === 404) return null;
  return unwrapApiResult<SessionSnapshot>(response);
}

async function getSessionByCode(joinCode: string) {
  const lookup = await fetch(`${API_URL}/api/sessions/join/${joinCode}`, { cache: "no-store" });
  if (lookup.status === 404) return null;
  const sessionMeta = await unwrapApiResult<{
    sessionId: string;
    title: string;
    anonymous_mode: boolean;
    code: string;
  }>(lookup);
  return getSession(sessionMeta.sessionId);
}

export default async function StudentSessionPage({
  params
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const snapshot =
    (sessionId.length === 4 ? await getSessionByCode(sessionId) : null) ??
    (await getSession(sessionId));
  if (!snapshot) notFound();

  return (
    <AppShell className="max-w-3xl">
      <StudentSession sessionId={snapshot.session.id} initialSnapshot={snapshot} />
    </AppShell>
  );
}
