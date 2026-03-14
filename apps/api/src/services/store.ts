import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type {
  AiAnalysisResult,
  AuthSession,
  ClassRoom,
  CreateClassInput,
  CreateDeckInput,
  CreateLessonTemplateInput,
  CreateQuestionInput,
  CreateSessionInput,
  CreateSlideInput,
  DashboardData,
  Deck,
  DeckBundle,
  DragRankQuestion,
  DrawingQuestion,
  ImageHotspotQuestion,
  ImportJob,
  JoinSessionInput,
  LessonTemplate,
  Participant,
  Question,
  RatingScaleQuestion,
  RosterStudent,
  Session as SkillzySession,
  SessionExport,
  SessionReplayEvent,
  SessionSnapshot,
  Slide,
  StudentResponse,
  SubmitResponseInput,
  TeacherClassRow,
  TeacherDashboardActivityPoint,
  TeacherDashboardAlert,
  TeacherDashboardMetric,
  TeacherDashboardSummary,
  TeacherDashboardTask,
  TeacherHeroSpotlight,
  TeacherProfileSummary,
  TemplateSlide,
  TextQuestion,
  UpdateDeckInput,
  UpdateQuestionInput,
  UpdateSlideInput,
  User
} from "@skillzy/types";
import { getApiEnv } from "../config/env";
import { createId, createJoinCode } from "../utils/id";

const now = () => new Date().toISOString();
const dataPath = join(process.cwd(), "data", "skillzy-store.json");
const appStateId = "primary";

type StoreState = {
  users: User[];
  authSession: AuthSession;
  classes: ClassRoom[];
  rosters: RosterStudent[];
  decks: Deck[];
  slides: Slide[];
  questions: Question[];
  sessions: SkillzySession[];
  participants: Participant[];
  responses: StudentResponse[];
  replayEvents: SessionReplayEvent[];
  exports: SessionExport[];
  templates: LessonTemplate[];
  imports: ImportJob[];
  lmsSync: DashboardData["teacher"][];
  aiResults: AiAnalysisResult[];
};

interface StoreBackend {
  loadState(): Promise<StoreState>;
  saveState(state: StoreState): Promise<void>;
}

const demoTeacher: User = {
  id: "teacher_demo",
  name: "Franco Mercer",
  email: "franco@skillzy.dev",
  provider: "demo",
  role: "teacher",
  avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&q=80"
};

const demoClass: ClassRoom = {
  id: "class_design_101",
  teacherId: demoTeacher.id,
  name: "Design Sprint Foundations",
  subject: "Product Design",
  gradeLevel: "University",
  createdAt: now()
};

const demoRoster: RosterStudent[] = [
  {
    id: "roster_ava",
    classId: demoClass.id,
    displayName: "Ava Chen",
    email: "ava@student.skillzy.dev",
    participationScore: 94,
    streak: 5,
    createdAt: now()
  },
  {
    id: "roster_miguel",
    classId: demoClass.id,
    displayName: "Miguel Stone",
    email: "miguel@student.skillzy.dev",
    participationScore: 88,
    streak: 3,
    createdAt: now()
  }
];

const demoDeck: Deck = {
  id: "deck_sprint_intro",
  classId: demoClass.id,
  title: "Step Design Sprint For Beginners",
  description: "A structured beginner lesson with live check-ins and creative participation.",
  heroGradient: "linear-gradient(135deg, #2b241d 0%, #564739 100%)",
  source: "template",
  templateId: "template_design_sprint",
  createdAt: now(),
  updatedAt: now()
};

const templateLibrary: LessonTemplate[] = [
  {
    id: "template_design_sprint",
    title: "Design Sprint Kickoff",
    description: "Warm up a product design class with confidence checks and creative ideation.",
    subject: "Product Design",
    gradeBand: "University",
    heroGradient: "linear-gradient(135deg, #2b241d 0%, #564739 100%)",
    slides: [
      {
        id: "template_slide_1",
        title: "Learn To Be Best Designer With Franco",
        body: "Welcome students and set the sprint context."
      },
      {
        id: "template_slide_2",
        title: "What makes a sprint effective?",
        body: "Students choose the design sprint trait they think matters most.",
        question: {
          id: "template_question_1",
          type: "multiple-choice",
          prompt: "Which sprint habit helps teams move fastest?",
          anonymous: true,
          config: {
            options: [
              "Rapid prototyping",
              "Long requirement docs",
              "Waiting for perfect data",
              "Working without feedback"
            ],
            allowMultiple: false,
            correctOptionIndexes: [0]
          }
        }
      },
      {
        id: "template_slide_3",
        title: "Confidence check",
        body: "Students rate how confident they feel before building.",
        question: {
          id: "template_question_2",
          type: "rating-scale",
          prompt: "How ready do you feel to prototype in 15 minutes?",
          anonymous: true,
          config: {
            minLabel: "Need examples",
            maxLabel: "Ready now",
            scale: 5
          }
        }
      }
    ]
  },
  {
    id: "template_stem_reflection",
    title: "STEM Reflection Loop",
    description: "Pair quick concept checks with text reflection and ranking.",
    subject: "STEM",
    gradeBand: "K-12",
    heroGradient: "linear-gradient(135deg, #f3e9cf 0%, #fff6df 60%, #f7d87a 100%)",
    slides: [
      {
        id: "template_slide_4",
        title: "What concept feels strongest?",
        body: "Students rate their understanding before group discussion.",
        question: {
          id: "template_question_3",
          type: "rating-scale",
          prompt: "How well do you understand today's lesson?",
          anonymous: true,
          config: {
            minLabel: "Lost",
            maxLabel: "Got it",
            scale: 5
          }
        }
      },
      {
        id: "template_slide_5",
        title: "Rank the solution steps",
        body: "Students order the process from first to last.",
        question: {
          id: "template_question_4",
          type: "drag-rank",
          prompt: "Order the scientific method steps.",
          anonymous: false,
          config: {
            items: ["Observe", "Ask", "Experiment", "Conclude"],
            correctOrder: ["Observe", "Ask", "Experiment", "Conclude"]
          }
        }
      }
    ]
  }
];

