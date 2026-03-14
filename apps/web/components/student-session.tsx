"use client";

import type { Question, SessionSnapshot, SubmitResponseInput } from "@skillzy/types";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";
import { socket } from "../lib/socket";
import { CreamCard } from "./shell";

const SESSION_STATE_EVENT = "session:state";
const DEFAULT_TIMER_DURATION = 45;
const AUTO_ADVANCE_DELAY_MS = 1500;

type TimedOutcomeStatus = "correct" | "wrong" | "skipped";

type TimedQuestionResult = {
  questionId: string;
  prompt: string;
  status: TimedOutcomeStatus;
  score: number;
  responseLabel: string;
  correctAnswerLabel: string | null;
};

type TimedFeedback = {
  questionId: string;
  status: TimedOutcomeStatus;
  message: string;
};

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

function getCorrectAnswerLabel(question: Question) {
  if (question.type === "multiple-choice" || question.type === "mcq") {
    const indexes = question.correctOptionIndexes ?? [];
    if (indexes.length === 0) return null;
    return indexes
      .map((index) => question.options[index])
      .filter(Boolean)
      .map((option) => getChoiceOptionLabel(option as string | { id: string; text: string; isCorrect?: boolean }))
      .join(", ");
  }

  if (question.type === "rating-scale" || question.type === "rating") {
    return question.correctRating ? `Correct rating: ${question.correctRating}` : null;
  }

  if (question.type === "drag-rank") {
    return question.correctOrder?.join(" -> ") ?? null;
  }

  if (question.type === "true_false") {
    return question.correctId === "true" ? "True" : question.correctId === "false" ? "False" : null;
  }

  return null;
}

function areNumberSetsEqual(left: number[], right: number[]) {
  if (left.length !== right.length) return false;
  const sortedLeft = [...left].sort((a, b) => a - b);
  const sortedRight = [...right].sort((a, b) => a - b);
  return sortedLeft.every((value, index) => value === sortedRight[index]);
}

function isResponseCorrect(question: Question, response: SessionSnapshot["responses"][number]) {
  if (response.questionId !== question.id) return false;

  if (
    (question.type === "multiple-choice" || question.type === "mcq") &&
    (response.type === "multiple-choice" || response.type === "mcq")
  ) {
    return areNumberSetsEqual(response.selectedOptionIndexes, question.correctOptionIndexes ?? []);
  }

  if (
    (question.type === "rating-scale" || question.type === "rating") &&
    (response.type === "rating-scale" || response.type === "rating")
  ) {
    return question.correctRating !== undefined && response.rating === question.correctRating;
  }

  if (question.type === "drag-rank" && response.type === "drag-rank") {
    return JSON.stringify(response.orderedItems) === JSON.stringify(question.correctOrder ?? []);
  }

  if (question.type === "true_false" && response.type === "true_false") {
    return question.correctId !== undefined && response.selectedId === question.correctId;
  }

  return false;
}

function getQuestionDuration(question: Question) {
  return question.timer?.durationSeconds ?? question.timeLimitS ?? DEFAULT_TIMER_DURATION;
}

function questionHasTimer(question: Question) {
  return Boolean(question.timer?.enabled);
}

function formatQuestionType(question: Question) {
  return question.type.replace(/[-_]/g, " ");
}

function formatTimedResponseLabel(question: Question, payload: SubmitResponseInput["payload"]) {
  if (question.type === "multiple-choice" || question.type === "mcq") {
    return (payload.selectedOptionIndexes ?? [])
      .map((index) => question.options[index])
      .filter(Boolean)
      .map((option) => getChoiceOptionLabel(option as string | { id: string; text: string; isCorrect?: boolean }))
      .join(", ");
  }

  if (question.type === "text") {
    return payload.text?.trim() || "Text response submitted";
  }

  if (question.type === "drawing") {
    return "Drawing submitted";
  }

  if (question.type === "rating-scale" || question.type === "rating") {
    return `Rating ${payload.rating ?? 0}`;
  }

  if (question.type === "image-hotspot") {
    return payload.point ? `Point ${payload.point.x}, ${payload.point.y}` : "Hotspot selected";
  }

  if (question.type === "drag-rank") {
    return payload.orderedItems?.join(" -> ") ?? "Order submitted";
  }

  if (question.type === "true_false") {
    return payload.selectedId ?? "Selection submitted";
  }

  return "Response submitted";
}

