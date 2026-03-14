import { AppShell } from "../../../components/shell";
import { GoogleSignInButton } from "../../../components/google-sign-in-button";
import { TeacherNewSessionPanel } from "../../../components/teacher-new-session-panel";
import { TeacherSecondaryPage } from "../../../components/teacher-secondary-page";
import { getTeacherRouteData } from "../../../lib/teacher-page-data";

export default async function TeacherNewSessionPage() {
  const routeData = await getTeacherRouteData();

  if (!routeData) {
    return (
      <AppShell className="max-w-2xl pt-16">
        <GoogleSignInButton next="/teacher/new-session" />
      </AppShell>
    );
  }

  return (
    <TeacherSecondaryPage
      activeNav="new-session"
      dashboard={routeData.dashboard}
      profile={routeData.profile}
      eyebrow="Session creator"
      title="Create a live session"
      description="Pick a class, choose the deck you want to present, and launch straight into the live teacher controls."
    >
      <TeacherNewSessionPanel dashboard={routeData.dashboard} />
    </TeacherSecondaryPage>
  );
}
