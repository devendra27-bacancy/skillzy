import type {
  ApiResult,
  CreateClassInput,
  CreateDeckInput,
  CreateLessonTemplateInput,
  CreateQuestionInput,
  CreateSessionInput,
  CreateSlideInput,
  DashboardData,
  DeckBundle,
  ImportJob,
  JoinSessionInput,
  LessonTemplate,
  Session,
  SessionSnapshot,
  SubmitResponseInput,
  UpdateDeckInput,
  UpdateQuestionInput,
  UpdateSlideInput
} from "@skillzy/types";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").trim();

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    const payload = (await response.json()) as ApiResult<T> | T;
    if (typeof payload === "object" && payload && "success" in payload) {
      if (!payload.success) {
        throw new Error(payload.error.message);
      }
      return payload.data;
    }
    return payload as T;
  }
  return (await response.text()) as T;
}

export const api = {
  dashboard: () => request<DashboardData>("/api/dashboard"),
  listDecks: () => request<DeckBundle[]>("/api/decks"),
  listTemplates: () => request<LessonTemplate[]>("/api/templates"),
  createTemplate: (input: CreateLessonTemplateInput) =>
    request<LessonTemplate>("/api/templates", { method: "POST", body: JSON.stringify(input) }),
  createClass: (input: CreateClassInput) =>
    request("/api/classes", { method: "POST", body: JSON.stringify(input) }),
  createDeck: (input: CreateDeckInput) =>
    request<DeckBundle>("/api/decks", { method: "POST", body: JSON.stringify(input) }),
  updateDeck: (deckId: string, input: UpdateDeckInput) =>
    request<DeckBundle>(`/api/decks/${deckId}`, {
      method: "PATCH",
      body: JSON.stringify(input)
    }),
  createSlide: (input: CreateSlideInput) =>
    request("/api/slides", { method: "POST", body: JSON.stringify(input) }),
  updateSlide: (slideId: string, input: UpdateSlideInput) =>
    request(`/api/slides/${slideId}`, { method: "PATCH", body: JSON.stringify(input) }),
  createQuestion: (input: CreateQuestionInput) =>
    request("/api/questions", { method: "POST", body: JSON.stringify(input) }),
  updateQuestion: (questionId: string, input: Omit<UpdateQuestionInput, "id">) =>
    request(`/api/questions/${questionId}`, { method: "PUT", body: JSON.stringify(input) }),
  queueImport: (fileName: string, source: ImportJob["source"]) =>
    request<ImportJob>("/api/imports", {
      method: "POST",
      body: JSON.stringify({ fileName, source })
    }),
  createSession: (input: CreateSessionInput) =>
    request<Session>("/api/sessions", { method: "POST", body: JSON.stringify(input) }),
  getSession: (sessionId: string) => request<SessionSnapshot>(`/api/sessions/${sessionId}`),
  lookupJoinCode: (joinCode: string) =>
    request<{ sessionId: string; title: string; anonymous_mode: boolean; code: string }>(
      `/api/sessions/join/${joinCode}`
    ),
  joinSession: (input: JoinSessionInput) =>
    request<{ session: SessionSnapshot["session"]; participant: { id: string; reconnectToken: string } }>(
      "/api/sessions/join",
      { method: "POST", body: JSON.stringify(input) }
    ),
  submitResponse: (input: SubmitResponseInput) =>
    request("/api/responses", { method: "POST", body: JSON.stringify(input) }),
  startSession: (sessionId: string) =>
    request(`/api/sessions/${sessionId}/start`, { method: "POST" }),
  endSession: (sessionId: string) =>
    request(`/api/sessions/${sessionId}/end`, { method: "POST" }),
  exportSession: (sessionId: string) =>
    request<string>(`/api/sessions/${sessionId}/export`, { method: "POST" })
};

export { API_URL };
