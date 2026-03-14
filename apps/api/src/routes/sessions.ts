import type { FastifyInstance } from "fastify";
import type { CreateClassInput, CreateDeckInput, CreateSessionInput, Session as SkillzySession, UpdateDeckInput } from "@skillzy/types";
import { z } from "zod";
import { fail, ok } from "./helpers";
import { skillzyStore } from "../services/store";
import { validateSchema } from "../middleware/validateSchema";

const createClassSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  gradeLevel: z.string().optional()
});

const createDeckSchema = z.object({
  classId: z.string(),
  title: z.string().min(1),
  description: z.string().min(1),
  templateId: z.string().optional()
});

const updateDeckSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional()
});

const createSessionSchema = z.object({
  deckId: z.string().min(1).optional(),
  templateId: z.string().min(1).optional(),
  classId: z.string().min(1)
}).refine((value) => Boolean(value.deckId || value.templateId), {
  message: "Either deckId or templateId is required."
});

const joinSessionSchema = z.object({
  joinCode: z.string().min(4).max(4),
  displayName: z.string().min(1),
  reconnectToken: z.string().optional()
});

const updateSessionSchema = z.object({
  title: z.string().min(1).optional(),
  anonymous_mode: z.boolean().optional(),
  status: z.enum(["draft", "waiting", "live", "paused", "ended", "deleted"]).optional()
});

export async function registerSessionRoutes(app: FastifyInstance) {
  app.get("/health", async (_request, reply) => ok(reply, { ok: true }));
  app.get("/api/decks", async (_request, reply) => ok(reply, await skillzyStore.listDeckBundles()));
  app.get("/api/sessions", async (_request, reply) => {
    const dashboard = await skillzyStore.listDashboard();
    return ok(reply, dashboard.sessions);
  });

  app.post("/api/classes", async (request, reply) => {
    const input = (await validateSchema(createClassSchema, request.body)) as CreateClassInput;
    return ok(reply, await skillzyStore.createClass(input), 201);
  });

  app.post("/api/decks", async (request, reply) => {
    const input = (await validateSchema(createDeckSchema, request.body)) as CreateDeckInput;
    return ok(reply, await skillzyStore.createDeck(input), 201);
  });

  app.patch("/api/decks/:deckId", async (request, reply) => {
    const deckId = (request.params as { deckId: string }).deckId;
    const input = (await validateSchema(updateDeckSchema, request.body)) as UpdateDeckInput;
    const deck = await skillzyStore.updateDeck(deckId, input);
    if (!deck) return fail(reply, "deck_not_found", "Deck not found.", 404);
    return ok(reply, deck);
  });

  app.post("/api/sessions", async (request, reply) => {
    const input = (await validateSchema(createSessionSchema, request.body)) as CreateSessionInput;
    const session = await skillzyStore.createSession(input);
    if (!session) {
      return fail(reply, "session_source_not_found", "Pick a valid deck or template before creating a session.", 400);
    }
    return ok(reply, session, 201);
  });

  app.get("/api/sessions/:sessionId", async (request, reply) => {
    const sessionId = (request.params as { sessionId: string }).sessionId;
    const snapshot = await skillzyStore.getSessionSnapshot(sessionId);
    if (!snapshot) return fail(reply, "session_not_found", "Session not found.", 404);
    return ok(reply, snapshot);
  });

  app.get("/api/sessions/join/:code", async (request, reply) => {
    const joinCode = (request.params as { code: string }).code;
    const session = await skillzyStore.getSessionByCode(joinCode);
    if (!session) return fail(reply, "join_code_not_found", "That code doesn't match an active class.", 404);
    return ok(reply, {
      sessionId: session.id,
      title: session.title ?? "Skillzy session",
      anonymous_mode: session.anonymous_mode ?? session.anonymousMode ?? false,
      code: session.joinCode ?? session.code ?? joinCode
    });
  });

  app.post("/api/sessions/join", async (request, reply) => {
    const input = await validateSchema(joinSessionSchema, request.body);
    const joined = await skillzyStore.joinSession(input);
    if (!joined) return fail(reply, "join_code_not_found", "That code doesn't match an active class.", 404);
    return ok(reply, joined);
  });

  app.patch("/api/sessions/:id", async (request, reply) => {
    const sessionId = (request.params as { id: string }).id;
    const input = await validateSchema(updateSessionSchema, request.body);
    const session = await skillzyStore.updateSession(sessionId, (existing: SkillzySession) => ({
      ...existing,
      title: input.title ?? existing.title,
      anonymous_mode: input.anonymous_mode ?? existing.anonymous_mode,
      anonymousMode: input.anonymous_mode ?? existing.anonymousMode,
      status: input.status ?? existing.status
    }));
    if (!session) return fail(reply, "session_not_found", "Session not found.", 404);
    return ok(reply, session);
  });

  app.delete("/api/sessions/:id", async (request, reply) => {
    const sessionId = (request.params as { id: string }).id;
    const session = await skillzyStore.updateSession(sessionId, (existing: SkillzySession) => ({
      ...existing,
      status: "deleted"
    }));
    if (!session) return fail(reply, "session_not_found", "Session not found.", 404);
    return ok(reply, session);
  });

  app.post("/api/sessions/:sessionId/start", async (request, reply) => {
    const sessionId = (request.params as { sessionId: string }).sessionId;
    const snapshot = await skillzyStore.getSessionSnapshot(sessionId);
    if (!snapshot) return fail(reply, "session_not_found", "Session not found.", 404);
    if (snapshot.questions.length === 0) {
      return fail(reply, "session_missing_questions", "Add at least one question before starting.", 400);
    }

    const session = await skillzyStore.updateSession(
      sessionId,
      (existing: SkillzySession) => ({
        ...existing,
        status: "waiting",
        startedAt: existing.startedAt ?? new Date().toISOString()
      }),
      "session-started"
    );
    return ok(reply, session);
  });

  app.post("/api/sessions/:sessionId/end", async (request, reply) => {
    const sessionId = (request.params as { sessionId: string }).sessionId;
    const session = await skillzyStore.updateSession(
      sessionId,
      (existing: SkillzySession) => ({
        ...existing,
        status: "ended",
        endedAt: new Date().toISOString()
      }),
      "session-ended"
    );
    if (!session) return fail(reply, "session_not_found", "Session not found.", 404);
    return ok(reply, session);
  });

  app.get("/api/sessions/:id/summary", async (request, reply) => {
    const sessionId = (request.params as { id: string }).id;
    const snapshot = await skillzyStore.getSessionSnapshot(sessionId);
    if (!snapshot) return fail(reply, "session_not_found", "Session not found.", 404);
    const questionSummaries = await Promise.all(
      snapshot.questions.map(async (question) => ({
        questionId: question.id,
        prompt: question.prompt,
        analytics: await skillzyStore.getQuestionAnalytics(sessionId, question.id)
      }))
    );
    return ok(reply, {
      sessionId,
      participantCount: snapshot.participants.length,
      responseCount: snapshot.responses.length,
      questions: questionSummaries
    });
  });
}
