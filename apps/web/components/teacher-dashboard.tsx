"use client";

import type { DashboardData, DeckBundle, Session } from "@skillzy/types";
import Link from "next/link";
import { useMemo, useState } from "react";
import { api } from "../lib/api";
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
  const [search, setSearch] = useState("");
  const [sessionRowsState, setSessionRowsState] = useState<SessionRow[]>([]);
  const [endingSessionId, setEndingSessionId] = useState<string | null>(null);

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
  const effectiveSessionRows = sessionRowsState.length > 0 ? sessionRowsState : sessionRows;

  const filteredSessions =
    statusFilter === "all"
      ? effectiveSessionRows
      : effectiveSessionRows.filter((row) => row.session.status === statusFilter);
  const visibleSessions = filteredSessions.filter((row) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      row.deckTitle.toLowerCase().includes(query) ||
      row.session.joinCode.toLowerCase().includes(query) ||
      row.session.status.toLowerCase().includes(query)
    );
  });

  const draftDecks = bundles.filter((bundle) => bundle.questions.length === 0);
  const liveSession = effectiveSessionRows.find((row) => row.session.status === "live");
  const latestDraft = effectiveSessionRows.find((row) => row.session.status === "draft" || row.session.status === "waiting");

  async function handleEndSession(sessionId: string) {
    setEndingSessionId(sessionId);
    try {
      await api.endSession(sessionId);
      setSessionRowsState((current) => {
        const source = current.length > 0 ? current : sessionRows;
        return source.map((row) =>
          row.session.id === sessionId
            ? {
                ...row,
                session: {
                  ...row.session,
                  status: "ended",
                  revealResults: true,
                  endedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                },
                startedLabel: formatSessionDate(new Date().toISOString())
              }
            : row
        );
      });
    } finally {
      setEndingSessionId(null);
    }
  }

  return (
    <TeacherShell
      activeNav="dashboard"
      profile={profile}
      alerts={dashboard.teacherDashboard.alerts}
      headerAction={<SignOutButton />}
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-[1.8rem] bg-white p-6 shadow-[0_18px_50px_rgba(95,73,166,0.09)]">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#9288b2]">
              Session overview
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#1a1630]">
              {effectiveSessionRows.length > 0 ? "Run your next live session" : "Start your first live session"}
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
              {liveSession ? (
                <Link
                  href={`/teacher/sessions/${liveSession.session.id}`}
                  className="rounded-full border border-[#ebe4ff] px-5 py-3 text-sm font-semibold text-[#2d2446]"
                >
                  Resume live session
                </Link>
              ) : null}
              {!liveSession && latestDraft ? (
                <Link
                  href={`/teacher/sessions/${latestDraft.session.id}`}
                  className="rounded-full border border-[#ebe4ff] px-5 py-3 text-sm font-semibold text-[#2d2446]"
                >
                  Continue latest draft
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-[1.8rem] bg-white p-6 shadow-[0_18px_50px_rgba(95,73,166,0.09)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#9288b2]">Session list</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#1a1630]">
                Recent classroom sessions
              </h2>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title, code, or status"
                className="w-full rounded-full border border-[#ebe4ff] bg-white px-4 py-2.5 text-sm text-[#2d2446] outline-none sm:w-72"
              />
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
          </div>

          <div className="mt-5 overflow-hidden rounded-[1.6rem] border border-[#efe9ff]">
            <div className="hidden border-b border-[#efe9ff] bg-[#faf7ff] px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#988eaf] sm:grid sm:grid-cols-[1.5fr_0.8fr_1fr_0.8fr_0.8fr_1.2fr]">
              <span>Session</span>
              <span>Status</span>
              <span>Date</span>
              <span>Questions</span>
              <span>Students</span>
              <span>Actions</span>
            </div>

            {visibleSessions.length > 0 ? (
              visibleSessions.map((row) => (
                <div
                  key={row.session.id}
                  className="grid gap-3 border-b border-[#f3eeff] px-5 py-4 text-sm text-[#4d4765] last:border-b-0 sm:grid-cols-[1.5fr_0.8fr_1fr_0.8fr_0.8fr_1.2fr] sm:items-center"
                >
                  <div>
                    <p className="font-semibold text-[#211b35]">{row.deckTitle}</p>
                    <p className="mt-1 text-[#7a7196]">Join code {row.session.joinCode}</p>
                  </div>
                  <StatusBadge status={row.session.status} />
                  <span>{row.startedLabel}</span>
                  <span>{row.questionCount}</span>
                  <span>{row.studentCount}</span>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/teacher/sessions/${row.session.id}`}
                      className="inline-flex rounded-full border border-[#ebe4ff] px-4 py-2.5 text-sm font-semibold text-[#2d2446]"
                    >
                      Open
                    </Link>
                    {row.session.status === "live" || row.session.status === "waiting" ? (
                      <button
                        onClick={() => handleEndSession(row.session.id)}
                        disabled={endingSessionId === row.session.id}
                        className="inline-flex rounded-full border border-[#f1d4cf] px-4 py-2.5 text-sm font-semibold text-[#b24d38] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {endingSessionId === row.session.id ? "Ending..." : "End"}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-sm text-[#6f6787]">
                No sessions match this filter yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </TeacherShell>
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