class FileStoreBackend implements StoreBackend {
  private ensureDataDir() {
    mkdirSync(dirname(dataPath), { recursive: true });
  }

  async loadState(): Promise<StoreState> {
    this.ensureDataDir();
    if (!existsSync(dataPath)) {
      const seeded = createSeedState();
      writeFileSync(dataPath, JSON.stringify(seeded, null, 2));
      return seeded;
    }

    try {
      return JSON.parse(readFileSync(dataPath, "utf8")) as StoreState;
    } catch {
      const seeded = createSeedState();
      writeFileSync(dataPath, JSON.stringify(seeded, null, 2));
      return seeded;
    }
  }

  async saveState(state: StoreState): Promise<void> {
    this.ensureDataDir();
    writeFileSync(dataPath, JSON.stringify(state, null, 2));
  }
}

class SupabaseStoreBackend implements StoreBackend {
  private client: SupabaseClient;
  private inMemoryFallback: StoreState | null = null;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  async loadState(): Promise<StoreState> {
    if (this.inMemoryFallback) {
      return this.inMemoryFallback;
    }

    try {
      const { data, error } = await this.client
        .from("skillzy_app_state")
        .select("state")
        .eq("id", appStateId)
        .maybeSingle<{ state: StoreState }>();

      if (error) {
        throw error;
      }

      if (!data?.state) {
        const seeded = createSeedState();
        await this.saveState(seeded);
        return seeded;
      }

      return data.state;
    } catch {
      const seeded = createSeedState();
      this.inMemoryFallback = seeded;
      return seeded;
    }
  }

  async saveState(state: StoreState): Promise<void> {
    if (this.inMemoryFallback) {
      this.inMemoryFallback = state;
      return;
    }

    try {
      const { error } = await this.client.from("skillzy_app_state").upsert({
        id: appStateId,
        state,
        updated_at: now()
      });

      if (error) {
        throw error;
      }
    } catch {
      this.inMemoryFallback = state;
    }
  }
}

function buildTemplateQuestion(slideId: string, templateSlide: TemplateSlide): Question | null {
  const templateQuestion = templateSlide.question;
  if (!templateQuestion) return null;
  const base = {
    id: createId("question"),
    slideId,
    prompt: templateQuestion.prompt,
    anonymous: templateQuestion.anonymous,
    type: templateQuestion.type
  };

  switch (templateQuestion.type) {
    case "multiple-choice":
      return {
        ...base,
        type: "multiple-choice",
        options: (templateQuestion.config.options as string[]) ?? [],
        allowMultiple: Boolean(templateQuestion.config.allowMultiple),
        correctOptionIndexes: templateQuestion.config.correctOptionIndexes as number[] | undefined
      };
    case "text":
      return {
        ...base,
        type: "text",
        maxLength: (templateQuestion.config.maxLength as number) ?? 180
      } satisfies TextQuestion;
    case "drawing":
      return {
        ...base,
        type: "drawing",
        placeholder:
          (templateQuestion.config.placeholder as string) ??
          "Use labels, arrows, and rough shapes to explain the idea."
      } satisfies DrawingQuestion;
    case "rating-scale":
      return {
        ...base,
        type: "rating-scale",
        minLabel: (templateQuestion.config.minLabel as string) ?? "Low",
        maxLabel: (templateQuestion.config.maxLabel as string) ?? "High",
        scale: (templateQuestion.config.scale as number) ?? 5
      } satisfies RatingScaleQuestion;
    case "image-hotspot":
      return {
        ...base,
        type: "image-hotspot",
        hotspotLabel: (templateQuestion.config.hotspotLabel as string) ?? "Tap the hotspot",
        imageUrl: templateQuestion.config.imageUrl as string | undefined
      } satisfies ImageHotspotQuestion;
    case "drag-rank":
      return {
        ...base,
        type: "drag-rank",
        items: (templateQuestion.config.items as string[]) ?? [],
        correctOrder: templateQuestion.config.correctOrder as string[] | undefined
      } satisfies DragRankQuestion;
    default:
      return null;
  }
}

