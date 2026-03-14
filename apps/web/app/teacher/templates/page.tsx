import { TeacherAuthGate } from "../../../components/teacher-auth-gate";
import { TeacherSecondaryPage } from "../../../components/teacher-secondary-page";
import { TeacherTemplatesPanel } from "../../../components/teacher-templates-panel";
import { getTeacherRouteData } from "../../../lib/teacher-page-data";

export default async function TeacherTemplatesPage() {
  const routeData = await getTeacherRouteData();

  if (!routeData) {
    return <TeacherAuthGate next="/teacher/templates" title="Open templates" description="Sign in to build templates, paste JSON quizzes, and start sessions faster." />;
  }

  return (
    <TeacherSecondaryPage
      activeNav="templates"
      dashboard={routeData.dashboard}
      profile={routeData.profile}
      eyebrow="Template library"
      title="Turn templates into live-ready sessions"
      description="Use the starter lesson library as the fastest path to a class-ready session."
    >
      <TeacherTemplatesPanel dashboard={routeData.dashboard} />
    </TeacherSecondaryPage>
  );
}