function evaluateTimedQuestion(
  question: Question,
  payload: SubmitResponseInput["payload"]
): TimedQuestionResult {
  const correctAnswerLabel = getCorrectAnswerLabel(question);
  const responseLabel = formatTimedResponseLabel(question, payload);
  let isCorrect = false;

  if (question.type === "multiple-choice" || question.type === "mcq") {
    isCorrect = areNumberSetsEqual(payload.selectedOptionIndexes ?? [], question.correctOptionIndexes ?? []);
  } else if (question.type === "rating-scale" || question.type === "rating") {
    isCorrect = question.correctRating !== undefined && payload.rating === question.correctRating;
  } else if (question.type === "drag-rank") {
    isCorrect = JSON.stringify(payload.orderedItems ?? []) === JSON.stringify(question.correctOrder ?? []);
  } else if (question.type === "true_false") {
    isCorrect = question.correctId !== undefined && payload.selectedId === question.correctId;
  }

  return {
    questionId: question.id,
    prompt: question.prompt,
    status: isCorrect ? "correct" : "wrong",
    score: isCorrect ? 1 : -0.25,
    responseLabel,
    correctAnswerLabel
  };
}

function buildSkippedQuestionResult(question: Question): TimedQuestionResult {
  return {
    questionId: question.id,
    prompt: question.prompt,
    status: "skipped",
    score: 0,
    responseLabel: "Timed out",
    correctAnswerLabel: getCorrectAnswerLabel(question)
  };
}

