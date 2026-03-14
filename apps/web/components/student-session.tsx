"use client";

import type { Question, SessionSnapshot } from "@skillzy/types";
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { socket } from "../lib/socket";
import { CreamCard } from "./shell";

function drawPlaceholder() {
  return "M10 10 L90 90";
}

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

function getChoiceOptionLabel(option: string | { id: string; text: string; isCorrect?: boolean }) {
  return typeof option === "string" ? option : option.text;
}

export function StudentSession({
  sessionId,
  initialSnapshot
}: {
  sessionId: string;
  initialSnapshot: SessionSnapshot;
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [connectionState, setConnectionState] = useState<"connecting" | "connected" | "reconnecting">(
    "connecting"
  );
  const [textAnswer, setTextAnswer] = useState("");
  const [mcqAnswer, setMcqAnswer] = useState<number[]>([]);
  const [drawingAnswer, setDrawingAnswer] = useState(drawPlaceholder());
  const [ratingAnswer, setRatingAnswer] = useState(0);
  const [hotspotAnswer, setHotspotAnswer] = useState({ x: 50, y: 50 });
  const [rankAnswer, setRankAnswer] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const currentSlide = snapshot.slides[snapshot.session.currentSlideIndex];
  const activeQuestion = snapshot.questions.find(
    (question) => question.id === snapshot.session.activeQuestionId
  );
  const participantId =
    typeof window !== "undefined" ? localStorage.getItem("skillzyParticipantId") ?? "" : "";

  useEffect(() => {
    socket.connect();
    const handleConnect = () => setConnectionState("connected");
    const handleDisconnect = () => setConnectionState("reconnecting");

    socket.emit("session:subscribe", sessionId);
    socket.on("session:updated", (nextSnapshot: SessionSnapshot | null) => {
      if (nextSnapshot) {
        setSnapshot(nextSnapshot);
      }
    });
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    return () => {
      socket.off("session:updated");
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.disconnect();
    };
  }, [sessionId]);

  useEffect(() => {
    setSubmitted(false);
  }, [activeQuestion?.id]);

  const analytics = useMemo(() => {
    if (!activeQuestion || !snapshot.session.revealResults) return null;
    const responses = snapshot.responses.filter((response) => response.questionId === activeQuestion.id);
    if (isChoiceQuestion(activeQuestion)) {
      return activeQuestion.options.map((option, index) => ({
        option: getChoiceOptionLabel(option),
        count: responses.filter(
          (response) =>
            (response.type === "multiple-choice" || response.type === "mcq") &&
            response.selectedOptionIndexes.includes(index)
        ).length
      }));
    }
    if (isRatingQuestion(activeQuestion)) {
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
  }, [activeQuestion, snapshot.responses, snapshot.session.revealResults]);

  async function submit() {
    if (!activeQuestion || !participantId) return;
    const payload =
      isChoiceQuestion(activeQuestion)
        ? { selectedOptionIndexes: mcqAnswer }
        : activeQuestion.type === "text"
          ? { text: textAnswer }
        : activeQuestion.type === "drawing"
          ? { strokes: drawingAnswer }
            : isRatingQuestion(activeQuestion)
              ? { rating: ratingAnswer }
              : activeQuestion.type === "image-hotspot"
                ? { point: hotspotAnswer }
                : { orderedItems: rankAnswer };

    await api.submitResponse({
      sessionId,
      questionId: activeQuestion.id,
      participantId,
      type: activeQuestion.type,
      payload
    });

    socket.emit("response:submit", {
      sessionId,
      questionId: activeQuestion.id,
      participantId,
      type: activeQuestion.type,
      payload
    });
    setSubmitted(true);
  }

  return (
    <div className="space-y-5">
      {connectionState !== "connected" ? (
        <div className="rounded-[1.5rem] border border-[#f3d9a8] bg-[#fff6e8] px-4 py-3 text-sm text-[#8f6419]">
          {connectionState === "connecting"
            ? "Connecting to the live classroom..."
            : "Connection lost. Trying to reconnect now."}
        </div>
      ) : null}
      <CreamCard className="ticket-notch pt-10">
        <p className="text-sm uppercase tracking-[0.25em] text-skillzy-soft">Live class</p>
        <h1 className="mt-2 text-3xl font-semibold">{snapshot.deck.title}</h1>
        <p className="mt-2 text-skillzy-soft">{currentSlide?.body}</p>
      </CreamCard>

      {activeQuestion ? (
        <CreamCard>
          <p className="text-sm uppercase tracking-[0.25em] text-skillzy-soft">
            {activeQuestion.type.replace("-", " ")}
          </p>
          <h2 className="mt-2 text-2xl font-semibold">{activeQuestion.prompt}</h2>
          <QuestionResponseForm
            question={activeQuestion}
            disabled={submitted}
            textAnswer={textAnswer}
            setTextAnswer={setTextAnswer}
            mcqAnswer={mcqAnswer}
            setMcqAnswer={setMcqAnswer}
            drawingAnswer={drawingAnswer}
            setDrawingAnswer={setDrawingAnswer}
            ratingAnswer={ratingAnswer}
            setRatingAnswer={setRatingAnswer}
            hotspotAnswer={hotspotAnswer}
            setHotspotAnswer={setHotspotAnswer}
            rankAnswer={rankAnswer}
            setRankAnswer={setRankAnswer}
          />
          {submitted ? (
            <div className="mt-5 rounded-[1.5rem] bg-[#e7f6ec] p-4 text-sm text-[#235a35]">
              Response submitted successfully. You can wait for your teacher to move to the next question.
            </div>
          ) : null}
          <button
            onClick={submit}
            disabled={submitted}
            className="mt-5 w-full rounded-full bg-skillzy-ink px-5 py-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitted ? "Response submitted" : "Submit response"}
          </button>
        </CreamCard>
      ) : (
        <CreamCard>
          <p className="text-sm text-skillzy-soft">Waiting for your teacher to activate a question.</p>
        </CreamCard>
      )}

      {analytics ? (
        <CreamCard>
          <h3 className="text-xl font-semibold">Class reveal</h3>
          {isChoiceAnalytics(analytics) ? (
            <div className="mt-4 space-y-3">
              {analytics.map((item) => (
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
          ) : isRatingAnalytics(analytics) ? (
            <div className="mt-4 rounded-[1.5rem] bg-white/70 p-4">
              <p className="text-sm text-skillzy-soft">Average confidence</p>
              <p className="mt-1 text-3xl font-semibold">{analytics.average.toFixed(1)}</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {(analytics as SessionSnapshot["responses"]).map((response) => (
                <li key={response.id} className="rounded-3xl bg-white/70 p-3">
                  {response.type === "text" ? response.text : "A classmate shared a sketch."}
                </li>
              ))}
            </ul>
          )}
        </CreamCard>
      ) : null}
    </div>
  );
}

function isChoiceAnalytics(
  value:
    | SessionSnapshot["responses"]
    | { option: string; count: number }[]
    | { average: number }
    | null
): value is { option: string; count: number }[] {
  return Array.isArray(value) && value.length > 0 && "option" in value[0];
}

function isRatingAnalytics(
  value: SessionSnapshot["responses"] | { average: number } | { option: string; count: number }[] | null
): value is { average: number } {
  return value !== null && !Array.isArray(value) && "average" in value;
}

function QuestionResponseForm({
  question,
  disabled,
  textAnswer,
  setTextAnswer,
  mcqAnswer,
  setMcqAnswer,
  drawingAnswer,
  setDrawingAnswer,
  ratingAnswer,
  setRatingAnswer,
  hotspotAnswer,
  setHotspotAnswer,
  rankAnswer,
  setRankAnswer
}: {
  question: Question;
  disabled: boolean;
  textAnswer: string;
  setTextAnswer: (value: string) => void;
  mcqAnswer: number[];
  setMcqAnswer: (value: number[]) => void;
  drawingAnswer: string;
  setDrawingAnswer: (value: string) => void;
  ratingAnswer: number;
  setRatingAnswer: (value: number) => void;
  hotspotAnswer: { x: number; y: number };
  setHotspotAnswer: (value: { x: number; y: number }) => void;
  rankAnswer: string[];
  setRankAnswer: (value: string[]) => void;
}) {
  if (question.type === "multiple-choice" || question.type === "mcq") {
    return (
      <div className="mt-4 space-y-3">
        {question.options.map((option, index) => {
          const active = mcqAnswer.includes(index);
          const optionLabel = getChoiceOptionLabel(option);
          const optionKey = typeof option === "string" ? option : option.id;
          return (
            <button
              type="button"
              key={optionKey}
              disabled={disabled}
              onClick={() =>
                setMcqAnswer(
                  question.allowMultiple
                    ? active
                      ? mcqAnswer.filter((item) => item !== index)
                      : [...mcqAnswer, index]
                    : [index]
                )
              }
              className={`w-full rounded-3xl border px-4 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                active ? "border-skillzy-ink bg-skillzy-ink text-white" : "border-black/10 bg-white/70"
              }`}
            >
              {optionLabel}
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === "text") {
    return (
      <textarea
        value={textAnswer}
        disabled={disabled}
        onChange={(event) => setTextAnswer(event.target.value.slice(0, question.maxLength))}
        className="mt-4 min-h-40 w-full rounded-[1.5rem] border border-black/10 bg-white/70 p-4 outline-none disabled:cursor-not-allowed disabled:opacity-60"
        placeholder="Type your answer here..."
      />
    );
  }

  if (question.type === "rating-scale" || question.type === "rating") {
    return (
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between text-sm text-skillzy-soft">
          <span>{question.minLabel}</span>
          <span>{question.maxLabel}</span>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: question.scale ?? 5 }, (_, index) => index + 1).map((value) => (
            <button
              key={value}
              type="button"
              disabled={disabled}
              onClick={() => setRatingAnswer(value)}
              className={`rounded-full px-4 py-4 text-lg font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
                ratingAnswer === value ? "bg-skillzy-ink text-white" : "bg-white/70"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (question.type === "image-hotspot") {
    return (
      <div className="mt-4 space-y-3">
        <p className="text-sm text-skillzy-soft">{question.hotspotLabel}</p>
        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            setHotspotAnswer({
              x: Math.max(5, Math.min(95, hotspotAnswer.x + 10)),
              y: Math.max(5, Math.min(95, hotspotAnswer.y + 8))
            })
          }
          className="rounded-full border border-black/10 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          Move hotspot marker
        </button>
        <div className="relative h-48 rounded-[1.5rem] bg-[#fbf6e7]">
          <div
            className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-skillzy-warm"
            style={{ left: `${hotspotAnswer.x}%`, top: `${hotspotAnswer.y}%` }}
          />
        </div>
      </div>
    );
  }

  if (question.type === "drag-rank") {
    const currentItems = rankAnswer.length > 0 ? rankAnswer : question.items;
    return (
      <div className="mt-4 space-y-3">
        {currentItems.map((item, index) => (
          <div key={item} className="flex items-center justify-between rounded-3xl bg-white/70 px-4 py-3">
            <span>{item}</span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  const next = [...currentItems];
                  if (index > 0) [next[index - 1], next[index]] = [next[index], next[index - 1]];
                  setRankAnswer(next);
                }}
                className="rounded-full border border-black/10 px-3 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-60"
              >
                Up
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  const next = [...currentItems];
                  if (index < next.length - 1) [next[index + 1], next[index]] = [next[index], next[index + 1]];
                  setRankAnswer(next);
                }}
                className="rounded-full border border-black/10 px-3 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-60"
              >
                Down
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-[1.5rem] border border-dashed border-black/15 bg-white/70 p-4">
      <div className="mb-3 rounded-[1.25rem] bg-white p-4 text-sm text-skillzy-soft">
        Drawing mode is represented by editable SVG path data in this MVP.
      </div>
      <textarea
        value={drawingAnswer}
        disabled={disabled}
        onChange={(event) => setDrawingAnswer(event.target.value)}
        className="h-24 w-full rounded-2xl border border-black/10 p-3 outline-none disabled:cursor-not-allowed disabled:opacity-60"
      />
      <svg viewBox="0 0 100 100" className="mt-4 h-40 w-full rounded-[1.25rem] bg-[#fbf6e7] p-3">
        <path
          d={drawingAnswer}
          stroke="#171411"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
