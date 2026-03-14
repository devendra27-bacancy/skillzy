import { z } from "zod";

export const questionTypeSchema = z.enum(["mcq", "text", "drawing", "rating", "true_false"]);

export const createQuestionSchema = z.object({
  sessionId: z.string().optional(),
  slideId: z.string().optional(),
  slideIndex: z.number().optional(),
  type: questionTypeSchema,
  prompt: z.string().min(1),
  anonymous: z.boolean().default(true),
  orderIndex: z.number().default(0),
  timeLimitS: z.number().nullable().optional(),
  options: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        isCorrect: z.boolean().optional()
      })
    )
    .optional(),
  correctId: z.string().optional()
});

export const updateQuestionSchema = createQuestionSchema.partial();
