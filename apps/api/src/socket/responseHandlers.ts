import { SkillzySocketEvent } from "@skillzy/types";
import { z } from "zod";
import type { Server } from "socket.io";
import { skillzyStore } from "../services/store";

const responseSchema = z.object({
  sessionId: z.string(),
  questionId: z.string(),
  participantId: z.string(),
  type: z.enum([
    "multiple-choice",
    "text",
    "drawing",
    "rating-scale",
    "image-hotspot",
    "drag-rank",
    "true_false"
  ]),
  payload: z.object({
    selectedOptionIndexes: z.array(z.number()).optional(),
    text: z.string().optional(),
    strokes: z.string().optional(),
    rating: z.number().optional(),
    point: z.object({ x: z.number(), y: z.number() }).optional(),
    orderedItems: z.array(z.string()).optional()
  })
});

export function registerResponseHandlers(io: Server, socket: Parameters<Server["on"]>[1] extends (socket: infer T)=>unknown ? T : never) {
  socket.on(SkillzySocketEvent.ResponseSubmit, async (payload: unknown) => {
    const parsed = responseSchema.safeParse(payload);
    if (!parsed.success) {
      socket.emit(SkillzySocketEvent.Error, {
        code: "invalid_response_payload",
        message: "Response payload is invalid."
      });
      return;
    }

    await skillzyStore.submitResponse(parsed.data);
    const snapshot = await skillzyStore.getSessionSnapshot(parsed.data.sessionId);
    io.to(parsed.data.sessionId).emit(SkillzySocketEvent.SessionState, snapshot);
  });
}
