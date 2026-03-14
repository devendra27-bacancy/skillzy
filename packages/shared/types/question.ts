export type QuestionKind = "mcq" | "text" | "drawing" | "rating" | "true_false";

export interface BaseQuestion {
  id: string;
  sessionId: string;
  slideIndex: number;
  type: QuestionKind;
  prompt: string;
  anonymous: boolean;
  orderIndex: number;
  timeLimitS?: number | null;
}

export interface McqQuestion extends BaseQuestion {
  type: "mcq";
  options: Array<{ id: string; text: string; isCorrect?: boolean }>;
  correctId?: string;
}

export interface TextQuestion extends BaseQuestion {
  type: "text";
}

export interface DrawingQuestion extends BaseQuestion {
  type: "drawing";
}

export interface RatingQuestion extends BaseQuestion {
  type: "rating";
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: "true_false";
  correctId?: "true" | "false";
}

export type Question =
  | McqQuestion
  | TextQuestion
  | DrawingQuestion
  | RatingQuestion
  | TrueFalseQuestion;
