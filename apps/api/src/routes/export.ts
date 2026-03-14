import type { FastifyInstance } from "fastify";
import { fail, ok } from "./helpers";
import { skillzyStore } from "../services/store";

export async function registerExportRoutes(app: FastifyInstance) {
  app.post("/api/sessions/:sessionId/export", async (request, reply) => {
    const sessionId = (request.params as { sessionId: string }).sessionId;
    const exported = await skillzyStore.exportSession(sessionId);
    if (!exported) return fail(reply, "session_not_found", "Session not found.", 404);
    reply.header("Content-Type", "text/csv");
    reply.header(
      "Content-Disposition",
      `attachment; filename="skillzy-session-${sessionId}.csv"`
    );
    return reply.send(exported.csv);
  });

  app.post("/api/sessions/:id/export/csv", async (request, reply) => {
    const sessionId = (request.params as { id: string }).id;
    const exported = await skillzyStore.exportSession(sessionId);
    if (!exported) return fail(reply, "session_not_found", "Session not found.", 404);
    return ok(reply, exported.csv);
  });

  app.post("/api/sessions/:id/export/google", async (_request, reply) =>
    ok(reply, {
      message: "Google Classroom export is scaffolded and awaiting the OAuth scope upgrade.",
      exported: false
    })
  );
}
