import { TeacherAuthGate } from "../../../components/teacher-auth-gate";
import { TeacherSecondaryPage } from "../../../components/teacher-secondary-page";
import { getTeacherRouteData } from "../../../lib/teacher-page-data";

export default async function TeacherSettingsPage() {
  const routeData = await getTeacherRouteData();

  if (!routeData) {
    return <TeacherAuthGate next="/teacher/settings" title="Open settings" description="Sign in to review your teacher profile and workspace readiness." />;
  }

  return (
    <TeacherSecondaryPage
      activeNav="settings"
      dashboard={routeData.dashboard}
      profile={routeData.profile}
      eyebrow="Workspace settings"
      title="Teacher workspace settings"
      description="Review your identity, provider connection, and readiness checklist without leaving the new teacher shell."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[1.9rem] bg-white p-6 shadow-[0_18px_50px_rgba(95,73,166,0.09)]">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#948aad]">Account</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[#1d1731]">{routeData.profile.name}</h3>
          <p className="mt-2 text-sm text-[#6f6787]">{routeData.profile.email}</p>
          <p className="mt-6 text-sm leading-7 text-[#6f6787]">
            Teacher authentication is connected through Supabase Google sign-in. This panel is the starting point for future workspace preferences and school-level settings.
          </p>
        </section>

        <section className="rounded-[1.9rem] bg-white p-6 shadow-[0_18px_50px_rgba(95,73,166,0.09)]">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#948aad]">Setup checklist</p>
          <div className="mt-5 space-y-3">
            {routeData.dashboard.teacherDashboard.profile.setupChecks.map((check) => (
              <div key={check.id} className="flex items-center justify-between rounded-[1.3rem] bg-[#faf7ff] px-4 py-4">
                <div>
                  <p className="text-sm font-semibold text-[#1d1731]">{check.label}</p>
                  <p className="text-xs text-[#8a82a2]">{check.complete ? "Ready" : "Needs setup"}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                    check.complete
                      ? "bg-[#e6fbf0] text-[#249461]"
                      : "bg-[#fff1e9] text-[#d06f4a]"
                  }`}
                >
                  {check.complete ? "Done" : "Todo"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </TeacherSecondaryPage>
  );
}
