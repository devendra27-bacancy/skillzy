import { redirect } from "next/navigation";
import { GoogleSignInButton } from "../components/google-sign-in-button";
import { AppShell } from "../components/shell";
import { createSupabaseServerClient } from "../lib/supabase/server";

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<{ code?: string; next?: string }>;
}) {
  const params = await searchParams;
  if (params.code) {
    const next = params.next ? `&next=${encodeURIComponent(params.next)}` : "";
    redirect(`/auth/callback?code=${encodeURIComponent(params.code)}${next}`);
  }

  const supabase = await createSupabaseServerClient();
  const authResult = supabase ? await supabase.auth.getUser() : null;
  const authUser = authResult?.data.user ?? null;

  return (
    <AppShell className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-black/20 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur">
        <div className="space-y-4 text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-white/60">Skillzy</p>
          <h1 className="text-4xl font-semibold text-white">Sign in</h1>
          {authUser ? (
            <p className="text-sm text-white/70">Signed in as {authUser.email}</p>
          ) : (
            <p className="text-sm text-white/70">
              Choose whether you want to continue into the teacher or student workspace.
            </p>
          )}
        </div>
        <div className="mt-8 grid gap-3">
          <GoogleSignInButton next="/teacher" label="Teacher Google sign-in" />
          <GoogleSignInButton next="/student" label="Student Google sign-in" />
        </div>
      </div>
    </AppShell>
  );
}
