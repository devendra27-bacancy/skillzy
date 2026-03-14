import Link from "next/link";
import { BrandHeader } from "../components/brand";
import { GoogleSignInButton } from "../components/google-sign-in-button";
import { AppShell, CreamCard } from "../components/shell";
import { SignOutButton } from "../components/sign-out-button";
import { StudentJoinForm } from "../components/student-join-form";
import { createSupabaseServerClient } from "../lib/supabase/server";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const authResult = supabase ? await supabase.auth.getUser() : null;
  const authUser = authResult?.data.user ?? null;

  return (
    <AppShell className="flex flex-col justify-center">
      <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.95fr]">
        <div className="space-y-6">
          <BrandHeader
            eyebrow="Skillzy classroom"
            title="Teach live lessons that students actually lean into."
            subtitle="Join by code, answer in real time, and let teachers see understanding unfold slide by slide."
          />
          <div className="flex flex-wrap gap-3">
            <Link href="/teacher" className="rounded-full bg-white px-5 py-3 font-semibold text-skillzy-ink">
              Teacher dashboard
            </Link>
            <Link
              href="/student"
              className="rounded-full border border-white/15 px-5 py-3 font-semibold text-white"
            >
              Student dashboard
            </Link>
            {authUser ? (
              <SignOutButton />
            ) : (
              <>
                <GoogleSignInButton next="/teacher" label="Teacher Google sign-in" />
                <GoogleSignInButton next="/student" label="Student Google sign-in" />
              </>
            )}
            <span className="rounded-full border border-white/15 px-5 py-3 text-white/80">
              PWA-ready mobile classroom
            </span>
          </div>
          {authUser ? (
            <p className="text-sm text-white/65">Signed in as {authUser.email}</p>
          ) : null}
        </div>

        <CreamCard className="ticket-notch pt-10">
          <p className="text-sm uppercase tracking-[0.25em] text-skillzy-soft">Student entry</p>
          <h2 className="mt-2 text-3xl font-semibold">Join a live session</h2>
          <p className="mt-3 text-skillzy-soft">
            Students do not need accounts. A join code and name are enough to enter the room and stay synced.
          </p>
          <div className="mt-6">
            <StudentJoinForm />
          </div>
        </CreamCard>
      </div>
    </AppShell>
  );
}
