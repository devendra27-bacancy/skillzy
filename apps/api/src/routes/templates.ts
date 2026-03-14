import type { FastifyInstance } from "fastify";
import { fail, ok } from "./helpers";
import { skillzyStore } from "../services/store";

export async function registerTemplateRoutes(app: FastifyInstance) {
  app.get("/api/templates", async (_request, reply) => ok(reply, await skillzyStore.listTemplates()));
  app.post("/api/templates", async (request, reply) => {
    return ok(reply, await skillzyStore.createTemplate(request.body as never), 201);
  });
  app.get("/api/templates/:id", async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const template = (await skillzyStore.listTemplates()).find((item) => item.id === id);
    if (!template) return fail(reply, "template_not_found", "Template not found.", 404);
    return ok(reply, template);
  });
}
