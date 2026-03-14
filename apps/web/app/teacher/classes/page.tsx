import { AppShell } from "../../../components/shell";
import { GoogleSignInButton } from "../../../components/google-sign-in-button";
import { TeacherSecondaryPage } from "../../../components/teacher-secondary-page";
import { getTeacherRouteData } from "../../../lib/teacher-page-data";

export default async function TeacherClassesPage() {
  const routeData = await getTeacherRouteData();

  if (!routeData) {
    return (
      <AppShell className="max-w-2xl pt-16">
        <GoogleSignInButton next="/teacher/classes" />
      </AppShell>
    );
  }

  return (
    <TeacherSecondaryPage
      activeNav="classes"
      dashboard={routeData.dashboard}
      profile={routeData.profile}
      eyebrow="Class workspace"
      title="Classes and teaching momentum"
      description="See every class, its teaching readiness, and how much lesson momentum is already in place."
    >
      <div className="grid gap-4">
        {routeData.dashboard.teacherDashboard.classRows.map((row) => (
          <article
            key={row.classId}
            className="rounded-[1.9rem] bg-white p-5 shadow-[0_18px_50px_rgba(95,73,166,0.09)]"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-2xl font-semibold tracking-tight text-[#1d1731]">{row.name}</p>
                <p className="mt-2 text-sm text-[#6f6787]">
                  {row.subject}
                  {row.gradeLevel ? ` / ${row.gradeLevel}` : ""} / {row.timeLabel}
                </p>
              </div>
              <span className="rounded-full bg-[#f4f0ff] px-4 py-2 text-sm font-semibold text-[#735ac8]">
                {row.progressLabel}
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.4rem] bg-[#faf7ff] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#948aad]">Roster</p>
                <p className="mt-2 text-2xl font-semibold text-[#201936]">{row.rosterCount}</p>
              </div>
              <div className="rounded-[1.4rem] bg-[#faf7ff] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#948aad]">Decks</p>
                <p className="mt-2 text-2xl font-semibold text-[#201936]">{row.deckCount}</p>
              </div>
              <div className="rounded-[1.4rem] bg-[#faf7ff] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#948aad]">Sessions</p>
                <p className="mt-2 text-2xl font-semibold text-[#201936]">{row.sessionCount}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </TeacherSecondaryPage>
  );
}
