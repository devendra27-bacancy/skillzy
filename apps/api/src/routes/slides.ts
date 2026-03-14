import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { CreateSlideInput, UpdateSlideInput } from "@skillzy/types";
import { ok, fail } from "./helpers";
import { skillzyStore } from "../services/store";
import { validateSchema } from "../middleware/validateSchema";

const createSlideSchema = z.object({
  deckId: z.string(),
  title: z.string().min(1),
  body: z.string().min(1),
  imageUrl: z.string().optional()
});

const updateSlideSchema = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
  imageUrl: z.string().optional()
});

const importSchema = z.object({
  fileName: z.string().min(1),
  source: z.enum(["pptx", "pdf", "google-slides"])
});

export async function registerSlideRoutes(app: FastifyInstance) {
  app.post("/api/imports", async (request, reply) => {
    const input = await validateSchema(importSchema, request.body);
    return ok(reply, await skillzyStore.queueImport(input.fileName, input.source), 201);
  });

  app.post("/api/slides", async (request, reply) => {
    const input = (await validateSchema(createSlideSchema, request.body)) as CreateSlideInput;
    return ok(reply, await skillzyStore.createSlide(input), 201);
  });

  app.patch("/api/slides/:slideId", async (request, reply) => {
    const slideId = (request.params as { slideId: string }).slideId;
    const input = (await validateSchema(updateSlideSchema, request.body)) as UpdateSlideInput;
    const slide = await skillzyStore.updateSlide(slideId, input);
    if (!slide) return fail(reply, "slide_not_found", "Slide not found.", 404);
    return ok(reply, slide);
  });
}
