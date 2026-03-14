import type { SessionSnapshot } from "@skillzy/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "../../../../../components/shell";
import { GoogleSignInButton } from "../../../../../components/google-sign-in-button";
import { TeacherSecondaryPage } from "../../../../../components/teacher-secondary-page";
import { API_URL } from "../../../../../lib/api";
import { unwrapApiResult } from "../../../../../lib/api-result";
import { getTeacherRouteData } from "../../../../../lib/teacher-page-data";

async function getSession(sessionId: string) {
  const response = await fetch(`${API_URL}/api/sessions/${sessionId}`, { cache: "no-store" });
  if (response.status === 404) return null;
  return unwrapApiResult<SessionSnapshot>(response);
}

export default async function TeacherSessionSummaryPage({
  params
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const routeData = await getTeacherRouteData();
  if (!routeData) {
    return (
      <AppShell className="max-w-2xl pt-16">
        <GoogleSignInButton next="/teacher" />
      </AppShell>
    );
  }

  const { sessionId } = await params;
  const snapshot = await getSession(sessionId);
  if (!snapshot) notFound();

  const classRoom =
    routeData.dashboard.classes.find((item) => item.id === snapshot.session.classId) ?? null;

  return (
    <TeacherSecondaryPage
      activeNav="dashboard"
      dashboard={routeData.dashboard}
      profile={routeData.profile}
      eyebrow="Session summary"
      title={snapshot.deck.title}
      description="Review participation, question coverage, and where to go next after the live lesson ends."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <SummaryCard label="Session status" value={snapshot.session.status} />
        <SummaryCard label="Students joined" value={String(snapshot.participants.length)} />
        <SummaryCard label="Responses" value={String(snapshot.responses.length)} />
      </div>

      <section className="mt-5 rounded-[1.9rem] bg-white p-6 shadow-[0_18px_50px_rgba(95,73,166,0.09)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#948aad]">Session details</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#1d1731]">
              {classRoom?.name ?? "Class"} / Join code {snapshot.session.joinCode}
            </h3>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/teacher/sessions/${snapshot.session.id}`}
              className="rounded-full border border-[#ebe4ff] px-4 py-3 text-sm font-semibold text-[#2d2446]"
            >
              Back to live view
            </Link>
            <a
              href={`${API_URL}/api/sessions/${snapshot.session.id}/export`}
              className="rounded-full bg-[#1f1832] px-4 py-3 text-sm font-semibold text-white"
            >
              Download CSV
            </a>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-[1.9rem] bg-white p-6 shadow-[0_18px_50px_rgba(95,73,166,0.09)]">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#948aad]">Question coverage</p>
        <div className="mt-5 space-y-3">
          {snapshot.questions.map((question) => {
            const count = snapshot.responses.filter((response) => response.questionId === question.id).length;
            return (
              <div
                key={question.id}
                className="flex flex-col gap-3 rounded-[1.3rem] bg-[#faf7ff] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-[#1d1731]">{question.prompt}</p>
                  <p className="mt-1 text-sm text-[#7a7196]">
                    {question.type.replace(/[-_]/g, " ")}
                  </p>
                </div>
                <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#3a2c62]">
                  {count} responses
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </TeacherSecondaryPage>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <section className="rounded-[1.6rem] bg-white p-6 shadow-[0_18px_50px_rgba(95,73,166,0.09)]">
      <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#948aad]">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-[#1d1731]">{value}</p>
    </section>
  );
}
