import type { SessionSnapshot } from "@skillzy/types";
import { notFound } from "next/navigation";
import { ProjectorSession } from "../../../components/projector-session";
import { API_URL } from "../../../lib/api";
import { unwrapApiResult } from "../../../lib/api-result";

async function getSession(sessionId: string) {
  const response = await fetch(`${API_URL}/api/sessions/${sessionId}`, { cache: "no-store" });
  if (response.status === 404) return null;
  return unwrapApiResult<SessionSnapshot>(response);
}

export default async function ProjectorPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const snapshot = await getSession(id);
  if (!snapshot) notFound();

  return <ProjectorSession sessionId={snapshot.session.id} initialSnapshot={snapshot} />;
}
