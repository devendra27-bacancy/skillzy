import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { fail, ok } from "./helpers";
import { validateSchema } from "../middleware/validateSchema";
import { sessionRuntime } from "../services/session-runtime";
import { skillzyStore } from "../services/store";

const updateParticipantProgressSchema = z.object({
  currentQuestionIndex: z.number().int().min(0)
});

export async function registerParticipantRoutes(app: FastifyInstance) {
  app.post("/api/sessions/:sessionId/participants/:participantId/progress", async (request, reply) => {
    const { sessionId, participantId } = request.params as { sessionId: string; participantId: string };
    const input = await validateSchema(updateParticipantProgressSchema, request.body);
    const participant = await skillzyStore.updateParticipantProgress(
      sessionId,
      participantId,
      input.currentQuestionIndex
    );
    if (!participant) {
      return fail(reply, "participant_not_found", "Participant not found.", 404);
    }
    const snapshot = await skillzyStore.getSessionSnapshot(sessionId);
    await sessionRuntime.broadcastSessionState(sessionId);
    return ok(reply, snapshot ?? participant);
  });
}
