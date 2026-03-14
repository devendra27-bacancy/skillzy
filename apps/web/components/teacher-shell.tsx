"use client";

import clsx from "clsx";
import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import type { TeacherDashboardAlert } from "@skillzy/types";

type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: ReactNode;
  stub?: boolean;
};

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/teacher", icon: <GridIcon /> },
  { id: "new-session", label: "New Session", href: "/teacher/new-session", icon: <PlayIcon /> },
  { id: "templates", label: "Templates", href: "/teacher/templates", icon: <StackIcon /> },
  { id: "settings", label: "Settings", href: "/teacher/settings", icon: <CogIcon /> },
  { id: "reports", label: "Reports", href: "/teacher/reports", icon: <ChartIcon />, stub: true }
];

export function TeacherShell({
  activeNav,
  profile,
  alerts,
  headerAction,
  children,
  rightRail
}: {
  activeNav: string;
  profile: {
    name: string;
    email: string;
    avatarUrl?: string;
    initials: string;
  };
  alerts: TeacherDashboardAlert[];
  headerAction?: ReactNode;
  children: ReactNode;
  rightRail?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#ece5ff] text-[#16131f]">
      <div
        className={clsx(
          "mx-auto min-h-screen max-w-[1500px] gap-4 bg-[#f7f5ff] p-3 shadow-[0_30px_120px_rgba(94,69,169,0.12)] lg:p-4",
          rightRail
            ? "grid lg:grid-cols-[260px_minmax(0,1fr)_320px]"
            : "grid lg:grid-cols-[240px_minmax(0,1fr)]"
        )}
      >
        <aside className="flex flex-col justify-between rounded-[2rem] bg-white/85 p-5 shadow-[0_18px_50px_rgba(95,73,166,0.09)]">
          <div>
            <Link href="/teacher" className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#f4eeff] via-[#ede4ff] to-[#fff4e4] shadow-inner">
                <div className="relative h-7 w-7 overflow-hidden rounded-xl">
                  <Image
                    src="/branding/skillzy-mascot-mark.svg"
                    alt="Skillzy"
                    fill
                    sizes="28px"
                    className="object-contain"
                  />
                </div>
              </div>
              <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.34em] text-[#8d87a7]">Skillzy</p>
                <p className="text-xl font-semibold tracking-tight">Teacher Studio</p>
              </div>
            </Link>

            <nav className="mt-8 space-y-1.5">
              {navItems.map((item) => {
                const isActive = item.id === activeNav;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={clsx(
                      "flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition",
                      isActive
                        ? "bg-gradient-to-r from-[#8f66ff] to-[#7452ff] text-white shadow-[0_16px_40px_rgba(120,89,255,0.28)]"
                        : "text-[#4c4567] hover:bg-[#f3eeff]"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span className={clsx(isActive ? "text-white" : "text-[#746b95]")}>{item.icon}</span>
                      {item.label}
                    </span>
                    {item.stub ? (
                      <span
                        className={clsx(
                          "rounded-full px-2 py-0.5 text-[0.58rem] uppercase tracking-[0.14em]",
                          isActive ? "bg-white/20 text-white/90" : "bg-[#efe9ff] text-[#8c7cb3]"
                        )}
                      >
                        soon
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="rounded-[1.5rem] border border-[#eee7ff] bg-[#faf7ff] p-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#948aad]">Workspace</p>
            <p className="mt-3 text-sm leading-6 text-[#6d6585]">
              Launch a live session, reuse a template, and keep lesson delivery moving from one place.
            </p>
          </div>
        </aside>

        <section className="min-w-0 rounded-[2rem] bg-white/82 p-4 shadow-[0_18px_50px_rgba(95,73,166,0.09)] sm:p-5">
          <div className="flex flex-col gap-4 border-b border-[#efe9ff] pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#9288b2]">Teacher workspace</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#1a1630] sm:text-[2.4rem]">
                {activeNav === "dashboard" ? "Dashboard" : profile.name.split(" ")[0]}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68607f]">
                Keep sessions, templates, and settings aligned without leaving the studio.
              </p>
            </div>
            {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
          </div>

          <div className="pt-5">{children}</div>
        </section>

        {rightRail ? <aside className="space-y-4">{rightRail}</aside> : null}
      </div>
    </div>
  );
}

function iconPath(path: ReactNode) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      {path}
    </svg>
  );
}

function GridIcon() {
  return iconPath(
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </>
  );
}

function BookIcon() {
  return iconPath(
    <>
      <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4H19v15H7.5A2.5 2.5 0 0 0 5 21V6.5Z" />
      <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4H19" />
      <path d="M12 7v9" />
    </>
  );
}

function StackIcon() {
  return iconPath(
    <>
      <path d="M12 4 4 8l8 4 8-4-8-4Z" />
      <path d="m4 12 8 4 8-4" />
      <path d="m4 16 8 4 8-4" />
    </>
  );
}

function PlayIcon() {
  return iconPath(
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m10 8 6 4-6 4V8Z" fill="currentColor" stroke="none" />
    </>
  );
}

function ChartIcon() {
  return iconPath(
    <>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20v-4" />
    </>
  );
}

function CogIcon() {
  return iconPath(
    <>
      <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5A3.5 3.5 0 1 0 12 8.5Z" />
      <path d="m19.4 15-.7 1.2 1.1 2-2 2-2-1.1-1.2.7-1 2.2h-2.8l-1-2.2-1.2-.7-2 1.1-2-2 1.1-2-.7-1.2-2.2-1v-2.8l2.2-1 .7-1.2-1.1-2 2-2 2 1.1 1.2-.7 1-2.2h2.8l1 2.2 1.2.7 2-1.1 2 2-1.1 2 .7 1.2 2.2 1v2.8Z" />
    </>
  );
}
