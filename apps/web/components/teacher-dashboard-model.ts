import type {
  ClassRoom,
  DashboardData,
  Deck,
  Session,
  TeacherClassRow,
  TeacherDashboardAlert,
  TeacherDashboardMetric,
  TeacherDashboardTask,
  TeacherHeroSpotlight,
  TeacherProfileSummary
} from "@skillzy/types";

export interface TeacherDashboardProfile extends TeacherProfileSummary {
  initials: string;
}

export interface TeacherDashboardViewModel {
  selectedClass: ClassRoom | null;
  visibleClassRows: TeacherClassRow[];
  visibleDecks: Deck[];
  visibleSessions: Session[];
  metrics: TeacherDashboardMetric[];
  tasks: TeacherDashboardTask[];
  alerts: TeacherDashboardAlert[];
  hero: TeacherHeroSpotlight;
}

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function mergeTeacherProfile(
  dashboard: DashboardData,
  authProfile: {
    name: string;
    email: string;
    avatarUrl?: string;
  }
): TeacherDashboardProfile {
  return {
    ...dashboard.teacherDashboard.profile,
    name: authProfile.name,
    email: authProfile.email,
    avatarUrl: authProfile.avatarUrl ?? dashboard.teacherDashboard.profile.avatarUrl,
    providerLabel: "Google workspace",
    initials: initialsFromName(authProfile.name || "Teacher")
  };
}

function includesNeedle(value: string, needle: string) {
  return value.toLowerCase().includes(needle);
}

function cloneHero(hero: TeacherHeroSpotlight): TeacherHeroSpotlight {
  return { ...hero };
}

