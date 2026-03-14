import type { DashboardData } from "@skillzy/types";
import { describe, expect, it } from "vitest";
import { buildTeacherDashboardViewModel } from "./teacher-dashboard-model";

const dashboard: DashboardData = {
  teacher: {
    id: "teacher_1",
    name: "Adeline Watson",
    email: "adeline@example.com",
    provider: "google",
    role: "teacher"
  },
  auth: {
    user: null,
    authenticated: true,
    provider: "google"
  },
  classes: [
    {
      id: "class_1",
      teacherId: "teacher_1",
      name: "Product Design Tutorial",
      subject: "Design",
      gradeLevel: "Beginner",
      createdAt: "2026-03-10T10:00:00.000Z"
    },
    {
      id: "class_2",
      teacherId: "teacher_1",
      name: "UX Research",
      subject: "Research",
      gradeLevel: "Intermediate",
      createdAt: "2026-03-10T10:00:00.000Z"
    }
  ],
  rosters: [
    {
      id: "roster_1",
      classId: "class_1",
      displayName: "Ava",
      participationScore: 90,
      streak: 3,
      createdAt: "2026-03-10T10:00:00.000Z"
    }
  ],
  decks: [
    {
      id: "deck_1",
      classId: "class_1",
      title: "Sprint Basics",
      description: "Run a clean sprint intro.",
      heroGradient: "",
      source: "manual",
      createdAt: "2026-03-10T10:00:00.000Z",
      updatedAt: "2026-03-10T10:00:00.000Z"
    }
  ],
  sessions: [
    {
      id: "session_1",
      deckId: "deck_1",
      classId: "class_1",
      joinCode: "1234",
      status: "draft",
      currentSlideIndex: 0,
      revealResults: false,
      createdAt: "2026-03-10T10:00:00.000Z",
      updatedAt: "2026-03-10T10:00:00.000Z"
    }
  ],
  templates: [],
  imports: [],
  teacherDashboard: {
    profile: {
      name: "Adeline Watson",
      email: "adeline@example.com",
      providerLabel: "Google workspace",
      membershipLabel: "Teacher member",
      setupChecks: []
    },
    metrics: [],
    alerts: [],
    activity: [],
    tasks: [
      {
        id: "task_1",
        title: "Launch your next live session",
        detail: "A draft session is ready.",
        href: "/teacher",
        actionLabel: "Open dashboard",
        status: "ready"
      }
    ],
    classRows: [
      {
        classId: "class_1",
        name: "Product Design Tutorial",
        subject: "Design",
        gradeLevel: "Beginner",
        rosterCount: 1,
        deckCount: 1,
        sessionCount: 1,
        progressPercent: 70,
        progressLabel: "70% teaching flow",
        status: "ready",
        timeLabel: "Updated Mar 10"
      },
      {
        classId: "class_2",
        name: "UX Research",
        subject: "Research",
        gradeLevel: "Intermediate",
        rosterCount: 0,
        deckCount: 0,
        sessionCount: 0,
        progressPercent: 12,
        progressLabel: "Setup in progress",
        status: "needs-setup",
        timeLabel: "Roster not added yet"
      }
    ],
    hero: {
      eyebrow: "Teacher studio",
      title: "Upgrade your teaching flow.",
      description: "Shape your next session.",
      accentLabel: "Skillzy workspace",
      primaryActionLabel: "Create deck",
      primaryActionHref: "/teacher",
      secondaryActionLabel: "Reports",
      secondaryActionHref: "/teacher/reports"
    }
  }
};

describe("teacher dashboard view model", () => {
  it("scopes decks and class rows to the selected class", () => {
    const viewModel = buildTeacherDashboardViewModel({
      dashboard,
      selectedClassId: "class_1",
      searchTerm: ""
    });

    expect(viewModel.visibleDecks).toHaveLength(1);
    expect(viewModel.visibleClassRows).toHaveLength(1);
    expect(viewModel.metrics[1].label).toBe("Decks in class");
  });

  it("filters content by search term", () => {
    const viewModel = buildTeacherDashboardViewModel({
      dashboard,
      selectedClassId: "",
      searchTerm: "research"
    });

    expect(viewModel.visibleClassRows).toHaveLength(1);
    expect(viewModel.visibleClassRows[0]?.classId).toBe("class_2");
  });
});
