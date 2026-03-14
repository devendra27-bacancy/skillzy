import type { AuthSession, User } from "./user";
import type { Question } from "./question";
import type { Participant, SessionResponse } from "./response";

export type SessionStatus = "draft" | "waiting" | "live" | "paused" | "ended" | "deleted";

export interface Session {
  id: string;
  teacherId?: string;
  classId?: string;
  deckId?: string;
  title?: string;
  joinCode?: string;
  code?: string;
  status: SessionStatus;
  anonymousMode?: boolean;
  anonymous_mode?: boolean;
  slideSource?: string | null;
  slideSourceId?: string | null;
  currentSlideIndex?: number;
  currentSlide?: number;
  activeQuestionId?: string;
  revealResults?: boolean;
  createdAt: string;
  updatedAt?: string;
  startedAt?: string;
  endedAt?: string;
}

export interface Slide {
  id: string;
  deckId?: string;
  sessionId?: string;
  index: number;
  title?: string;
  body?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  originalUrl?: string;
  hasQuestion?: boolean;
}

export interface Deck {
  id: string;
  classId: string;
  title: string;
  description: string;
  heroGradient: string;
  thumbnailUrl?: string;
  source: "manual" | "template" | "import";
  templateId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LessonTemplate {
  id: string;
  title: string;
  description: string;
  subject: string;
  gradeBand: string;
  heroGradient: string;
  slides: Array<{
    id: string;
    title: string;
    body: string;
    imageUrl?: string;
    question?: {
      id: string;
      type: string;
      prompt: string;
      anonymous: boolean;
      config: Record<string, unknown>;
    };
  }>;
}

export interface DeckBundle {
  deck: Deck;
  slides: Slide[];
  questions: Question[];
}

export interface SessionSnapshot {
  session: Session;
  deck?: Deck;
  slides: Slide[];
  questions: Question[];
  participants: Participant[];
  responses: SessionResponse[];
  replayEvents: Array<{
    id: string;
    sessionId: string;
    type: string;
    createdAt: string;
    metadata?: Record<string, unknown>;
  }>;
}

export interface DashboardData {
  teacher: User;
  auth: AuthSession;
  classes: Array<{
    id: string;
    teacherId: string;
    institutionId?: string;
    name: string;
    subject: string;
    gradeLevel?: string;
    createdAt: string;
  }>;
  rosters: Array<{
    id: string;
    classId: string;
    displayName: string;
    email?: string;
    participationScore: number;
    streak: number;
    createdAt: string;
  }>;
  decks: Deck[];
  sessions: Session[];
  templates: LessonTemplate[];
  imports: Array<{
    id: string;
    deckId?: string;
    source: "pptx" | "pdf" | "google-slides";
    fileName: string;
    status: "queued" | "processing" | "completed" | "failed";
    createdAt: string;
  }>;
  teacherDashboard?: Record<string, unknown>;
}