export function buildTeacherDashboardViewModel({
  dashboard,
  selectedClassId,
  searchTerm
}: {
  dashboard: DashboardData;
  selectedClassId: string;
  searchTerm: string;
}): TeacherDashboardViewModel {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const selectedClass = dashboard.classes.find((item) => item.id === selectedClassId) ?? null;
  const visibleDecks = dashboard.decks.filter((deck) => {
    const classMatch = selectedClassId ? deck.classId === selectedClassId : true;
    const searchMatch =
      normalizedSearch.length === 0 ||
      includesNeedle(deck.title, normalizedSearch) ||
      includesNeedle(deck.description, normalizedSearch);
    return classMatch && searchMatch;
  });
  const visibleSessions = dashboard.sessions.filter((session) => {
    const classMatch = selectedClassId ? session.classId === selectedClassId : true;
    const deck = dashboard.decks.find((item) => item.id === session.deckId);
    const searchMatch =
      normalizedSearch.length === 0 ||
      includesNeedle(session.joinCode, normalizedSearch) ||
      includesNeedle(session.status, normalizedSearch) ||
      includesNeedle(deck?.title ?? "", normalizedSearch);
    return classMatch && searchMatch;
  });
  const visibleClassRows = dashboard.teacherDashboard.classRows.filter((row) => {
    const classMatch = selectedClassId ? row.classId === selectedClassId : true;
    const searchMatch =
      normalizedSearch.length === 0 ||
      includesNeedle(row.name, normalizedSearch) ||
      includesNeedle(row.subject, normalizedSearch) ||
      includesNeedle(row.gradeLevel ?? "", normalizedSearch);
    return classMatch && searchMatch;
  });

  const activeRow =
    visibleClassRows[0] ??
    dashboard.teacherDashboard.classRows.find((row) => row.classId === selectedClassId) ??
    null;
  const activeClassDecks = dashboard.decks.filter((deck) => deck.classId === (selectedClassId || activeRow?.classId));
  const activeClassSessions = dashboard.sessions.filter(
    (session) => session.classId === (selectedClassId || activeRow?.classId)
  );
  const engagedRoster = dashboard.rosters.filter(
    (student) => student.classId === (selectedClassId || activeRow?.classId) && student.participationScore > 0
  );

  const metrics: TeacherDashboardMetric[] = [
    {
      id: "classes",
      label: selectedClass ? "Class focus" : "Active classes",
      value: selectedClass ? "1" : String(dashboard.classes.length),
      helper: selectedClass ? selectedClass.subject : dashboard.teacherDashboard.metrics[0]?.helper ?? "",
      tone: "amber"
    },
    {
      id: "decks",
      label: selectedClass ? "Decks in class" : "Decks ready",
      value: String(selectedClass ? activeClassDecks.length : dashboard.decks.length),
      helper: selectedClass ? `${activeClassDecks.length} deck${activeClassDecks.length === 1 ? "" : "s"} attached` : "Interactive lessons on standby",
      tone: "mint"
    },
    {
      id: "sessions",
      label: selectedClass ? "Sessions launched" : "Live this week",
      value: String(selectedClass ? activeClassSessions.length : dashboard.sessions.filter((session) => session.status !== "draft").length),
      helper: selectedClass
        ? activeClassSessions.some((session) => session.status === "live")
          ? "A session is live right now"
          : "No live session at the moment"
        : dashboard.teacherDashboard.metrics[2]?.helper ?? "",
      tone: "sky"
    },
    {
      id: "participation",
      label: selectedClass ? "Engaged learners" : "Participation",
      value: selectedClass
        ? `${engagedRoster.length}`
        : dashboard.teacherDashboard.metrics[3]?.value ?? "0%",
      helper: selectedClass
        ? `${engagedRoster.length} learner${engagedRoster.length === 1 ? "" : "s"} showing activity`
        : dashboard.teacherDashboard.metrics[3]?.helper ?? "",
      tone: "violet"
    }
  ];

  const alerts = dashboard.teacherDashboard.alerts.filter((alert) => {
    if (normalizedSearch.length === 0) return true;
    return (
      includesNeedle(alert.title, normalizedSearch) ||
      includesNeedle(alert.message, normalizedSearch)
    );
  });

  let hero = cloneHero(dashboard.teacherDashboard.hero);
  if (selectedClass && activeRow) {
    const liveSession = activeClassSessions.find((session) => session.status === "live");
    if (liveSession) {
      hero = {
        eyebrow: "CLASSROOM LIVE",
        title: `${selectedClass.name} is active and ready for teacher moves.`,
        description: "Open the live board, reveal results, and keep your class energy moving.",
        accentLabel: `Join code ${liveSession.joinCode}`,
        primaryActionLabel: "Open live board",
        primaryActionHref: `/teacher/sessions/${liveSession.id}`,
        secondaryActionLabel: "View reports",
        secondaryActionHref: "/teacher/reports"
      };
    } else if (activeClassDecks.length === 0) {
      hero = {
        eyebrow: "BUILD THE LESSON",
        title: `Create the first deck for ${selectedClass.name}.`,
        description: "Start from a template and turn this class into a fully interactive workspace.",
        accentLabel: selectedClass.subject,
        primaryActionLabel: "Create deck",
        primaryActionHref: "/teacher",
        secondaryActionLabel: "Manage classes",
        secondaryActionHref: "/teacher/classes"
      };
    } else {
      const recentDeck = activeClassDecks
        .slice()
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
      hero = {
        eyebrow: "CLASS FOCUS",
        title: `Keep ${selectedClass.name} moving with confident teacher flow.`,
        description: "Continue refining the lesson, launch a session, or open reports for this class.",
        accentLabel: activeRow.progressLabel,
        primaryActionLabel: recentDeck ? "Continue editing" : "Open class",
        primaryActionHref: recentDeck ? `/teacher/decks/${recentDeck.id}` : "/teacher/classes",
        secondaryActionLabel: activeClassSessions.length > 0 ? "Open reports" : "Launch session",
        secondaryActionHref:
          activeClassSessions.length > 0 ? "/teacher/reports" : "/teacher"
      };
    }
  }

  const tasks = dashboard.teacherDashboard.tasks.filter((task) => {
    const textMatch =
      normalizedSearch.length === 0 ||
      includesNeedle(task.title, normalizedSearch) ||
      includesNeedle(task.detail, normalizedSearch);
    if (!textMatch) return false;
    if (!selectedClass) return true;

    return (
      task.href.includes(selectedClass.id) ||
      task.title.toLowerCase().includes(selectedClass.name.toLowerCase()) ||
      task.detail.toLowerCase().includes(selectedClass.name.toLowerCase()) ||
      task.href === "/teacher" ||
      task.href === "/teacher/reports"
    );
  });

  return {
    selectedClass,
    visibleClassRows,
    visibleDecks,
    visibleSessions,
    metrics,
    tasks,
    alerts,
    hero
  };
}
