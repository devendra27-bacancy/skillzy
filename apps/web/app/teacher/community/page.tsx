import { AppShell } from "../../../components/shell";
import { GoogleSignInButton } from "../../../components/google-sign-in-button";
import { TeacherSecondaryPage } from "../../../components/teacher-secondary-page";
import { getTeacherRouteData } from "../../../lib/teacher-page-data";

export default async function TeacherCommunityPage() {
  const routeData = await getTeacherRouteData();

  if (!routeData) {
    return (
      <AppShell className="max-w-2xl pt-16">
        <GoogleSignInButton next="/teacher/community" />
      </AppShell>
    );
  }

  return (
    <TeacherSecondaryPage
      activeNav="community"
      dashboard={routeData.dashboard}
      profile={routeData.profile}
      eyebrow="Coming next"
      title="Community space is staged for later"
      description="This shell entry is intentional. It marks where shared teaching ideas, school-level collaboration, and community templates will live next."
    >
      <section className="rounded-[1.9rem] bg-white p-6 shadow-[0_18px_50px_rgba(95,73,166,0.09)]">
        <p className="text-sm leading-7 text-[#6f6787]">
          The new navigation is ready for a future community feature without breaking the teacher flow you use today.
        </p>
      </section>
    </TeacherSecondaryPage>
  );
}