function seedDeckFromTemplate(templateId: string, classId: string): DeckBundle | null {
  const template = templateLibrary.find((item) => item.id === templateId);
  if (!template) return null;

  const deck: Deck = {
    id: createId("deck"),
    classId,
    title: template.title,
    description: template.description,
    heroGradient: template.heroGradient,
    source: "template",
    templateId: template.id,
    createdAt: now(),
    updatedAt: now()
  };

  const slides: Slide[] = [];
  const questions: Question[] = [];

  template.slides.forEach((templateSlide, index) => {
    const slideId = createId("slide");
    slides.push({
      id: slideId,
      deckId: deck.id,
      index,
      title: templateSlide.title,
      body: templateSlide.body,
      imageUrl: templateSlide.imageUrl
    });
    const question = buildTemplateQuestion(slideId, templateSlide);
    if (question) questions.push(question);
  });

  return { deck, slides, questions };
}

function createSeedState(): StoreState {
  const seededTemplate = seedDeckFromTemplate("template_design_sprint", demoClass.id);
  const deck = seededTemplate?.deck ?? demoDeck;
  return {
    users: [demoTeacher],
    authSession: {
      user: demoTeacher,
      authenticated: true,
      provider: "demo"
    },
    classes: [demoClass],
    rosters: demoRoster,
    decks: [deck],
    slides:
      seededTemplate?.slides ?? [
        {
          id: "slide_intro",
          deckId: demoDeck.id,
          index: 0,
          title: "Learn To Be Best Designer With Franco",
          body: "Welcome students with a quick pulse-check before we jump into the sprint process."
        }
      ],
    questions:
      seededTemplate?.questions ?? [
        {
          id: "question_text",
          slideId: "slide_intro",
          type: "text",
          prompt: "What real-world problem would you solve with a 5-day sprint?",
          anonymous: true,
          maxLength: 180
        } satisfies TextQuestion
      ],
    sessions: [],
    participants: [],
    responses: [],
    replayEvents: [],
    exports: [],
    templates: templateLibrary,
    imports: [],
    lmsSync: [],
    aiResults: []
  };
}

function normalizeQuestion(input: CreateQuestionInput | UpdateQuestionInput): Question {
  const base = {
    id: "id" in input ? input.id : createId("question"),
    slideId: input.slideId,
    prompt: input.prompt,
    type: input.type,
    anonymous: input.anonymous,
    timer: input.timer,
    explanation: input.explanation
  };

  switch (input.type) {
    case "multiple-choice":
      return {
        ...base,
        type: "multiple-choice",
        options: input.options ?? ["Option 1", "Option 2"],
        allowMultiple: Boolean(input.allowMultiple),
        correctOptionIndexes: input.correctOptionIndexes
      };
    case "text":
      return {
        ...base,
        type: "text",
        maxLength: input.maxLength ?? 180
      };
    case "drawing":
      return {
        ...base,
        type: "drawing",
        placeholder: input.placeholder ?? "Sketch a simple idea."
      };
    case "rating-scale":
      return {
        ...base,
        type: "rating-scale",
        minLabel: input.minLabel ?? "Low",
        maxLabel: input.maxLabel ?? "High",
        scale: input.scale ?? 5,
        correctRating: input.correctRating
      };
    case "image-hotspot":
      return {
        ...base,
        type: "image-hotspot",
        hotspotLabel: input.hotspotLabel ?? "Tap the hotspot",
        imageUrl: input.imageUrl,
        correctPoint: input.correctPoint
      };
    case "drag-rank":
      return {
        ...base,
        type: "drag-rank",
        items: input.items ?? [],
        correctOrder: input.correctOrder
      };
    case "mcq":
      return {
        ...base,
        type: "mcq",
        options: input.options ?? ["Option 1", "Option 2"],
        allowMultiple: Boolean(input.allowMultiple),
        correctOptionIndexes: input.correctOptionIndexes
      };
    case "rating":
      return {
        ...base,
        type: "rating",
        minLabel: input.minLabel ?? "Low",
        maxLabel: input.maxLabel ?? "High",
        scale: input.scale ?? 5,
        correctRating: input.correctRating
      };
    case "true_false":
      return {
        ...base,
        type: "true_false",
        correctId:
          input.correctOptionIndexes?.includes(0) || input.options?.[0] === "true" ? "true" : "false"
      };
  }
}

