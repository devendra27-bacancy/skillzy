import type { FastifyInstance } from "fastify";
import { fail, ok } from "./helpers";
import { skillzyStore } from "../services/store";

export async function registerAnalyticsRoutes(app: FastifyInstance) {
  app.get("/api/analytics/session/:id", async (request, reply) => {
    const sessionId = (request.params as { id: string }).id;
    const snapshot = await skillzyStore.getSessionSnapshot(sessionId);
    if (!snapshot) return fail(reply, "session_not_found", "Session not found.", 404);

    const questionBreakdown = await Promise.all(
      snapshot.questions.map(async (question) => ({
        questionId: question.id,
        prompt: question.prompt,
        analytics: await skillzyStore.getQuestionAnalytics(sessionId, question.id)
      }))
    );

    return ok(reply, {
      sessionId,
      participationRate:
        snapshot.participants.length === 0
          ? 0
          : Math.round((snapshot.responses.length / snapshot.participants.length) * 100),
      questionBreakdown
    });
  });

  app.get("/api/analytics/school", async (_request, reply) =>
    ok(reply, {
      message: "School analytics are scaffolded for the admin phase.",
      active: false
    })
  );
}
