export type QuestionType =
  | "multiple-choice"
  | "text"
  | "drawing"
  | "rating-scale"
  | "image-hotspot"
  | "drag-rank"
  | "mcq"
  | "rating"
  | "true_false";

export type SessionStatus = "draft" | "waiting" | "live" | "paused" | "ended" | "deleted";

export type UserRole =
  | "teacher"
  | "student"
  | "admin"
  | "district-admin"
  | "guardian"
  | "super_admin";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  provider: "google" | "demo";
  role: UserRole;
  institutionId?: string;
  schoolId?: string;
  subject?: string;
  classSize?: number;
}

export interface AuthSession {
  user: User | null;
  authenticated: boolean;
  provider: User["provider"] | "none";
}

export interface Institution {
  id: string;
  name: string;
  type: "school" | "district";
}

export interface ClassRoom {
  id: string;
  teacherId: string;
  institutionId?: string;
  name: string;
  subject: string;
  gradeLevel?: string;
  createdAt: string;
}

export interface RosterStudent {
  id: string;
  classId: string;
  displayName: string;
  email?: string;
  participationScore: number;
  streak: number;
  createdAt: string;
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

export interface Slide {
  id: string;
  deckId: string;
  sessionId?: string;
  index: number;
  title: string;
  body: string;
  imageUrl?: string;
  notes?: string;
  thumbnailUrl?: string;
  originalUrl?: string;
  hasQuestion?: boolean;
}

export interface QuestionTimer {
  enabled: boolean;
  durationSeconds?: number;
  autoAdvance?: boolean;
}

export interface BaseQuestion {
  id: string;
  slideId: string;
  sessionId?: string;
  slideIndex?: number;
  prompt: string;
  type: QuestionType;
  anonymous: boolean;
  timer?: QuestionTimer;
  explanation?: string;
  orderIndex?: number;
  timeLimitS?: number | null;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple-choice" | "mcq";
  options: Array<string> | Array<{ id: string; text: string; isCorrect?: boolean }>;
  allowMultiple?: boolean;
  correctOptionIndexes?: number[];
  correctId?: string;
}

export interface TextQuestion extends BaseQuestion {
  type: "text";
  maxLength?: number;
}

export interface DrawingQuestion extends BaseQuestion {
  type: "drawing";
  placeholder?: string;
}

export interface RatingScaleQuestion extends BaseQuestion {
  type: "rating-scale" | "rating";
  minLabel?: string;
  maxLabel?: string;
  scale?: number;
  correctRating?: number;
}

export interface ImageHotspotQuestion extends BaseQuestion {
  type: "image-hotspot";
  imageUrl?: string;
  hotspotLabel?: string;
  correctPoint?: {
    x: number;
    y: number;
  };
}

export interface DragRankQuestion extends BaseQuestion {
  type: "drag-rank";
  items: string[];
  correctOrder?: string[];
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: "true_false";
  correctId?: "true" | "false";
}

export type Question =
  | MultipleChoiceQuestion
  | TextQuestion
  | DrawingQuestion
  | RatingScaleQuestion
  | ImageHotspotQuestion
  | DragRankQuestion
  | TrueFalseQuestion;

export interface Session {
  id: string;
  deckId: string;
  classId: string;
  teacherId?: string;
  title?: string;
  joinCode: string;
  code?: string;
  status: SessionStatus;
  currentSlideIndex: number;
  currentSlide?: number;
  activeQuestionId?: string;
  revealResults: boolean;
  anonymousMode?: boolean;
  anonymous_mode?: boolean;
  slideSource?: string | null;
  slideSourceId?: string | null;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  id: string;
  sessionId: string;
  displayName: string;
  studentName?: string | null;
  rosterStudentId?: string;
  studentToken?: string;
  color: string;
  joinedAt: string;
  lastSeenAt?: string;
  reconnectToken: string;
}

export interface ResponseBase {
  id: string;
  sessionId: string;
  questionId: string;
  participantId: string;
  studentToken?: string;
  studentName?: string | null;
  submittedAt: string;
}

export interface MultipleChoiceResponse extends ResponseBase {
  type: "multiple-choice" | "mcq";
  selectedOptionIndexes: number[];
  selectedId?: string;
}

export interface TextResponse extends ResponseBase {
  type: "text";
  text: string;
  pinned?: boolean;
}

export interface DrawingResponse extends ResponseBase {
  type: "drawing";
  strokes: string;
  dataUrl?: string;
}

export interface RatingScaleResponse extends ResponseBase {
  type: "rating-scale" | "rating";
  rating: number;
}

export interface ImageHotspotResponse extends ResponseBase {
  type: "image-hotspot";
  point: {
    x: number;
    y: number;
  };
}

export interface DragRankResponse extends ResponseBase {
  type: "drag-rank";
  orderedItems: string[];
}

export interface TrueFalseResponse extends ResponseBase {
  type: "true_false";
  selectedId: "true" | "false";
}

export type StudentResponse =
  | MultipleChoiceResponse
  | TextResponse
  | DrawingResponse
  | RatingScaleResponse
  | ImageHotspotResponse
  | DragRankResponse
  | TrueFalseResponse;

export interface SessionReplayEvent {
  id: string;
  sessionId: string;
  type:
    | "session-created"
    | "session-started"
    | "slide-advanced"
    | "question-activated"
    | "response-submitted"
    | "results-revealed"
    | "session-ended";
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface SessionExport {
  id: string;
  sessionId: string;
  csv: string;
  createdAt: string;
}

export interface TemplateQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  anonymous: boolean;
  timerDuration?: number;
  config: Record<string, unknown>;
}

export interface TemplateSlide {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  question?: TemplateQuestion;
}

export interface LessonTemplate {
  id: string;
  title: string;
  description: string;
  subject: string;
  gradeBand: string;
  heroGradient: string;
  timer?: boolean;
  timerDuration?: number;
  slides: TemplateSlide[];
}

export interface CreateTemplateQuestionInput {
  type: Extract<QuestionType, "multiple-choice" | "text" | "drawing" | "rating-scale" | "image-hotspot" | "drag-rank">;
  prompt: string;
  anonymous: boolean;
  timerDuration?: number;
  config: Record<string, unknown>;
}

export interface CreateTemplateSlideInput {
  title: string;
  body: string;
  imageUrl?: string;
  question?: CreateTemplateQuestionInput;
}

export interface CreateLessonTemplateInput {
  title: string;
  description: string;
  subject: string;
  gradeBand: string;
  heroGradient?: string;
  timer?: boolean;
  timerDuration?: number;
  slides: CreateTemplateSlideInput[];
}

export interface ImportJob {
  id: string;
  deckId?: string;
  source: "pptx" | "pdf" | "google-slides";
  fileName: string;
  status: "queued" | "processing" | "completed" | "failed";
  createdAt: string;
}

export interface LmsSyncState {
  provider: "google-classroom" | "canvas";
  status: "idle" | "connected" | "syncing" | "error";
  message?: string;
}

export interface AiAnalysisResult {
  sessionId: string;
  questionId: string;
  summary: string;
  themes: string[];
  nextSteps: string[];
}

export interface TeacherDashboardMetric {
  id: string;
  label: string;
  value: string;
  helper: string;
  tone: "violet" | "amber" | "sky" | "mint";
}

export interface TeacherDashboardTask {
  id: string;
  title: string;
  detail: string;
  href: string;
  actionLabel: string;
  status: "ready" | "attention" | "upcoming";
}

export interface TeacherDashboardAlert {
  id: string;
  title: string;
  message: string;
  tone: "live" | "warning" | "success" | "info";
}

export interface TeacherDashboardActivityPoint {
  label: string;
  value: number;
  highlight?: boolean;
}

export interface TeacherClassRow {
  classId: string;
  name: string;
  subject: string;
  gradeLevel?: string;
  rosterCount: number;
  deckCount: number;
  sessionCount: number;
  progressPercent: number;
  progressLabel: string;
  status: "live" | "ready" | "needs-setup";
  timeLabel: string;
}

export interface TeacherHeroSpotlight {
  eyebrow: string;
  title: string;
  description: string;
  accentLabel: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  secondaryActionLabel: string;
  secondaryActionHref: string;
}

export interface TeacherProfileSummary {
  name: string;
  email: string;
  avatarUrl?: string;
  providerLabel: string;
  membershipLabel: string;
  setupChecks: Array<{
    id: string;
    label: string;
    complete: boolean;
  }>;
}

export interface TeacherDashboardSummary {
  profile: TeacherProfileSummary;
  metrics: TeacherDashboardMetric[];
  alerts: TeacherDashboardAlert[];
  activity: TeacherDashboardActivityPoint[];
  tasks: TeacherDashboardTask[];
  classRows: TeacherClassRow[];
  hero: TeacherHeroSpotlight;
}

export interface DeckBundle {
  deck: Deck;
  slides: Slide[];
  questions: Question[];
}

export interface SessionSnapshot {
  session: Session;
  deck: Deck;
  slides: Slide[];
  questions: Question[];
  participants: Participant[];
  responses: StudentResponse[];
  replayEvents: SessionReplayEvent[];
}

export interface DashboardData {
  teacher: User;
  auth: AuthSession;
  classes: ClassRoom[];
  rosters: RosterStudent[];
  decks: Deck[];
  sessions: Session[];
  templates: LessonTemplate[];
  imports: ImportJob[];
  teacherDashboard: TeacherDashboardSummary;
}

export interface CreateClassInput {
  name: string;
  subject: string;
  gradeLevel?: string;
}

export interface CreateDeckInput {
  classId: string;
  title: string;
  description: string;
  templateId?: string;
}

export interface UpdateDeckInput {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
}

export interface CreateSlideInput {
  deckId: string;
  title: string;
  body: string;
  imageUrl?: string;
}

export interface UpdateSlideInput {
  title?: string;
  body?: string;
  imageUrl?: string;
}

export interface CreateQuestionInput {
  slideId: string;
  sessionId?: string;
  slideIndex?: number;
  type: QuestionType;
  prompt: string;
  anonymous: boolean;
  timer?: QuestionTimer;
  explanation?: string;
  options?: string[];
  allowMultiple?: boolean;
  correctOptionIndexes?: number[];
  maxLength?: number;
  placeholder?: string;
  minLabel?: string;
  maxLabel?: string;
  scale?: number;
  correctRating?: number;
  hotspotLabel?: string;
  imageUrl?: string;
  correctPoint?: {
    x: number;
    y: number;
  };
  items?: string[];
  correctOrder?: string[];
}

export interface UpdateQuestionInput extends CreateQuestionInput {
  id: string;
}

export interface CreateSessionInput {
  deckId?: string;
  templateId?: string;
  classId: string;
}

export interface JoinSessionInput {
  joinCode: string;
  displayName: string;
  reconnectToken?: string;
}

export interface SubmitResponseInput {
  sessionId: string;
  questionId: string;
  participantId: string;
  studentToken?: string;
  studentName?: string;
  type: QuestionType;
  payload: {
    selectedId?: string;
    selectedOptionIndexes?: number[];
    text?: string;
    strokes?: string;
    dataUrl?: string;
    rating?: number;
    point?: {
      x: number;
      y: number;
    };
    orderedItems?: string[];
  };
}

export enum SkillzySocketEvent {
  SessionJoin = "session:join",
  SessionTeacherJoin = "session:teacher_join",
  SessionState = "session:state",
  SessionEnd = "session:end",
  SessionEnded = "session:ended",
  SlideAdvance = "slide:advance",
  QuestionActive = "question:active",
  QuestionReveal = "question:reveal",
  QuestionRevealed = "question:revealed",
  ResponseSubmit = "response:submit",
  ResponseNew = "response:new",
  ParticipantJoined = "participant:joined",
  Error = "error"
}

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: ApiError;
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;
