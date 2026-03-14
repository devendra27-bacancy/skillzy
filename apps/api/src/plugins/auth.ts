import type { FastifyInstance } from "fastify";

export async function registerAuthPlugin(app: FastifyInstance) {
  app.decorateRequest("authUser", null);
}
