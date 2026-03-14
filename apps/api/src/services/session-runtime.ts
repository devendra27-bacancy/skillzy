import type { Question, SessionSnapshot } from "@skillzy/types";
import { SkillzySocketEvent } from "@skillzy/types";
import type { Server } from "socket.io";
import { skillzyStore } from "./store";

type TimerHandle = ReturnType<typeof setTimeout>;

function getOrderedQuestions(snapshot: SessionSnapshot) {
  return snapshot.questions
    .slice()
    .sort((left, right) => {
      const leftSlide = snapshot.slides.find((slide) => slide.id === left.slideId);
      const rightSlide = snapshot.slides.find((slide) => slide.id === right.slideId);
      const leftIndex = leftSlide?.index ?? left.slideIndex ?? 0;
      const rightIndex = rightSlide?.index ?? right.slideIndex ?? 0;
      if (leftIndex !== rightIndex) return leftIndex - rightIndex;
      return (left.orderIndex ?? 0) - (right.orderIndex ?? 0);
    });
}

function isTimedSession(snapshot: SessionSnapshot) {
  const orderedQuestions = getOrderedQuestions(snapshot);
  return orderedQuestions.length > 0 && orderedQuestions.every((question) => Boolean(question.timer?.enabled));
}

function getQuestionDuration(question: Question) {
  return question.timer?.durationSeconds ?? question.timeLimitS ?? 45;
}

class SessionRuntimeManager {
  private io: Server | null = null;
  private endTimers = new Map<string, TimerHandle>();

  attach(io: Server) {
    this.io = io;
  }

  private clearEndTimer(sessionId: string) {
    const timer = this.endTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.endTimers.delete(sessionId);
    }
  }

  private async emitSnapshot(sessionId: string) {
    if (!this.io) return;
    const snapshot = await skillzyStore.getSessionSnapshot(sessionId);
    if (snapshot) {
      this.io.to(sessionId).emit(SkillzySocketEvent.SessionState, snapshot);
    }
  }

  async broadcastSessionState(sessionId: string) {
    await this.emitSnapshot(sessionId);
  }

  async startSession(sessionId: string) {
    const snapshot = await skillzyStore.getSessionSnapshot(sessionId);
    if (!snapshot) return null;

    if (!isTimedSession(snapshot)) {
      await skillzyStore.updateSession(
        sessionId,
        (existing) => ({
          ...existing,
          status: "live",
          startedAt: existing.startedAt ?? new Date().toISOString(),
          revealResults: false
        }),
        "session-started"
      );
      await this.emitSnapshot(sessionId);
      return await skillzyStore.getSessionSnapshot(sessionId);
    }

    const orderedQuestions = getOrderedQuestions(snapshot);
    const totalDurationSeconds = orderedQuestions.reduce(
      (total, question) => total + getQuestionDuration(question),
      0
    );
    const startedAt = new Date();
    const quizEndsAt = new Date(startedAt.getTime() + totalDurationSeconds * 1000).toISOString();

    this.clearEndTimer(sessionId);
    await skillzyStore.updateSession(
      sessionId,
      (existing) => ({
        ...existing,
        status: "live",
        startedAt: existing.startedAt ?? startedAt.toISOString(),
        revealResults: false,
        timerMode: true,
        totalTimedQuestions: orderedQuestions.length,
        questionStartedAt: startedAt.toISOString(),
        quizEndsAt
      }),
      "session-started"
    );

    const timer = setTimeout(async () => {
      await this.endSession(sessionId, true);
    }, totalDurationSeconds * 1000);
    this.endTimers.set(sessionId, timer);

    await this.emitSnapshot(sessionId);
    return await skillzyStore.getSessionSnapshot(sessionId);
  }

  async endSession(sessionId: string, autoReveal = true) {
    this.clearEndTimer(sessionId);
    const snapshot = await skillzyStore.getSessionSnapshot(sessionId);
    if (!snapshot) return null;

    await skillzyStore.updateSession(
      sessionId,
      (existing) => ({
        ...existing,
        status: "ended",
        endedAt: new Date().toISOString(),
        revealResults: autoReveal || existing.revealResults,
        timerMode: existing.timerMode ?? isTimedSession(snapshot)
      }),
      "session-ended"
    );
    await this.emitSnapshot(sessionId);
    return await skillzyStore.getSessionSnapshot(sessionId);
  }

  async stopSession(sessionId: string) {
    return this.endSession(sessionId, true);
  }
}

export const sessionRuntime = new SessionRuntimeManager();
