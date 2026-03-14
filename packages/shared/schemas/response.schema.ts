import { z } from "zod";
import { questionTypeSchema } from "./question.schema";

export const submitResponseSchema = z.object({
  sessionId: z.string(),
  questionId: z.string(),
  participantId: z.string().optional(),
  studentToken: z.string().optional(),
  studentName: z.string().optional(),
  type: questionTypeSchema.or(
    z.enum(["multiple-choice", "text", "drawing", "rating-scale", "image-hotspot", "drag-rank"])
  ),
  payload: z.object({
    selectedId: z.string().optional(),
    selectedOptionIndexes: z.array(z.number()).optional(),
    text: z.string().optional(),
    dataUrl: z.string().optional(),
    strokes: z.string().optional(),
    rating: z.number().optional(),
    point: z.object({ x: z.number(), y: z.number() }).optional(),
    orderedItems: z.array(z.string()).optional()
  }),
  value: z.record(z.string(), z.unknown()).optional()
});
