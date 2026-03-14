import { AppShell } from "../../../components/shell";
import { GoogleSignInButton } from "../../../components/google-sign-in-button";
import { TeacherSecondaryPage } from "../../../components/teacher-secondary-page";
import { TeacherTemplatesPanel } from "../../../components/teacher-templates-panel";
import { getTeacherRouteData } from "../../../lib/teacher-page-data";

export default async function TeacherTemplatesPage() {
  const routeData = await getTeacherRouteData();

  if (!routeData) {
    return (
      <AppShell className="max-w-2xl pt-16">
        <GoogleSignInButton next="/teacher/templates" />
      </AppShell>
    );
  }

  return (
    <TeacherSecondaryPage
      activeNav="templates"
      dashboard={routeData.dashboard}
      profile={routeData.profile}
      eyebrow="Template library"
      title="Turn templates into live-ready decks"
      description="Use the starter lesson library as the fastest path to a class-ready session."
    >
      <TeacherTemplatesPanel dashboard={routeData.dashboard} />
    </TeacherSecondaryPage>
  );
}
