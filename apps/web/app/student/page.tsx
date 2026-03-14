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
      <AppShell className="max-w-3xl pt-16">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.25em] text-white/60">Student mode</p>
          <h1 className="text-4xl font-semibold text-white sm:text-5xl">
            Sign in with Google to open your student dashboard.
          </h1>
          <p className="max-w-2xl text-white/70">
            Students can still join with a code only, but Google sign-in gives them a dedicated dashboard.
          </p>
          <GoogleSignInButton next="/student" label="Continue with Google as student" />
        </div>
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
            Signed in with {authUser.email}. Join live classes, track your participation, and keep your learning flow in one place.
          </p>
        </div>
        <SignOutButton />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <CreamCard className="ticket-notch pt-10">
          <p className="text-sm uppercase tracking-[0.25em] text-skillzy-soft">Quick join</p>
          <h2 className="mt-2 text-3xl font-semibold">Enter a live class</h2>
          <p className="mt-3 text-skillzy-soft">
            Use the same join-code flow as before, now from your own dashboard.
          </p>
          <div className="mt-6">
            <StudentJoinForm />
          </div>
        </CreamCard>

        <div className="space-y-6">
          <CreamCard>
            <p className="text-sm uppercase tracking-[0.25em] text-skillzy-soft">Profile</p>
            <div className="mt-4 rounded-[1.5rem] bg-white/70 p-4">
              <p className="text-sm text-skillzy-soft">Email</p>
              <p className="mt-1 text-lg font-semibold">{authUser.email}</p>
            </div>
          </CreamCard>

          <CreamCard>
            <p className="text-sm uppercase tracking-[0.25em] text-skillzy-soft">Student dashboard</p>
            <ul className="mt-4 space-y-3">
              <li className="rounded-[1.5rem] bg-white/70 p-4">
                Participation history will appear here once we bind Supabase users to session records.
              </li>
              <li className="rounded-[1.5rem] bg-white/70 p-4">
                Saved classes, streaks, and progress summaries are the next student-facing milestone.
              </li>
            </ul>
          </CreamCard>
        </div>
      </div>
    </AppShell>
  );
}
