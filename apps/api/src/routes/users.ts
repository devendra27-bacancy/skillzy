import type { FastifyInstance } from "fastify";
import { ok } from "./helpers";
import { skillzyStore } from "../services/store";

export async function registerUserRoutes(app: FastifyInstance) {
  app.get("/api/auth/session", async (_request, reply) => ok(reply, await skillzyStore.getAuthSession()));
  app.get("/api/auth/me", async (_request, reply) => ok(reply, await skillzyStore.getTeacher()));
  app.post("/api/auth/logout", async (_request, reply) => ok(reply, { loggedOut: true }));
  app.get("/api/dashboard", async (_request, reply) => ok(reply, await skillzyStore.listDashboard()));
  app.get("/api/classes", async (_request, reply) => ok(reply, await skillzyStore.listClasses()));
}
