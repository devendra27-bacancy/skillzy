import { SkillzySocketEvent, type Session as SkillzySession } from "@skillzy/types";
import { z } from "zod";
import type { Server } from "socket.io";
import { skillzyStore } from "../services/store";

const teacherControlSchema = z.object({
  sessionId: z.string(),
  action: z.enum(["advance-slide", "set-question", "toggle-results"]),
  slideIndex: z.number().optional(),
  questionId: z.string().optional()
});

export function registerSessionHandlers(io: Server, socket: Parameters<Server["on"]>[1] extends (socket: infer T)=>unknown ? T : never) {
  socket.on("session:subscribe", async (sessionId: string) => {
    socket.join(sessionId);
    const snapshot = await skillzyStore.getSessionSnapshot(sessionId);
    if (snapshot) socket.emit(SkillzySocketEvent.SessionState, snapshot);
  });

  socket.on("teacher:control", async (payload: unknown) => {
    const parsed = teacherControlSchema.safeParse(payload);
    if (!parsed.success) {
      socket.emit(SkillzySocketEvent.Error, {
        code: "invalid_teacher_control",
        message: "Teacher control payload is invalid."
      });
      return;
    }

    const { sessionId, action, slideIndex, questionId } = parsed.data;
    if (action === "advance-slide" && typeof slideIndex === "number") {
      await skillzyStore.updateSession(
        sessionId,
        (existing: SkillzySession) => ({
          ...existing,
          currentSlideIndex: slideIndex,
          currentSlide: slideIndex,
          activeQuestionId: undefined,
          revealResults: false
        }),
        "slide-advanced"
      );
    }

    if (action === "set-question") {
      await skillzyStore.updateSession(
        sessionId,
        (existing: SkillzySession) => ({
          ...existing,
          activeQuestionId: questionId,
          revealResults: false
        }),
        "question-activated"
      );
    }

    if (action === "toggle-results") {
      await skillzyStore.updateSession(
        sessionId,
        (existing: SkillzySession) => ({
          ...existing,
          revealResults: !existing.revealResults
        }),
        "results-revealed"
      );
    }

    const snapshot = await skillzyStore.getSessionSnapshot(sessionId);
    io.to(sessionId).emit(SkillzySocketEvent.SessionState, snapshot);
  });
}
