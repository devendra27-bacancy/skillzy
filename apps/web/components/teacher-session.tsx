"use client";

import type { Question, SessionSnapshot } from "@skillzy/types";
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { socket } from "../lib/socket";
import { CreamCard } from "./shell";

function isRatingResponse(
  response: SessionSnapshot["responses"][number]
): response is Extract<SessionSnapshot["responses"][number], { type: "rating-scale" | "rating" }> {
  return response.type === "rating-scale" || response.type === "rating";
}

function isChoiceQuestion(question: Question): question is Extract<Question, { type: "multiple-choice" | "mcq" }> {
  return question.type === "multiple-choice" || question.type === "mcq";
}

function isRatingQuestion(question: Question): question is Extract<Question, { type: "rating-scale" | "rating" }> {
  return question.type === "rating-scale" || question.type === "rating";
}

export function TeacherSession({ initialSnapshot }: { initialSnapshot: SessionSnapshot }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [connectionState, setConnectionState] = useState<"connecting" | "connected" | "reconnecting">(
    "connecting"
  );
  const [exportCsv, setExportCsv] = useState("");

  useEffect(() => {
    socket.connect();
    const handleConnect = () => setConnectionState("connected");
    const handleDisconnect = () => setConnectionState("reconnecting");

    socket.emit("session:subscribe", snapshot.session.id);
    socket.on("session:updated", (nextSnapshot: SessionSnapshot | null) => {
      if (nextSnapshot) setSnapshot(nextSnapshot);
    });
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    return () => {
      socket.off("session:updated");
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.disconnect();
    };
  }, [snapshot.session.id]);

  const activeQuestion = snapshot.questions.find(
    (question) => question.id === snapshot.session.activeQuestionId
  );
  const currentSlide = snapshot.slides[snapshot.session.currentSlideIndex];

  const analytics = useMemo(() => {
    if (!activeQuestion) return null;
    const responses = snapshot.responses.filter((response) => response.questionId === activeQuestion.id);
    if (activeQuestion && isChoiceQuestion(activeQuestion)) {
      return activeQuestion.options.map((option, index) => ({
        option: typeof option === "string" ? option : option.text,
        count: responses.filter(
          (response) =>
            (response.type === "multiple-choice" || response.type === "mcq") &&
            response.selectedOptionIndexes.includes(index)
        ).length
      }));
    }
    if (activeQuestion && isRatingQuestion(activeQuestion)) {
      const ratingResponses = responses.filter(isRatingResponse);
      return {
        average:
          ratingResponses.length === 0
            ? 0
            : ratingResponses.reduce((total, response) => total + response.rating, 0) /
              ratingResponses.length
      };
    }
    return responses;
  }, [activeQuestion, snapshot.responses]);

  function sendControl(
    action: "advance-slide" | "set-question" | "toggle-results",
    payload?: Record<string, unknown>
  ) {
    socket.emit("teacher:control", {
      sessionId: snapshot.session.id,
      action,
      ...payload
    });
  }

  async function startSession() {
    await api.startSession(snapshot.session.id);
    setSnapshot(await api.getSession(snapshot.session.id));
  }

  async function endSession() {
    await api.endSession(snapshot.session.id);
    setSnapshot(await api.getSession(snapshot.session.id));
  }

  async function handleExport() {
    setExportCsv(await api.exportSession(snapshot.session.id));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.9fr]">
      <section className="space-y-4">
        {connectionState !== "connected" ? (
          <div className="rounded-[1.5rem] border border-[#f3d9a8] bg-[#fff6e8] px-4 py-3 text-sm text-[#8f6419]">
            {connectionState === "connecting"
              ? "Connecting the live teacher controls..."
              : "Realtime connection dropped. Reconnecting now."}
          </div>
        ) : null}
        <CreamCard className="ticket-notch pt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-skillzy-soft">Live controller</p>
              <h1 className="mt-2 text-3xl font-semibold">{snapshot.deck.title}</h1>
            </div>
            <span className="rounded-full bg-skillzy-ink px-4 py-2 text-sm font-semibold text-white">
              Join code {snapshot.session.joinCode}
            </span>
          </div>
          <p className="mt-4 text-skillzy-soft">{currentSlide?.title}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={startSession} className="rounded-full bg-skillzy-ink px-4 py-3 text-white">
              Start session
            </button>
            <button onClick={endSession} className="rounded-full border border-black/10 px-4 py-3">
              End session
            </button>
            <button onClick={handleExport} className="rounded-full border border-black/10 px-4 py-3">
              Export CSV
            </button>
            <button
              onClick={() => sendControl("toggle-results")}
              className="rounded-full border border-black/10 px-4 py-3"
            >
              {snapshot.session.revealResults ? "Hide results" : "Reveal results"}
            </button>
            <a
              href={`/projector/${snapshot.session.id}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-black/10 px-4 py-3"
            >
              Open projector
            </a>
            <a
              href={`/teacher/sessions/${snapshot.session.id}/summary`}
              className="rounded-full border border-black/10 px-4 py-3"
            >
              View summary
            </a>
          </div>
        </CreamCard>

        <CreamCard>
          <h2 className="text-xl font-semibold">Slides</h2>
          <div className="mt-4 grid gap-3">
            {snapshot.slides.map((slide) => {
              const question = snapshot.questions.find((item) => item.slideId === slide.id);
              return (
                <div key={slide.id} className="rounded-[1.5rem] border border-black/10 bg-white/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-skillzy-soft">Slide {slide.index + 1}</p>
                      <h3 className="text-lg font-semibold">{slide.title}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => sendControl("advance-slide", { slideIndex: slide.index })}
                        className="rounded-full border border-black/10 px-3 py-2 text-sm"
                      >
                        Present
                      </button>
                      {question ? (
                        <button
                          onClick={() => sendControl("set-question", { questionId: question.id })}
                          className="rounded-full bg-skillzy-ink px-3 py-2 text-sm text-white"
                        >
                          Activate question
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CreamCard>
      </section>

      <section className="space-y-4">
        <CreamCard>
          <h2 className="text-xl font-semibold">Participation</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Metric label="Students joined" value={snapshot.participants.length} />
            <Metric label="Responses" value={snapshot.responses.length} />
            <Metric label="Active slide" value={snapshot.session.currentSlideIndex + 1} />
            <Metric label="Status" value={snapshot.session.status} />
          </div>
        </CreamCard>

        {activeQuestion ? (
          <CreamCard>
            <h3 className="text-xl font-semibold">{activeQuestion.prompt}</h3>
            <AnalyticsView question={activeQuestion} analytics={analytics} />
          </CreamCard>
        ) : null}

        {exportCsv ? (
          <CreamCard>
            <h3 className="text-xl font-semibold">CSV preview</h3>
            <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-[1.5rem] bg-white/70 p-4 text-sm">
              {exportCsv}
            </pre>
          </CreamCard>
        ) : null}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[1.5rem] bg-white/70 p-4">
      <p className="text-sm text-skillzy-soft">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function AnalyticsView({ question, analytics }: { question: Question; analytics: unknown }) {
  if (question.type === "multiple-choice" && Array.isArray(analytics)) {
    return (
      <div className="mt-4 space-y-3">
        {(analytics as { option: string; count: number }[]).map((item) => (
          <div key={item.option}>
            <div className="mb-1 flex justify-between text-sm">
              <span>{item.option}</span>
              <span>{item.count}</span>
            </div>
            <div className="h-3 rounded-full bg-black/10">
              <div
                className="h-3 rounded-full bg-skillzy-warm"
                style={{ width: `${Math.max(item.count * 15, item.count ? 18 : 0)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (question.type === "rating-scale" && analytics && typeof analytics === "object") {
    const average = (analytics as { average?: number }).average ?? 0;
    return (
      <div className="mt-4 rounded-[1.5rem] bg-white/70 p-4">
        <p className="text-sm text-skillzy-soft">Average rating</p>
        <p className="mt-1 text-3xl font-semibold">{average.toFixed(1)}</p>
      </div>
    );
  }

  if (Array.isArray(analytics)) {
    return (
      <ul className="mt-4 space-y-3">
        {analytics.map((response) => (
          <li key={(response as { id: string }).id} className="rounded-[1.5rem] bg-white/70 p-4">
            {"text" in (response as object)
              ? (response as { text: string }).text
              : "Student submitted a non-text response."}
          </li>
        ))}
      </ul>
    );
  }

  return null;
}
