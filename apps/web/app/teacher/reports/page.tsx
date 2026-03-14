import Link from "next/link";
import { AppShell } from "../../../components/shell";
import { GoogleSignInButton } from "../../../components/google-sign-in-button";
import { TeacherSecondaryPage } from "../../../components/teacher-secondary-page";
import { API_URL } from "../../../lib/api";
import { getTeacherRouteData } from "../../../lib/teacher-page-data";

export default async function TeacherReportsPage() {
  const routeData = await getTeacherRouteData();

  if (!routeData) {
    return (
      <AppShell className="max-w-2xl pt-16">
        <GoogleSignInButton next="/teacher/reports" />
      </AppShell>
    );
  }

  const completedSessions = routeData.dashboard.sessions.filter((session) => session.status === "ended");

  return (
    <TeacherSecondaryPage
      activeNav="reports"
      dashboard={routeData.dashboard}
      profile={routeData.profile}
      eyebrow="Reporting"
      title="Session reports and exports"
      description="Track completed sessions, open the live board for context, and download CSV exports when a lesson finishes."
    >
      <div className="grid gap-4">
        {completedSessions.length > 0 ? (
          completedSessions.map((session) => {
            const deck = routeData.dashboard.decks.find((item) => item.id === session.deckId);
            const classroom = routeData.dashboard.classes.find((item) => item.id === session.classId);
            return (
              <article
                key={session.id}
                className="rounded-[1.9rem] bg-white p-5 shadow-[0_18px_50px_rgba(95,73,166,0.09)]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#948aad]">
                      {classroom?.name ?? "Class"}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#1d1731]">
                      {deck?.title ?? "Lesson session"}
                    </h3>
                    <p className="mt-2 text-sm text-[#6f6787]">
                      Join code {session.joinCode} / ended {new Date(session.updatedAt).toLocaleDateString("en-US")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/teacher/sessions/${session.id}`}
                      className="rounded-full border border-[#ebe4ff] px-4 py-3 text-sm font-semibold text-[#2d2446]"
                    >
                      Open session
                    </Link>
                    <a
                      href={`${API_URL}/api/sessions/${session.id}/export`}
                      className="rounded-full bg-[#1f1832] px-4 py-3 text-sm font-semibold text-white"
                    >
                      Download CSV
                    </a>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <section className="rounded-[1.9rem] bg-white p-6 shadow-[0_18px_50px_rgba(95,73,166,0.09)]">
            <h3 className="text-2xl font-semibold tracking-tight text-[#1d1731]">No completed sessions yet</h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6f6787]">
              Once a live class ends, Skillzy will surface it here with a report-ready export action.
            </p>
          </section>
        )}
      </div>
    </TeacherSecondaryPage>
  );
}
