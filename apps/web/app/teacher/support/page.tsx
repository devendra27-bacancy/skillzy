import { AppShell } from "../../../components/shell";
import { GoogleSignInButton } from "../../../components/google-sign-in-button";
import { TeacherSecondaryPage } from "../../../components/teacher-secondary-page";
import { getTeacherRouteData } from "../../../lib/teacher-page-data";

export default async function TeacherSupportPage() {
  const routeData = await getTeacherRouteData();

  if (!routeData) {
    return (
      <AppShell className="max-w-2xl pt-16">
        <GoogleSignInButton next="/teacher/support" />
      </AppShell>
    );
  }

  return (
    <TeacherSecondaryPage
      activeNav="support"
      dashboard={routeData.dashboard}
      profile={routeData.profile}
      eyebrow="Coming next"
      title="Support will live here"
      description="This destination is intentionally staged so the new shell feels complete today and can expand into real support, docs, and teacher help flows later."
    >
      <section className="rounded-[1.9rem] bg-white p-6 shadow-[0_18px_50px_rgba(95,73,166,0.09)]">
        <p className="text-sm leading-7 text-[#6f6787]">
          For now, the main dashboard highlights setup blockers and report-ready sessions so support needs stay visible.
        </p>
      </section>
    </TeacherSecondaryPage>
  );
}
