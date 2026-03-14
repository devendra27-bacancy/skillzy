"use client";

import type { DashboardData, DeckBundle, Session } from "@skillzy/types";
import Link from "next/link";
import { useMemo, useState } from "react";
import { mergeTeacherProfile } from "./teacher-dashboard-model";
import { SignOutButton } from "./sign-out-button";
import { TeacherShell } from "./teacher-shell";

interface DashboardProps {
  dashboard: DashboardData;
  bundles: DeckBundle[];
  authProfile: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

type SessionRow = {
  session: Session;
  deckTitle: string;
  questionCount: number;
  studentCount: number;
  startedLabel: string;
};

function formatSessionDate(value?: string) {
  if (!value) return "Not started yet";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function TeacherDashboard({ dashboard, bundles, authProfile }: DashboardProps) {
  const profile = useMemo(
    () => mergeTeacherProfile(dashboard, authProfile),
    [authProfile, dashboard]
  );
  const [statusFilter, setStatusFilter] = useState<"all" | Session["status"]>("all");

  const sessionRows = useMemo<SessionRow[]>(
    () =>
      dashboard.sessions
        .filter((session) => session.status !== "deleted")
        .map((session) => {
          const bundle = bundles.find((item) => item.deck.id === session.deckId);
          const snapshot = dashboard.teacherDashboard.classRows.find(
            (row) => row.classId === session.classId
          );
          return {
            session,
            deckTitle: bundle?.deck.title ?? session.title ?? "Untitled session",
            questionCount: bundle?.questions.length ?? 0,
            studentCount: snapshot?.rosterCount ?? 0,
            startedLabel: formatSessionDate(session.startedAt ?? session.createdAt)
          };
        })
        .sort((left, right) => {
          const leftTime = new Date(left.session.updatedAt).getTime();
          const rightTime = new Date(right.session.updatedAt).getTime();
          return rightTime - leftTime;
        }),
    [bundles, dashboard.sessions, dashboard.teacherDashboard.classRows]
  );

  const filteredSessions =
    statusFilter === "all"
      ? sessionRows
      : sessionRows.filter((row) => row.session.status === statusFilter);

  const draftDecks = bundles.filter((bundle) => bundle.questions.length === 0);

  return (
    <TeacherShell
      activeNav="dashboard"
      profile={profile}
      alerts={dashboard.teacherDashboard.alerts}
      headerAction={<SignOutButton />}
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[1.8rem] bg-white p-6 shadow-[0_18px_50px_rgba(95,73,166,0.09)]">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#9288b2]">
              Session overview
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#1a1630]">
              {sessionRows.length > 0 ? "Pick up your latest live work" : "Start your first live session"}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#68607f]">
              This teacher home is now session-first: create a live lesson, reuse a template, and move straight into presenting.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/teacher/new-session"
                className="rounded-full bg-[#8b62ff] px-5 py-3 text-sm font-semibold text-white"
              >
                New session
              </Link>
              <Link
                href="/teacher/templates"
                className="rounded-full border border-[#ebe4ff] px-5 py-3 text-sm font-semibold text-[#2d2446]"
              >
                Browse templates
              </Link>
            </div>
          </div>

          <div className="rounded-[1.8rem] bg-white p-6 shadow-[0_18px_50px_rgba(95,73,166,0.09)]">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#9288b2]">Quick counts</p>
            <dl className="mt-5 space-y-4">
              <Metric label="Sessions" value={sessionRows.length.toString()} />
              <Metric label="Templates" value={dashboard.templates.length.toString()} />
              <Metric label="Classes" value={dashboard.classes.length.toString()} />
            </dl>
          </div>
        </section>

        {sessionRows.length === 0 ? (
          <section className="rounded-[1.8rem] bg-white p-6 shadow-[0_18px_50px_rgba(95,73,166,0.09)]">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#9288b2]">Sample preview</p>
            <div className="mt-5 overflow-hidden rounded-[1.6rem] border border-[#efe9ff] bg-[#faf7ff]">
              <div className="grid gap-4 border-b border-[#efe9ff] px-5 py-4 sm:grid-cols-[1.4fr_repeat(4,0.7fr)]">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#988eaf]">Session</span>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#988eaf]">Status</span>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#988eaf]">Date</span>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#988eaf]">Questions</span>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#988eaf]">Students</span>
              </div>
              <div className="grid gap-4 px-5 py-5 text-sm text-[#4d4765] sm:grid-cols-[1.4fr_repeat(4,0.7fr)]">
                <div>
                  <p className="font-semibold text-[#211b35]">Design sprint warm-up</p>
                  <p className="mt-1 text-[#7a7196]">Example of how your sessions will appear here.</p>
                </div>
                <StatusBadge status="draft" />
                <span>Today</span>
                <span>3</span>
                <span>24</span>
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-[1.8rem] bg-white p-6 shadow-[0_18px_50px_rgba(95,73,166,0.09)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#9288b2]">Session list</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#1a1630]">
                Recent classroom sessions
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", "draft", "waiting", "live", "ended"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setStatusFilter(item)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    statusFilter === item ? "bg-[#8b62ff] text-white" : "bg-[#f4f0ff] text-[#6f6787]"
                  }`}
                >
                  {item === "all" ? "All" : item}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-[1.6rem] border border-[#efe9ff]">
            <div className="hidden border-b border-[#efe9ff] bg-[#faf7ff] px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#988eaf] sm:grid sm:grid-cols-[1.5fr_0.8fr_1fr_0.8fr_0.8fr_0.9fr]">
              <span>Session</span>
              <span>Status</span>
              <span>Date</span>
              <span>Questions</span>
              <span>Students</span>
              <span>Open</span>
            </div>

            {filteredSessions.length > 0 ? (
              filteredSessions.map((row) => (
                <div
                  key={row.session.id}
                  className="grid gap-3 border-b border-[#f3eeff] px-5 py-4 text-sm text-[#4d4765] last:border-b-0 sm:grid-cols-[1.5fr_0.8fr_1fr_0.8fr_0.8fr_0.9fr] sm:items-center"
                >
                  <div>
                    <p className="font-semibold text-[#211b35]">{row.deckTitle}</p>
                    <p className="mt-1 text-[#7a7196]">Join code {row.session.joinCode}</p>
                  </div>
                  <StatusBadge status={row.session.status} />
                  <span>{row.startedLabel}</span>
                  <span>{row.questionCount}</span>
                  <span>{row.studentCount}</span>
                  <Link
                    href={`/teacher/sessions/${row.session.id}`}
                    className="inline-flex rounded-full border border-[#ebe4ff] px-4 py-2.5 text-sm font-semibold text-[#2d2446]"
                  >
                    Open
                  </Link>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-sm text-[#6f6787]">
                No sessions in this filter yet.
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[1.8rem] bg-white p-6 shadow-[0_18px_50px_rgba(95,73,166,0.09)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#9288b2]">Templates</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#1a1630]">
                  Reuse what already works
                </h3>
              </div>
              <Link href="/teacher/templates" className="text-sm font-semibold text-[#6f49ff]">
                See all
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {dashboard.templates.slice(0, 3).map((template) => (
                <div
                  key={template.id}
                  className="rounded-[1.3rem] border border-[#f1ebff] bg-[#fbf9ff] p-4"
                >
                  <p className="font-semibold text-[#201936]">{template.title}</p>
                  <p className="mt-1 text-sm text-[#6d6585]">{template.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.8rem] bg-white p-6 shadow-[0_18px_50px_rgba(95,73,166,0.09)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#9288b2]">Draft decks</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#1a1630]">
                  Finish your session-ready material
                </h3>
              </div>
              <Link href="/teacher/templates" className="text-sm font-semibold text-[#6f49ff]">
                Open templates
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {draftDecks.length > 0 ? (
                draftDecks.slice(0, 3).map((bundle) => (
                  <div
                    key={bundle.deck.id}
                    className="flex items-center justify-between gap-3 rounded-[1.3rem] border border-[#f1ebff] bg-[#fbf9ff] p-4"
                  >
                    <div>
                      <p className="font-semibold text-[#201936]">{bundle.deck.title}</p>
                      <p className="mt-1 text-sm text-[#6d6585]">
                        {bundle.slides.length} slides, {bundle.questions.length} questions
                      </p>
                    </div>
                    <Link
                      href={`/teacher/decks/${bundle.deck.id}`}
                      className="rounded-full border border-[#ebe4ff] px-4 py-2.5 text-sm font-semibold text-[#2d2446]"
                    >
                      Edit
                    </Link>
                  </div>
                ))
              ) : (
                <p className="rounded-[1.3rem] border border-dashed border-[#e2d9ff] bg-[#faf7ff] px-4 py-5 text-sm text-[#706885]">
                  Every deck currently has at least one question attached.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </TeacherShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[1.2rem] bg-[#faf7ff] px-4 py-3">
      <dt className="text-sm text-[#6d6585]">{label}</dt>
      <dd className="text-lg font-semibold text-[#1a1630]">{value}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: Session["status"] }) {
  const tone =
    status === "live"
      ? "bg-[#e6fbf0] text-[#249461]"
      : status === "ended"
        ? "bg-[#f0edff] text-[#6b54d6]"
        : status === "waiting"
          ? "bg-[#fff5e7] text-[#cb7b18]"
          : "bg-[#f6f2ff] text-[#6f6787]";

  return (
    <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${tone}`}>
      {status}
    </span>
  );
}
