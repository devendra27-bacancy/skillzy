"use client";

import type { DashboardData } from "@skillzy/types";
import type { ReactNode } from "react";
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
