import { AppShell } from "../../../components/shell";
import { GoogleSignInButton } from "../../../components/google-sign-in-button";
import { TeacherSecondaryPage } from "../../../components/teacher-secondary-page";
import { getTeacherRouteData } from "../../../lib/teacher-page-data";

export default async function TeacherTasksPage() {
  const routeData = await getTeacherRouteData();

  if (!routeData) {
    return (
      <AppShell className="max-w-2xl pt-16">
        <GoogleSignInButton next="/teacher/tasks" />
      </AppShell>
    );
  }

  return (
    <TeacherSecondaryPage
      activeNav="tasks"
      dashboard={routeData.dashboard}
      profile={routeData.profile}
      eyebrow="Coming next"
      title="Teacher tasks are getting a dedicated workspace"
      description="For now, your action queue lives on the main dashboard. This destination is reserved for richer task assignment, due dates, and classroom follow-up tools."
    >
      <section className="rounded-[1.9rem] bg-white p-6 shadow-[0_18px_50px_rgba(95,73,166,0.09)]">
        <p className="text-sm leading-7 text-[#6f6787]">
          Use the main dashboard to review your current action queue while this focused task space is staged.
        </p>
      </section>
    </TeacherSecondaryPage>
  );
}