function buildTimedFeedback(status: TimedOutcomeStatus): TimedFeedback {
  return {
    questionId: "",
    status,
    message: status === "correct" ? "Correct!" : status === "wrong" ? "Wrong" : "Time's up!"
  };
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
  const [feedback, setFeedback] = useState<TimedFeedback | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timedResults, setTimedResults] = useState<Record<string, TimedQuestionResult>>({});
  const [burstKey, setBurstKey] = useState(0);
  const autoAdvanceRef = useRef<number | null>(null);
  const timeoutHandledRef = useRef(false);

  const orderedQuestions = useMemo(() => {
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
  }, [snapshot.questions, snapshot.slides]);

  const teacherDrivenQuestion = snapshot.questions.find(
    (question) => question.id === snapshot.session.activeQuestionId
  );
  const timedQuizMode = orderedQuestions.length > 0 && orderedQuestions.every(questionHasTimer);
  const activeQuestion = timedQuizMode
    ? orderedQuestions[currentQuestionIndex] ?? null
    : teacherDrivenQuestion ?? null;
  const currentSlide = activeQuestion
    ? snapshot.slides.find((slide) => slide.id === activeQuestion.slideId) ??
      snapshot.slides[snapshot.session.currentSlideIndex]
    : snapshot.slides[snapshot.session.currentSlideIndex];
  const participantId =
    typeof window !== "undefined" ? localStorage.getItem("skillzyParticipantId") ?? "" : "";
  const quizComplete = timedQuizMode && currentQuestionIndex >= orderedQuestions.length;
  const canShowQuestion = !timedQuizMode || snapshot.session.status !== "draft";

  useEffect(() => {
    socket.connect();
    const handleConnect = () => setConnectionState("connected");
    const handleDisconnect = () => setConnectionState("reconnecting");

    socket.emit("session:subscribe", sessionId);
    socket.on(SESSION_STATE_EVENT, (nextSnapshot: SessionSnapshot | null) => {
      if (nextSnapshot) {
        setSnapshot(nextSnapshot);
      }
    });
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    return () => {
      socket.off(SESSION_STATE_EVENT);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.disconnect();
    };
  }, [sessionId]);

  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current !== null) {
        window.clearTimeout(autoAdvanceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    timeoutHandledRef.current = false;
    setSubmitted(false);
    setFeedback(null);
    setTextAnswer("");
    setMcqAnswer([]);
    setDrawingAnswer(drawPlaceholder());
    setRatingAnswer(0);
    setHotspotAnswer({ x: 50, y: 50 });
    setRankAnswer(activeQuestion?.type === "drag-rank" ? [...activeQuestion.items] : []);
    setTimeRemaining(activeQuestion && questionHasTimer(activeQuestion) ? getQuestionDuration(activeQuestion) : null);
  }, [activeQuestion?.id]);

  useEffect(() => {
    if (!timedQuizMode || !activeQuestion || !questionHasTimer(activeQuestion) || submitted || feedback) {
      return;
    }

    if (snapshot.session.status === "draft" || snapshot.session.status === "ended") {
      return;
    }

    const duration = getQuestionDuration(activeQuestion);
    const startedAt = Date.now();

    const tick = () => {
      const elapsedSeconds = (Date.now() - startedAt) / 1000;
      const remainingSeconds = Math.max(0, duration - elapsedSeconds);
      setTimeRemaining(remainingSeconds);

      if (remainingSeconds <= 0 && !timeoutHandledRef.current) {
        timeoutHandledRef.current = true;
        const skippedResult = buildSkippedQuestionResult(activeQuestion);
        setTimedResults((current) => ({
          ...current,
          [activeQuestion.id]: skippedResult
        }));
        setSubmitted(true);
        setFeedback({
          ...buildTimedFeedback("skipped"),
          questionId: activeQuestion.id
        });
        autoAdvanceRef.current = window.setTimeout(() => {
          setCurrentQuestionIndex((index) => index + 1);
        }, AUTO_ADVANCE_DELAY_MS);
      }
    };

    tick();
    const interval = window.setInterval(tick, 100);
    return () => {
      window.clearInterval(interval);
    };
  }, [activeQuestion, feedback, snapshot.session.status, submitted, timedQuizMode]);

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

  const leaderboard = useMemo(() => {
    if (!snapshot.session.revealResults) return [];
    const gradableQuestions = snapshot.questions.filter((question) => Boolean(getCorrectAnswerLabel(question)));
    return snapshot.participants
      .map((participant) => {
        const participantResponses = snapshot.responses.filter((response) => response.participantId === participant.id);
        const correctCount = gradableQuestions.filter((question) =>
          participantResponses.some((response) => isResponseCorrect(question, response))
        ).length;
        return {
          participantId: participant.id,
          name: participant.displayName,
          correctCount,
          totalQuestions: gradableQuestions.length
        };
      })
      .sort((left, right) => right.correctCount - left.correctCount || left.name.localeCompare(right.name));
  }, [snapshot.participants, snapshot.questions, snapshot.responses, snapshot.session.revealResults]);

  const timedSummary = useMemo(() => {
    if (!timedQuizMode || !quizComplete) return null;
    const results = orderedQuestions.map((question) => timedResults[question.id] ?? buildSkippedQuestionResult(question));
    const correct = results.filter((result) => result.status === "correct").length;
    const wrong = results.filter((result) => result.status === "wrong").length;
    const skipped = results.filter((result) => result.status === "skipped").length;
    const attempted = correct + wrong;
    const score = results.reduce((total, result) => total + result.score, 0);
    return {
      score,
      totalQuestions: orderedQuestions.length,
      correct,
      wrong,
      skipped,
      attempted,
      results
    };
  }, [orderedQuestions, quizComplete, timedQuizMode, timedResults]);

  function buildPayload(question: Question): SubmitResponseInput["payload"] {
    if (isChoiceQuestion(question)) {
      return { selectedOptionIndexes: mcqAnswer };
    }

    if (question.type === "text") {
      return { text: textAnswer };
    }

    if (question.type === "drawing") {
      return { strokes: drawingAnswer };
    }

    if (isRatingQuestion(question)) {
      return { rating: ratingAnswer };
    }

    if (question.type === "image-hotspot") {
      return { point: hotspotAnswer };
    }

    if (question.type === "drag-rank") {
      return { orderedItems: rankAnswer };
    }

    return {};
  }

  async function submit() {
    if (!activeQuestion || !participantId || submitted) return;
    const payload = buildPayload(activeQuestion);

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

    if (!timedQuizMode) {
      return;
    }

    const result = evaluateTimedQuestion(activeQuestion, payload);
    setTimedResults((current) => ({
      ...current,
      [activeQuestion.id]: result
    }));
    setFeedback({
      ...buildTimedFeedback(result.status),
      questionId: activeQuestion.id
    });

    if (result.status === "correct") {
      setBurstKey((value) => value + 1);
    }

    autoAdvanceRef.current = window.setTimeout(() => {
      setCurrentQuestionIndex((index) => index + 1);
    }, AUTO_ADVANCE_DELAY_MS);
  }

  const progressPercent =
    timedQuizMode && activeQuestion && questionHasTimer(activeQuestion) && timeRemaining !== null
      ? Math.max(0, Math.min(100, (timeRemaining / getQuestionDuration(activeQuestion)) * 100))
      : null;

  return (
    <div className="space-y-5">
      {connectionState !== "connected" ? (
        <div className="rounded-[1.5rem] border border-[#f3d9a8] bg-[#fff6e8] px-4 py-3 text-sm text-[#8f6419]">
          {connectionState === "connecting"
            ? "Connecting to the live classroom..."
            : "Connection lost. Trying to reconnect now."}
        </div>
      ) : null}

      <CreamCard className="px-1 pb-1 pt-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="mt-1 line-clamp-2 text-xl font-semibold leading-tight">{snapshot.deck.title}</h1>
          </div>
          <span className="shrink-0 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-skillzy-soft">
            {timedQuizMode && !quizComplete && activeQuestion
              ? `Question ${currentQuestionIndex + 1}/${orderedQuestions.length}`
              : `Slide ${snapshot.session.currentSlideIndex + 1}`}
          </span>
        </div>
        {currentSlide?.body ? (
          <p className="mt-2 line-clamp-2 text-sm text-skillzy-soft">{currentSlide.body}</p>
        ) : null}
      </CreamCard>

      {timedSummary ? (
        <CreamCard>
          <p className="text-sm uppercase tracking-[0.25em] text-skillzy-soft">Quiz summary</p>
          <h2 className="mt-2 text-2xl font-semibold">You completed the timed quiz</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.5rem] bg-white/70 p-4">
              <p className="text-sm text-skillzy-soft">Total score</p>
              <p className="mt-1 text-3xl font-semibold">
                {timedSummary.score.toFixed(2)} / {timedSummary.totalQuestions}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-white/70 p-4">
              <p className="text-sm text-skillzy-soft">Attempts</p>
              <p className="mt-1 text-lg font-semibold">
                Correct: {timedSummary.correct} | Wrong: {timedSummary.wrong} | Skipped: {timedSummary.skipped}
              </p>
              <p className="mt-2 text-sm text-skillzy-soft">Attempted: {timedSummary.attempted}</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {timedSummary.results.map((result, index) => (
              <div key={result.questionId} className="rounded-[1.5rem] bg-white/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-skillzy-soft">Question {index + 1}</p>
                    <p className="mt-1 font-semibold">{result.prompt}</p>
                  </div>
                  <span className="text-lg font-semibold">
                    {result.status === "correct" ? "✓" : result.status === "wrong" ? "✗" : "⏱"}
                  </span>
                </div>
                <p className="mt-3 text-sm text-skillzy-soft">Your answer: {result.responseLabel}</p>
                {result.correctAnswerLabel ? (
                  <p className="mt-1 text-sm text-skillzy-soft">Correct answer: {result.correctAnswerLabel}</p>
                ) : null}
              </div>
            ))}
          </div>
        </CreamCard>
      ) : activeQuestion && canShowQuestion ? (
        <CreamCard className="overflow-hidden">
          <div className="relative">
            {feedback?.status === "correct" ? (
              <div key={burstKey} className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
                <div className="quiz-confetti-burst">
                  {Array.from({ length: 14 }, (_, index) => (
                    <span key={`${burstKey}-${index}`} className="quiz-confetti-piece" />
                  ))}
                </div>
              </div>
            ) : null}
            <p className="text-sm uppercase tracking-[0.25em] text-skillzy-soft">{formatQuestionType(activeQuestion)}</p>
            <h2 className="mt-2 text-2xl font-semibold">{activeQuestion.prompt}</h2>

            {timedQuizMode && questionHasTimer(activeQuestion) && progressPercent !== null ? (
              <div className="mt-5 rounded-[1.5rem] bg-white/70 p-4">
                <div className="flex items-center justify-between gap-3 text-sm font-semibold text-skillzy-soft">
                  <span>Time remaining</span>
                  <span>{Math.max(0, Math.ceil(timeRemaining ?? 0))}s</span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/10">
                  <div
                    className="h-full rounded-full bg-[#8b62ff] transition-[width] duration-100"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            ) : null}

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
              feedback={feedback}
            />

            {feedback?.questionId === activeQuestion.id ? (
              <div
                className={`mt-5 rounded-[1.5rem] px-4 py-4 text-sm font-semibold ${
                  feedback.status === "correct"
                    ? "bg-[#e7f6ec] text-[#235a35]"
                    : feedback.status === "wrong"
                      ? "bg-[#fff1ee] text-[#b4432e]"
                      : "bg-[#eef3ff] text-[#425f9a]"
                }`}
              >
                {feedback.status === "correct"
                  ? "✓ Correct!"
                  : feedback.status === "wrong"
                    ? "✗ Wrong"
                    : "⏱ Time's up!"}
              </div>
            ) : submitted ? (
              <div className="mt-5 rounded-[1.5rem] bg-[#e7f6ec] p-4 text-sm text-[#235a35]">
                Response submitted successfully. You can wait for your teacher to move to the next question.
              </div>
            ) : null}

            {(snapshot.session.revealResults || feedback?.status === "wrong" || feedback?.status === "skipped") &&
            activeQuestion ? (
              <div className="mt-4 rounded-[1.5rem] bg-[#fff6e8] p-4 text-sm text-[#8f6419]">
                <p className="font-semibold text-[#5f4817]">Correct answer</p>
                <p className="mt-1">
                  {getCorrectAnswerLabel(activeQuestion) ??
                    "Your teacher has revealed the class results for this question."}
                </p>
              </div>
            ) : null}

            <button
              onClick={submit}
              disabled={submitted || (isChoiceQuestion(activeQuestion) && mcqAnswer.length === 0)}
              className="mt-5 w-full rounded-full bg-skillzy-ink px-5 py-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitted ? "Response submitted" : "Submit response"}
            </button>
          </div>
        </CreamCard>
      ) : (
        <CreamCard>
          <p className="text-sm text-skillzy-soft">
            {timedQuizMode && snapshot.session.status === "draft"
              ? "Waiting for your teacher to start the timed quiz."
              : "Waiting for your teacher to activate a question."}
          </p>
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

      {snapshot.session.revealResults && leaderboard.length > 0 ? (
        <CreamCard>
          <h3 className="text-xl font-semibold">Leaderboard</h3>
          <div className="mt-4 space-y-3">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.participantId}
                className={`flex items-center justify-between rounded-[1.5rem] p-4 ${
                  entry.participantId === participantId ? "bg-[#f4efff] ring-2 ring-[#8b62ff]/20" : "bg-white/70"
                }`}
              >
                <div>
                  <p className="text-sm text-skillzy-soft">#{index + 1}</p>
                  <p className="font-semibold">
                    {entry.name}
                    {entry.participantId === participantId ? " (You)" : ""}
                  </p>
                </div>
                <p className="text-sm font-semibold text-skillzy-soft">
                  {entry.correctCount}/{entry.totalQuestions} correct
                </p>
              </div>
            ))}
          </div>
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
  setRankAnswer,
  feedback
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
  feedback: TimedFeedback | null;
}) {
  if (question.type === "multiple-choice" || question.type === "mcq") {
    return (
      <div className="mt-4 space-y-3">
        {question.options.map((option, index) => {
          const active = mcqAnswer.includes(index);
          const optionLabel = getChoiceOptionLabel(option);
          const optionKey = typeof option === "string" ? option : option.id;
          const isCorrectOption = (question.correctOptionIndexes ?? []).includes(index);
          const showCorrect = Boolean(
            feedback && (feedback.status === "correct" || feedback.status === "wrong" || feedback.status === "skipped")
          );
          const shouldGlowCorrect = showCorrect && isCorrectOption;
          const shouldShakeWrong = feedback?.status === "wrong" && active && !isCorrectOption;
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
                shouldGlowCorrect
                  ? "quiz-option-correct border-[#2a9d62] bg-[#e9f8ef] text-[#1b5a36]"
                  : shouldShakeWrong
                    ? "quiz-option-wrong border-[#d65d4a] bg-[#fff1ee] text-[#913427]"
                    : active
                      ? "border-skillzy-ink bg-skillzy-ink text-white"
                      : "border-black/10 bg-white/70"
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
        <path d={drawingAnswer} stroke="#171411" strokeWidth="5" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}