function formatMetricValue(value: number, suffix = "") {
  return `${value}${suffix}`;
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function buildTeacherDashboardSummary(state: StoreState): TeacherDashboardSummary {
  const classes = state.classes;
  const decks = state.decks;
  const sessions = state.sessions;
  const rosters = state.rosters;
  const responses = state.responses;
  const liveSession = sessions.find((session) => session.status === "live") ?? null;
  const draftSession = sessions.find((session) => session.status === "draft") ?? null;
  const endedSessions = sessions.filter((session) => session.status === "ended");
  const classesWithoutDecks = classes.filter(
    (classroom) => !decks.some((deck) => deck.classId === classroom.id)
  );
  const deckIdsWithQuestions = new Set(
    state.questions
      .map((question) => state.slides.find((slide) => slide.id === question.slideId)?.deckId)
      .filter(Boolean)
  );
  const decksWithoutQuestions = decks.filter((deck) => !deckIdsWithQuestions.has(deck.id));
  const uniqueRosterParticipants = new Set(
    state.participants
      .filter((participant) =>
        responses.some((response) => response.participantId === participant.id)
      )
      .map((participant) => participant.rosterStudentId)
      .filter(Boolean)
  );
  const participationRate =
    rosters.length === 0 ? 0 : Math.round((uniqueRosterParticipants.size / rosters.length) * 100);

  const metrics: TeacherDashboardMetric[] = [
    {
      id: "classes",
      label: "Active classes",
      value: formatMetricValue(classes.length),
      helper: classes.length === 1 ? "1 classroom running" : `${classes.length} classrooms running`,
      tone: "amber"
    },
    {
      id: "decks",
      label: "Decks ready",
      value: formatMetricValue(decks.length),
      helper: decks.length === 0 ? "Build your first lesson deck" : "Interactive lessons on standby",
      tone: "mint"
    },
    {
      id: "sessions",
      label: "Live this week",
      value: formatMetricValue(sessions.filter((session) => session.status !== "draft").length),
      helper: liveSession ? "A session is live right now" : "Launch the next live moment",
      tone: "sky"
    },
    {
      id: "participation",
      label: "Participation",
      value: formatMetricValue(participationRate, "%"),
      helper: rosters.length === 0 ? "Add a roster to measure engagement" : "Roster learners who responded",
      tone: "violet"
    }
  ];

  const alerts: TeacherDashboardAlert[] = [];
  if (liveSession) {
    alerts.push({
      id: "live-session",
      title: "Live session in progress",
      message: `Join code ${liveSession.joinCode} is active for students right now.`,
      tone: "live"
    });
  }
  if (endedSessions.length > 0) {
    alerts.push({
      id: "ended-ready",
      title: "Reports ready to export",
      message: `${endedSessions.length} completed session${endedSessions.length === 1 ? "" : "s"} can be exported as CSV.`,
      tone: "success"
    });
  }
  if (classesWithoutDecks.length > 0) {
    alerts.push({
      id: "classes-without-decks",
      title: "Classes need their first deck",
      message: `${classesWithoutDecks.length} class${classesWithoutDecks.length === 1 ? "" : "es"} still need a lesson deck.`,
      tone: "warning"
    });
  }
  if (decksWithoutQuestions.length > 0) {
    alerts.push({
      id: "decks-without-questions",
      title: "Interactive moments missing",
      message: `${decksWithoutQuestions.length} deck${decksWithoutQuestions.length === 1 ? "" : "s"} do not have a question yet.`,
      tone: "info"
    });
  }
  if (state.imports.some((job) => job.status === "queued" || job.status === "processing")) {
    alerts.push({
      id: "imports-running",
      title: "Imports in motion",
      message: "A presentation import is queued or currently processing.",
      tone: "info"
    });
  }

  const today = startOfDay(new Date());
  const activity: TeacherDashboardActivityPoint[] = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const label = date.toLocaleDateString("en-US", { weekday: "short" });
    const value =
      state.replayEvents.filter((event) => {
        const createdAt = startOfDay(new Date(event.createdAt));
        return createdAt.getTime() === date.getTime();
      }).length || (index === 6 && (sessions.length > 0 || responses.length > 0) ? 2 : 0);

    return {
      label,
      value,
      highlight: index === 6
    };
  });

  const classRows: TeacherClassRow[] = classes.map((classroom) => {
    const classDecks = decks.filter((deck) => deck.classId === classroom.id);
    const classSessions = sessions.filter((session) => session.classId === classroom.id);
    const classRoster = rosters.filter((student) => student.classId === classroom.id);
    const engagedRosterIds = new Set(
      state.participants
        .filter((participant) => participant.rosterStudentId && participant.sessionId)
        .filter((participant) =>
          classSessions.some((session) => session.id === participant.sessionId) &&
          responses.some((response) => response.participantId === participant.id)
        )
        .map((participant) => participant.rosterStudentId)
    );
    const progressPercent =
      classDecks.length === 0
        ? 12
        : classRoster.length === 0
          ? 38
          : Math.min(
              96,
              Math.max(
                28,
                Math.round(
                  ((engagedRosterIds.size + classDecks.length + classSessions.length) /
                    (classRoster.length + Math.max(classDecks.length, 1) + Math.max(classSessions.length, 1))) *
                    100
                )
              )
            );
    const latestSession = classSessions
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    const status: TeacherClassRow["status"] =
      classSessions.some((session) => session.status === "live")
        ? "live"
        : classDecks.length === 0 || classRoster.length === 0
          ? "needs-setup"
          : "ready";

    return {
      classId: classroom.id,
      name: classroom.name,
      subject: classroom.subject,
      gradeLevel: classroom.gradeLevel,
      rosterCount: classRoster.length,
      deckCount: classDecks.length,
      sessionCount: classSessions.length,
      progressPercent,
      progressLabel:
        status === "needs-setup"
          ? "Setup in progress"
          : `${progressPercent}% teaching flow`,
      status,
      timeLabel: latestSession
        ? `Updated ${new Date(latestSession.updatedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric"
          })}`
        : classRoster.length > 0
          ? `${classRoster.length} learners ready`
          : "Roster not added yet"
    };
  });

  const tasks: TeacherDashboardTask[] = [];
  if (liveSession) {
    tasks.push({
      id: "monitor-live",
      title: "Monitor your live classroom",
      detail: `Keep ${liveSession.joinCode} moving and reveal results at the right moment.`,
      href: `/teacher/sessions/${liveSession.id}`,
      actionLabel: "Open live board",
      status: "ready"
    });
  } else if (draftSession) {
    tasks.push({
      id: "launch-draft",
      title: "Launch your next live session",
      detail: "A draft session is ready to go live as soon as you are.",
      href: `/teacher/sessions/${draftSession.id}`,
      actionLabel: "Open session",
      status: "ready"
    });
  }
  if (classesWithoutDecks.length > 0) {
    tasks.push({
      id: "create-deck",
      title: "Create a deck for your newest class",
      detail: `${classesWithoutDecks[0].name} still needs its first interactive lesson.`,
      href: "/teacher",
      actionLabel: "Use template",
      status: "attention"
    });
  }
  if (decksWithoutQuestions.length > 0) {
    tasks.push({
      id: "add-question",
      title: "Add a question to a deck",
      detail: `${decksWithoutQuestions[0].title} needs an interactive prompt before launch.`,
      href: `/teacher/decks/${decksWithoutQuestions[0].id}`,
      actionLabel: "Edit deck",
      status: "attention"
    });
  }
  if (endedSessions.length > 0) {
    tasks.push({
      id: "export-report",
      title: "Export participation report",
      detail: "Completed sessions are ready for CSV export and review.",
      href: "/teacher/reports",
      actionLabel: "Open reports",
      status: "upcoming"
    });
  }
  if (tasks.length === 0) {
    tasks.push({
      id: "prep-class",
      title: "Prepare your next interactive class",
      detail: "Start with a template, fine-tune the deck, and schedule the next live moment.",
      href: "/teacher",
      actionLabel: "Open dashboard",
      status: "ready"
    });
  }

  let hero: TeacherHeroSpotlight;
  if (liveSession) {
    const liveDeck = decks.find((deck) => deck.id === liveSession.deckId);
    hero = {
      eyebrow: "LIVE CLASSROOM",
      title: "Your classroom is live and students can join right now.",
      description: `Keep ${liveDeck?.title ?? "your lesson"} moving, reveal results, and keep participation momentum high.`,
      accentLabel: `Join code ${liveSession.joinCode}`,
      primaryActionLabel: "Open live board",
      primaryActionHref: `/teacher/sessions/${liveSession.id}`,
      secondaryActionLabel: "View reports",
      secondaryActionHref: "/teacher/reports"
    };
  } else if (classesWithoutDecks.length > 0) {
    hero = {
      eyebrow: "NEXT BEST MOVE",
      title: "Create the first lesson for your newest class.",
      description: `Set up ${classesWithoutDecks[0].name} with a template so you can launch a live session in minutes.`,
      accentLabel: classesWithoutDecks[0].subject,
      primaryActionLabel: "Create deck",
      primaryActionHref: "/teacher",
      secondaryActionLabel: "Manage classes",
      secondaryActionHref: "/teacher/classes"
    };
  } else {
    const newestDeck = decks.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    hero = {
      eyebrow: "TEACHER STUDIO",
      title: "Upgrade your teaching flow with interactive lessons.",
      description: "Shape your next session, keep response energy high, and turn classroom activity into visible momentum.",
      accentLabel: newestDeck?.title ?? "Skillzy workspace",
      primaryActionLabel: newestDeck ? "Continue editing" : "Create deck",
      primaryActionHref: newestDeck ? `/teacher/decks/${newestDeck.id}` : "/teacher",
      secondaryActionLabel: "Open reports",
      secondaryActionHref: "/teacher/reports"
    };
  }

  const profile: TeacherProfileSummary = {
    name: state.users[0].name,
    email: state.users[0].email,
    avatarUrl: state.users[0].avatarUrl,
    providerLabel: state.users[0].provider === "google" ? "Google workspace" : "Skillzy workspace",
    membershipLabel: "Teacher member",
    setupChecks: [
      {
        id: "classes",
        label: "Class created",
        complete: classes.length > 0
      },
      {
        id: "deck",
        label: "Lesson deck ready",
        complete: decks.length > 0
      },
      {
        id: "roster",
        label: "Roster connected",
        complete: rosters.length > 0
      },
      {
        id: "reports",
        label: "Report generated",
        complete: endedSessions.length > 0
      }
    ]
  };

  return {
    profile,
    metrics,
    alerts,
    activity,
    tasks,
    classRows,
    hero
  };
}

