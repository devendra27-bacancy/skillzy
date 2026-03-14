"use client";

import type { DashboardData } from "@skillzy/types";
import type { ReactNode } from "react";
import { SignOutButton } from "./sign-out-button";
import { TeacherShell } from "./teacher-shell";

export function TeacherSecondaryPage({
  activeNav,
  dashboard,
  profile,
  eyebrow,
  title,
  description,
  children
}: {
  activeNav: string;
  dashboard: DashboardData;
  profile: {
    name: string;
    email: string;
    avatarUrl?: string;
    initials: string;
  };
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <TeacherShell
      activeNav={activeNav}
      profile={profile}
      alerts={dashboard.teacherDashboard.alerts}
      rightRail={
        <>
          <section className="rounded-[2rem] bg-white/88 p-5 shadow-[0_18px_50px_rgba(95,73,166,0.09)]">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-[#948aad]">Teacher profile</p>
            <div className="mt-5 flex items-center gap-4">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="h-16 w-16 rounded-full object-cover ring-4 ring-[#f7f2ff]"
                />
              ) : (
                <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-[#ffd4dc] via-[#ffe6f0] to-[#ece4ff] text-xl font-semibold text-[#3a2c62]">
                  {profile.initials}
                </div>
              )}
              <div>
                <p className="text-lg font-semibold text-[#201936]">{profile.name}</p>
                <p className="text-sm text-[#7a7196]">{profile.email}</p>
              </div>
            </div>
            <div className="mt-5">
              <SignOutButton />
            </div>
          </section>

          <section className="rounded-[2rem] bg-white/88 p-5 shadow-[0_18px_50px_rgba(95,73,166,0.09)]">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-[#948aad]">Workspace note</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[#1a1630]">
              {dashboard.teacherDashboard.alerts.length} active alerts
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#6d6585]">
              This page sits inside the same teacher shell, so dashboard alerts and class context stay connected while you move through the workspace.
            </p>
          </section>
        </>
      }
    >
      <section className="rounded-[2rem] bg-white p-6 shadow-[0_18px_50px_rgba(95,73,166,0.09)]">
        <p className="text-sm font-medium uppercase tracking-[0.28em] text-[#948aad]">{eyebrow}</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[#1a1630]">{title}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#6d6585]">{description}</p>
      </section>

      <div className="mt-5">{children}</div>
    </TeacherShell>
  );
}
