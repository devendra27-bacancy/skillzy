import Link from "next/link";
import { AppShell } from "../../../components/shell";
import { GoogleSignInButton } from "../../../components/google-sign-in-button";
import { TeacherSecondaryPage } from "../../../components/teacher-secondary-page";
import { getTeacherRouteData } from "../../../lib/teacher-page-data";

export default async function TeacherDecksPage() {
  const routeData = await getTeacherRouteData();

  if (!routeData) {
    return (
      <AppShell className="max-w-2xl pt-16">
        <GoogleSignInButton next="/teacher/decks" />
      </AppShell>
    );
  }

  return (
    <TeacherSecondaryPage
      activeNav="decks"
      dashboard={routeData.dashboard}
      profile={routeData.profile}
      eyebrow="Deck studio"
      title="All decks in one place"
      description="Review every lesson deck across your teaching workspace, then jump straight back into editing."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {routeData.dashboard.decks.map((deck) => {
          const classroom = routeData.dashboard.classes.find((item) => item.id === deck.classId);
          return (
            <article
              key={deck.id}
              className="overflow-hidden rounded-[1.9rem] bg-white shadow-[0_18px_50px_rgba(95,73,166,0.09)]"
            >
              <div
                className="px-5 py-5 text-white"
                style={{
                  backgroundImage:
                    deck.heroGradient ||
                    "linear-gradient(135deg, #20192f 0%, #2a2341 50%, #181223 100%)"
                }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                  {classroom?.name ?? "Class"}
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight">{deck.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/76">{deck.description}</p>
              </div>
              <div className="flex items-center justify-between gap-3 px-5 py-4">
                <span className="text-sm text-[#726987]">{deck.source}</span>
                <Link
                  href={`/teacher/decks/${deck.id}`}
                  className="rounded-full border border-[#ebe4ff] px-4 py-3 text-sm font-semibold text-[#2d2446]"
                >
                  Edit deck
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </TeacherSecondaryPage>
  );
}
