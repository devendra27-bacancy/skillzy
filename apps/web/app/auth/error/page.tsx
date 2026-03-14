import Link from "next/link";
import { AppShell, CreamCard } from "../../../components/shell";

export default function AuthErrorPage() {
  return (
    <AppShell className="max-w-2xl pt-16">
      <CreamCard className="ticket-notch pt-10">
        <p className="text-sm uppercase tracking-[0.25em] text-skillzy-soft">Auth error</p>
        <h1 className="mt-2 text-3xl font-semibold">We could not complete Google sign-in.</h1>
        <p className="mt-3 text-skillzy-soft">
          Double-check the Google provider setup in Supabase and make sure the callback URL points to
          `/auth/callback`.
        </p>
        <Link
          href="/teacher"
          className="mt-6 inline-flex rounded-full bg-skillzy-ink px-5 py-3 font-semibold text-white"
        >
          Back to teacher portal
        </Link>
      </CreamCard>
    </AppShell>
  );
}
