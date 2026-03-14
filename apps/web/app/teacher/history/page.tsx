import Link from "next/link";
import { TeacherAuthGate } from "../../../components/teacher-auth-gate";
import { TeacherSecondaryPage } from "../../../components/teacher-secondary-page";
import { getTeacherRouteData } from "../../../lib/teacher-page-data";

export default async function TeacherHistoryPage() {
  const routeData = await getTeacherRouteData();

  if (!routeData) {
    return <TeacherAuthGate next="/teacher/history" title="Open session history" description="Sign in to review previous live runs, drafts, and summaries." />;
  }

  const sessions = [...routeData.dashboard.sessions]
    .filter((session) => session.status !== "deleted")
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());

  return (
    <TeacherSecondaryPage
      activeNav="dashboard"
      dashboard={routeData.dashboard}
      profile={routeData.profile}
      eyebrow="Session history"
      title="Review every teaching run"
      description="This is the history view for sessions across your workspace, including draft, live, and ended runs."
    >
      <div className="grid gap-4">
        {sessions.map((session) => {
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
                    {classroom?.name ?? "Class"} / {session.status}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#1d1731]">
                    {deck?.title ?? session.title ?? "Lesson session"}
                  </h3>
                  <p className="mt-2 text-sm text-[#6f6787]">
                    Join code {session.joinCode} / updated{" "}
                    {new Date(session.updatedAt).toLocaleString("en-US")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/teacher/sessions/${session.id}`}
                    className="rounded-full border border-[#ebe4ff] px-4 py-3 text-sm font-semibold text-[#2d2446]"
                  >
                    Open live view
                  </Link>
                  <Link
                    href={`/teacher/sessions/${session.id}/summary`}
                    className="rounded-full bg-[#1f1832] px-4 py-3 text-sm font-semibold text-white"
                  >
                    Open summary
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </TeacherSecondaryPage>
  );
}
