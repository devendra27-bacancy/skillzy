import type { FastifyInstance } from "fastify";
import { registerAnalyticsRoutes } from "./analytics";
import { registerExportRoutes } from "./export";
import { registerQuestionRoutes } from "./questions";
import { registerResponseRoutes } from "./responses";
import { registerSessionRoutes } from "./sessions";
import { registerSlideRoutes } from "./slides";
import { registerTemplateRoutes } from "./templates";
import { registerUserRoutes } from "./users";

export async function registerHttpRoutes(app: FastifyInstance) {
  await registerUserRoutes(app);
  await registerTemplateRoutes(app);
  await registerSessionRoutes(app);
  await registerSlideRoutes(app);
  await registerQuestionRoutes(app);
  await registerResponseRoutes(app);
  await registerAnalyticsRoutes(app);
  await registerExportRoutes(app);
}
