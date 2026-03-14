import type { QuestionKind } from "./question";

export interface Participant {
  id: string;
  sessionId: string;
  studentToken: string;
  studentName?: string | null;
  joinedAt: string;
  lastSeenAt?: string;
}

export interface ResponseValue {
  type: QuestionKind;
  selectedId?: string;
  selectedOptionIndexes?: number[];
  text?: string;
  dataUrl?: string;
  rating?: number;
  strokes?: string;
}

export interface SessionResponse {
  id: string;
  questionId: string;
  sessionId: string;
  studentToken: string;
  studentName?: string | null;
  value: ResponseValue;
  isCorrect?: boolean | null;
  submittedAt: string;
}
