import { GoogleSignInButton } from "../../components/google-sign-in-button";
import { AppShell, CreamCard } from "../../components/shell";
import { SignOutButton } from "../../components/sign-out-button";
import { StudentJoinForm } from "../../components/student-join-form";
import { createSupabaseServerClient } from "../../lib/supabase/server";

export default async function StudentPage() {
  const supabase = await createSupabaseServerClient();
  const authResult = supabase ? await supabase.auth.getUser() : null;
  const authUser = authResult?.data.user ?? null;

  if (!authUser) {
    return (
      <AppShell className="max-w-2xl pt-16">
        <CreamCard className="ticket-notch pt-10">
          <p className="text-sm uppercase tracking-[0.25em] text-skillzy-soft">Student workspace</p>
          <h1 className="mt-2 text-3xl font-semibold">Open your student workspace</h1>
          <p className="mt-3 max-w-xl text-skillzy-soft">
            Sign in with Google to keep your identity ready for live quizzes, or go back home if you only need the join flow.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <GoogleSignInButton next="/student" label="Continue with Google" />
            <a
              href="/"
              className="rounded-full border border-black/10 px-5 py-3 font-semibold text-skillzy-ink"
            >
              Back home
            </a>
          </div>
        </CreamCard>
      </AppShell>
    );
  }

  const displayName =
    authUser.user_metadata?.full_name ??
    authUser.user_metadata?.name ??
    authUser.email ??
    "Student";

  return (
    <AppShell className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-white/60">Student mode</p>
          <h1 className="mt-2 text-4xl font-semibold text-white">
            Welcome, {displayName}
          </h1>
          <p className="mt-2 text-white/70">
            Signed in as {authUser.email}. Join live classes and move straight into the active quiz flow.
          </p>
        </div>
        <SignOutButton />
      </div>

      <div>
        <CreamCard className="ticket-notch pt-10">
          <p className="text-sm uppercase tracking-[0.25em] text-skillzy-soft">Quick join</p>
          <h2 className="mt-2 text-3xl font-semibold">Enter a live class</h2>
          <p className="mt-3 text-skillzy-soft">
            Use the same join-code flow as before, now from your own dashboard.
          </p>
          <div className="mt-6">
            <StudentJoinForm signedInDisplayName={displayName} />
          </div>
        </CreamCard>
      </div>
    </AppShell>
  );
}
