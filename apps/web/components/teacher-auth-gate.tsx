"use client";

import Link from "next/link";
import { GoogleSignInButton } from "./google-sign-in-button";
import { AppShell, CreamCard } from "./shell";

export function TeacherAuthGate({
  next,
  title,
  description
}: {
  next: string;
  title: string;
  description: string;
}) {
  return (
    <AppShell className="max-w-2xl pt-16">
      <CreamCard className="ticket-notch pt-10">
        <p className="text-sm uppercase tracking-[0.25em] text-skillzy-soft">Teacher workspace</p>
        <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
        <p className="mt-3 max-w-xl text-skillzy-soft">{description}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <GoogleSignInButton next={next} label="Continue with Google" />
          <Link
            href="/"
            className="rounded-full border border-black/10 px-5 py-3 font-semibold text-skillzy-ink"
          >
            Back home
          </Link>
        </div>
      </CreamCard>
    </AppShell>
  );
}