export class SkillzyStore {
  private backend: StoreBackend;
  private state: StoreState | null = null;
  private readyPromise: Promise<StoreState> | null = null;

  constructor() {
    const env = getApiEnv();
    this.backend =
      env.STORE_PROVIDER === "supabase" && env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
        ? new SupabaseStoreBackend(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
        : new FileStoreBackend();
  }

  private async ensureReady(): Promise<StoreState> {
    if (this.state) return this.state;
    if (!this.readyPromise) {
      this.readyPromise = this.backend.loadState().then((state) => {
        this.state = state;
        return state;
      });
    }
    return this.readyPromise;
  }

  private async persist() {
    if (!this.state) return;
    await this.backend.saveState(this.state);
  }

  async getTeacher(): Promise<User> {
    const state = await this.ensureReady();
    return state.users[0];
  }

  async getAuthSession(): Promise<AuthSession> {
    const state = await this.ensureReady();
    return state.authSession;
  }

  async listDashboard(): Promise<DashboardData> {
    const state = await this.ensureReady();
    return {
      teacher: state.users[0],
      auth: state.authSession,
      classes: state.classes,
      rosters: state.rosters,
      decks: state.decks,
      sessions: state.sessions,
      templates: state.templates,
      imports: state.imports,
      teacherDashboard: buildTeacherDashboardSummary(state)
    };
  }

  async listClasses() {
    const state = await this.ensureReady();
    return state.classes;
  }

  async createClass(input: CreateClassInput) {
    const state = await this.ensureReady();
    const classroom: ClassRoom = {
      id: createId("class"),
      teacherId: state.users[0].id,
      name: input.name,
      subject: input.subject,
      gradeLevel: input.gradeLevel,
      createdAt: now()
    };
    state.classes.push(classroom);
    await this.persist();
    return classroom;
  }

  async listTemplates() {
    const state = await this.ensureReady();
    return state.templates;
  }

  async createTemplate(input: CreateLessonTemplateInput) {
    const state = await this.ensureReady();
    const template: LessonTemplate = {
      id: createId("template"),
      title: input.title,
      description: input.description,
      subject: input.subject,
      gradeBand: input.gradeBand,
      heroGradient:
        input.heroGradient ?? "linear-gradient(135deg, #f3e9cf 0%, #fff6df 60%, #f7d87a 100%)",
      slides: input.slides.map((slide) => ({
        id: createId("template_slide"),
        title: slide.title,
        body: slide.body,
        imageUrl: slide.imageUrl,
        question: slide.question
          ? {
              id: createId("template_question"),
              type: slide.question.type,
              prompt: slide.question.prompt,
              anonymous: slide.question.anonymous,
              config: slide.question.config
            }
          : undefined
      }))
    };
    state.templates.unshift(template);
    await this.persist();
    return template;
  }

  async queueImport(fileName: string, source: ImportJob["source"]) {
    const state = await this.ensureReady();
    const record: ImportJob = {
      id: createId("import"),
      fileName,
      source,
      status: "queued",
      createdAt: now()
    };
    state.imports.unshift(record);
    await this.persist();
    return record;
  }

  async listDeckBundles() {
    const state = await this.ensureReady();
    return (
      await Promise.all(state.decks.map((deck) => this.getDeckBundle(deck.id)))
    ).filter(Boolean);
  }

  async getDeckBundle(deckId: string): Promise<DeckBundle | null> {
    const state = await this.ensureReady();
    const deck = state.decks.find((item) => item.id === deckId);
    if (!deck) return null;
    return {
      deck,
      slides: state.slides.filter((slide) => slide.deckId === deckId).sort((a, b) => a.index - b.index),
      questions: state.questions.filter((question) =>
        state.slides.some((slide) => slide.id === question.slideId && slide.deckId === deckId)
      )
    };
  }

  async createDeck(input: CreateDeckInput) {
    const state = await this.ensureReady();
    if (input.templateId) {
      const seeded = seedDeckFromTemplate(input.templateId, input.classId);
      if (seeded) {
        state.decks.push(seeded.deck);
        state.slides.push(...seeded.slides);
        state.questions.push(...seeded.questions);
        await this.persist();
        return this.getDeckBundle(seeded.deck.id);
      }
    }

    const deck: Deck = {
      id: createId("deck"),
      classId: input.classId,
      title: input.title,
      description: input.description,
      heroGradient: "linear-gradient(135deg, #f3e9cf 0%, #fff6df 60%, #f7d87a 100%)",
      source: "manual",
      createdAt: now(),
      updatedAt: now()
    };

    const welcomeSlide: Slide = {
      id: createId("slide"),
      deckId: deck.id,
      index: 0,
      title: "Welcome slide",
      body: "Add your lesson context here."
    };

    state.decks.push(deck);
    state.slides.push(welcomeSlide);
    await this.persist();
    return this.getDeckBundle(deck.id);
  }

  async updateDeck(deckId: string, input: UpdateDeckInput) {
    const state = await this.ensureReady();
    const deck = state.decks.find((item) => item.id === deckId);
    if (!deck) return null;
    Object.assign(deck, input, { updatedAt: now() });
    await this.persist();
    return this.getDeckBundle(deckId);
  }

  async createSlide(input: CreateSlideInput) {
    const state = await this.ensureReady();
    const existingSlides = state.slides
      .filter((slide) => slide.deckId === input.deckId)
      .sort((a, b) => a.index - b.index);
    const slide: Slide = {
      id: createId("slide"),
      deckId: input.deckId,
      index: existingSlides.length,
      title: input.title,
      body: input.body,
      imageUrl: input.imageUrl
    };
    state.slides.push(slide);
    await this.persist();
    return slide;
  }

  async updateSlide(slideId: string, input: UpdateSlideInput) {
    const state = await this.ensureReady();
    const slide = state.slides.find((item) => item.id === slideId);
    if (!slide) return null;
    Object.assign(slide, input);
    await this.persist();
    return slide;
  }

  async createQuestion(input: CreateQuestionInput) {
    const state = await this.ensureReady();
    const question = normalizeQuestion(input);
    state.questions.push(question);
    await this.persist();
    return question;
  }

  async upsertQuestion(input: UpdateQuestionInput) {
    const state = await this.ensureReady();
    const index = state.questions.findIndex((item) => item.id === input.id);
    const question = normalizeQuestion(input);
    if (index >= 0) {
      state.questions[index] = question;
    } else {
      state.questions.push(question);
    }
    await this.persist();
    return question;
  }

  async createSession(input: CreateSessionInput) {
    const state = await this.ensureReady();
    let targetDeckId = input.deckId;

    if (!targetDeckId && input.templateId) {
      const seeded = seedDeckFromTemplate(input.templateId, input.classId);
      if (seeded) {
        state.decks.push(seeded.deck);
        state.slides.push(...seeded.slides);
        state.questions.push(...seeded.questions);
        targetDeckId = seeded.deck.id;
      }
    }

    if (!targetDeckId) {
      return null;
    }

    const deck = state.decks.find((item) => item.id === targetDeckId) ?? null;
    const session: SkillzySession = {
      id: createId("session"),
      deckId: targetDeckId,
      classId: input.classId,
      title: deck?.title,
      joinCode: createJoinCode(),
      status: "draft",
      currentSlideIndex: 0,
      revealResults: false,
      createdAt: now(),
      updatedAt: now()
    };
    state.sessions.push(session);
    this.logEventLocal(state, session.id, "session-created");
    await this.persist();
    return session;
  }

  async getSession(sessionId: string) {
    const state = await this.ensureReady();
    return state.sessions.find((session) => session.id === sessionId) ?? null;
  }

  async getSessionByCode(joinCode: string) {
    const state = await this.ensureReady();
    return state.sessions.find((session) => session.joinCode === joinCode) ?? null;
  }

  async getSessionSnapshot(sessionId: string): Promise<SessionSnapshot | null> {
    const state = await this.ensureReady();
    const session = state.sessions.find((item) => item.id === sessionId);
    if (!session) return null;
    const deck = state.decks.find((item) => item.id === session.deckId);
    if (!deck) return null;
    const slides = state.slides.filter((slide) => slide.deckId === deck.id).sort((a, b) => a.index - b.index);
    const questions = state.questions.filter((question) =>
      slides.some((slide) => slide.id === question.slideId)
    );
    const participants = state.participants.filter((participant) => participant.sessionId === sessionId);
    const responses = state.responses.filter((response) => response.sessionId === sessionId);
    const replayEvents = state.replayEvents.filter((event) => event.sessionId === sessionId);

    return { session, deck, slides, questions, participants, responses, replayEvents };
  }

  async updateSession(
    sessionId: string,
    updater: (session: SkillzySession) => SkillzySession,
    eventType?: SessionReplayEvent["type"]
  ) {
    const state = await this.ensureReady();
    const session = state.sessions.find((item) => item.id === sessionId);
    if (!session) return null;
    const updated = updater(session);
    updated.updatedAt = now();
    state.sessions = state.sessions.map((item) => (item.id === sessionId ? updated : item));
    if (eventType) this.logEventLocal(state, sessionId, eventType);
    await this.persist();
    return updated;
  }

  async joinSession(input: JoinSessionInput) {
    const state = await this.ensureReady();
    const session = state.sessions.find((item) => item.joinCode === input.joinCode);
    if (!session) return null;

    const existing = input.reconnectToken
      ? state.participants.find(
          (participant) =>
            participant.sessionId === session.id && participant.reconnectToken === input.reconnectToken
        )
      : undefined;

    if (existing) {
      return { session, participant: existing };
    }

    const rosterStudent = state.rosters.find(
      (student) =>
        student.classId === session.classId &&
        student.displayName.toLowerCase() === input.displayName.trim().toLowerCase()
    );

    const participant: Participant = {
      id: createId("participant"),
      sessionId: session.id,
      displayName: input.displayName,
      rosterStudentId: rosterStudent?.id,
      color: ["#ffcd57", "#ff7a59", "#7ad7ff", "#b28cff"][state.participants.length % 4],
      joinedAt: now(),
      reconnectToken: createId("reconnect")
    };

    state.participants.push(participant);
    await this.persist();
    return { session, participant };
  }

  async submitResponse(input: SubmitResponseInput) {
    const state = await this.ensureReady();
    const question = state.questions.find((item) => item.id === input.questionId);
    if (!question) return null;

    const existingIndex = state.responses.findIndex(
      (response) =>
        response.sessionId === input.sessionId &&
        response.questionId === input.questionId &&
        response.participantId === input.participantId
    );

    const base = {
      id: existingIndex >= 0 ? state.responses[existingIndex].id : createId("response"),
      sessionId: input.sessionId,
      questionId: input.questionId,
      participantId: input.participantId,
      submittedAt: now()
    };

    const response: StudentResponse =
      input.type === "multiple-choice"
        ? {
            ...base,
            type: "multiple-choice",
            selectedOptionIndexes: input.payload.selectedOptionIndexes ?? []
          }
        : input.type === "text"
          ? {
              ...base,
              type: "text",
              text: input.payload.text ?? "",
              pinned: false
            }
          : input.type === "drawing"
            ? {
                ...base,
                type: "drawing",
                strokes: input.payload.strokes ?? ""
              }
            : input.type === "rating-scale"
              ? {
                  ...base,
                  type: "rating-scale",
                  rating: input.payload.rating ?? 0
                }
              : input.type === "image-hotspot"
                ? {
                    ...base,
                    type: "image-hotspot",
                    point: input.payload.point ?? { x: 50, y: 50 }
                  }
                : {
                    ...base,
                    type: "drag-rank",
                    orderedItems: input.payload.orderedItems ?? []
                  };

    if (existingIndex >= 0) {
      state.responses[existingIndex] = response;
    } else {
      state.responses.push(response);
    }

    this.logEventLocal(state, input.sessionId, "response-submitted", {
      questionId: input.questionId,
      participantId: input.participantId
    });
    await this.persist();
    return response;
  }

  async pinTextResponse(responseId: string) {
    const state = await this.ensureReady();
    state.responses = state.responses.map((response) =>
      response.id === responseId && response.type === "text"
        ? { ...response, pinned: !response.pinned }
        : response
    );
    await this.persist();
    return state.responses.find((response) => response.id === responseId) ?? null;
  }

  async exportSession(sessionId: string) {
    const state = await this.ensureReady();
    const snapshot = await this.getSessionSnapshot(sessionId);
    if (!snapshot) return null;

    const csvLines = [
      "student,question,type,response",
      ...snapshot.responses.map((response) => {
        const participant = snapshot.participants.find((item) => item.id === response.participantId);
        const question = snapshot.questions.find((item) => item.id === response.questionId);
        const answer =
          response.type === "multiple-choice"
            ? response.selectedOptionIndexes.join("|")
            : response.type === "mcq"
              ? (response.selectedId ?? response.selectedOptionIndexes.join("|"))
            : response.type === "text"
              ? response.text.replace(/,/g, ";")
              : response.type === "drawing"
                ? "drawing-submitted"
                : response.type === "rating-scale"
                  ? `${response.rating}`
                  : response.type === "rating"
                    ? `${response.rating}`
                  : response.type === "image-hotspot"
                    ? `${response.point.x}:${response.point.y}`
                    : response.type === "drag-rank"
                      ? response.orderedItems.join(" > ")
                      : response.type === "true_false"
                        ? response.selectedId
                        : "";
        return [
          participant?.displayName ?? "Unknown",
          question?.prompt.replace(/,/g, ";") ?? "Question",
          response.type,
          answer
        ].join(",");
      })
    ].join("\n");

    const record: SessionExport = {
      id: createId("export"),
      sessionId,
      csv: csvLines,
      createdAt: now()
    };
    state.exports.push(record);
    await this.persist();
    return record;
  }

  private logEventLocal(
    state: StoreState,
    sessionId: string,
    type: SessionReplayEvent["type"],
    metadata?: Record<string, unknown>
  ) {
    state.replayEvents.push({
      id: createId("event"),
      sessionId,
      type,
      createdAt: now(),
      metadata
    });
  }

  async getQuestionAnalytics(sessionId: string, questionId: string) {
    const state = await this.ensureReady();
    const question = state.questions.find((item) => item.id === questionId);
    const responses = state.responses.filter(
      (response) => response.sessionId === sessionId && response.questionId === questionId
    );
    if (!question) return null;

    if (question.type === "multiple-choice") {
      const counts = question.options.map((option, index) => ({
        option,
        count: responses.filter(
          (response) =>
            response.type === "multiple-choice" &&
            response.selectedOptionIndexes.includes(index)
        ).length
      }));
      return { kind: "multiple-choice", counts };
    }

    if (question.type === "rating-scale") {
      return {
        kind: "rating-scale",
        average:
          responses.length === 0
            ? 0
            : responses.reduce(
                (total, response) => total + (response.type === "rating-scale" ? response.rating : 0),
                0
              ) / responses.length
      };
    }

    return {
      kind: question.type,
      responses
    };
  }
}

export const skillzyStore = new SkillzyStore();
