import { AppShell } from "../../../components/shell";
import { GoogleSignInButton } from "../../../components/google-sign-in-button";
import { TeacherSecondaryPage } from "../../../components/teacher-secondary-page";
import { getTeacherRouteData } from "../../../lib/teacher-page-data";

export default async function TeacherEventsPage() {
  const routeData = await getTeacherRouteData();

  if (!routeData) {
    return (
      <AppShell className="max-w-2xl pt-16">
        <GoogleSignInButton next="/teacher/events" />
      </AppShell>
    );
  }

  return (
    <TeacherSecondaryPage
      activeNav="events"
      dashboard={routeData.dashboard}
      profile={routeData.profile}
      eyebrow="Coming next"
      title="Events will graduate into their own planner"
      description="The teacher shell already reserves space for calendar, scheduling, and live-session planning. This page is the placeholder for that future workflow."
    >
      <section className="rounded-[1.9rem] bg-white p-6 shadow-[0_18px_50px_rgba(95,73,166,0.09)]">
        <p className="text-sm leading-7 text-[#6f6787]">
          Until then, launch sessions directly from the dashboard and session screens.
        </p>
      </section>
    </TeacherSecondaryPage>
  );
}
