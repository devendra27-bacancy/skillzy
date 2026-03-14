import type { FastifyInstance } from "fastify";
import type { SubmitResponseInput } from "@skillzy/types";
import { z } from "zod";
import { fail, ok } from "./helpers";
import { skillzyStore } from "../services/store";
import { validateSchema } from "../middleware/validateSchema";

const submitResponseSchema = z.object({
  sessionId: z.string().min(1),
  questionId: z.string().min(1),
  participantId: z.string().min(1),
  studentToken: z.string().optional(),
  studentName: z.string().optional(),
  type: z.enum([
    "multiple-choice",
    "text",
    "drawing",
    "rating-scale",
    "image-hotspot",
    "drag-rank",
    "mcq",
    "rating",
    "true_false"
  ]),
  payload: z.object({
    selectedId: z.string().optional(),
    selectedOptionIndexes: z.array(z.number()).optional(),
    text: z.string().optional(),
    strokes: z.string().optional(),
    dataUrl: z.string().optional(),
    rating: z.number().optional(),
    point: z.object({ x: z.number(), y: z.number() }).optional(),
    orderedItems: z.array(z.string()).optional()
  })
});

export async function registerResponseRoutes(app: FastifyInstance) {
  app.post("/api/responses", async (request, reply) => {
    const input = (await validateSchema(submitResponseSchema, request.body)) as SubmitResponseInput;
    const response = await skillzyStore.submitResponse(input);
    if (!response) return fail(reply, "question_not_found", "Question not found.", 404);
    return ok(reply, response, 201);
  });

  app.post("/api/responses/:responseId/pin", async (request, reply) => {
    const responseId = (request.params as { responseId: string }).responseId;
    const response = await skillzyStore.pinTextResponse(responseId);
    if (!response) return fail(reply, "response_not_found", "Response not found.", 404);
    return ok(reply, response);
  });
}
