import { z } from "zod";

export const createSessionSchema = z.object({
  deckId: z.string(),
  classId: z.string()
});

export const joinSessionSchema = z.object({
  joinCode: z.string().length(4),
  displayName: z.string().min(1).max(48),
  reconnectToken: z.string().optional()
});

export const updateSessionSchema = z.object({
  title: z.string().min(1).optional(),
  anonymous_mode: z.boolean().optional(),
  status: z.enum(["draft", "waiting", "live", "paused", "ended", "deleted"]).optional()
});
