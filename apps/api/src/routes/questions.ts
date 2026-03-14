import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { CreateQuestionInput, UpdateQuestionInput } from "@skillzy/types";
import { ok } from "./helpers";
import { skillzyStore } from "../services/store";
import { validateSchema } from "../middleware/validateSchema";

const legacyQuestionSchema = z.object({
  slideId: z.string().optional(),
  sessionId: z.string().optional(),
  slideIndex: z.number().optional(),
  type: z.string(),
  prompt: z.string().min(1),
  anonymous: z.boolean(),
  timer: z.any().optional(),
  explanation: z.string().optional(),
  options: z.array(z.string()).optional(),
  allowMultiple: z.boolean().optional(),
  correctOptionIndexes: z.array(z.number()).optional(),
  maxLength: z.number().optional(),
  placeholder: z.string().optional(),
  minLabel: z.string().optional(),
  maxLabel: z.string().optional(),
  scale: z.number().optional(),
  correctRating: z.number().optional(),
  hotspotLabel: z.string().optional(),
  imageUrl: z.string().optional(),
  correctPoint: z.object({ x: z.number(), y: z.number() }).optional(),
  items: z.array(z.string()).optional(),
  correctOrder: z.array(z.string()).optional()
});

export async function registerQuestionRoutes(app: FastifyInstance) {
  app.post("/api/questions", async (request, reply) => {
    const input = (await validateSchema(legacyQuestionSchema, request.body)) as CreateQuestionInput;
    return ok(reply, await skillzyStore.createQuestion(input), 201);
  });

  app.put("/api/questions/:questionId", async (request, reply) => {
    const questionId = (request.params as { questionId: string }).questionId;
    const input = (await validateSchema(legacyQuestionSchema, request.body)) as Omit<
      UpdateQuestionInput,
      "id"
    >;
    return ok(reply, await skillzyStore.upsertQuestion({ ...input, id: questionId } as UpdateQuestionInput));
  });
}
