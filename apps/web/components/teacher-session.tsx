"use client";

import type { Question, SessionSnapshot } from "@skillzy/types";
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { socket } from "../lib/socket";
import { CreamCard } from "./shell";

const SESSION_STATE_EVENT = "session:state";

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

  if ((question.type === "multiple-choice" || question.type === "mcq") && (response.type === "multiple-choice" || response.type === "mcq")) {
    return areNumberSetsEqual(response.selectedOptionIndexes, question.correctOptionIndexes ?? []);
  }

  if ((question.type === "rating-scale" || question.type === "rating") && (response.type === "rating-scale" || response.type === "rating")) {
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
  return question.timer?.durationSeconds ?? question.timeLimitS ?? 45;
}

export function TeacherSession({ initialSnapshot }: { initialSnapshot: SessionSnapshot }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [connectionState, setConnectionState] = useState<"connecting" | "connected" | "reconnecting">(
    "connecting"
  );
  const [exportCsv, setExportCsv] = useState("");
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [busyAction, setBusyAction] = useState<"start" | "end" | "export" | "copy" | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    socket.connect();
    const handleConnect = () => setConnectionState("connected");
    const handleDisconnect = () => setConnectionState("reconnecting");

    socket.emit("session:subscribe", snapshot.session.id);
    socket.on(SESSION_STATE_EVENT, (nextSnapshot: SessionSnapshot | null) => {
      if (nextSnapshot) setSnapshot(nextSnapshot);
    });
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    return () => {
      socket.off(SESSION_STATE_EVENT);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.disconnect();
    };
  }, [snapshot.session.id]);

  const activeQuestion = snapshot.questions.find(
    (question) => question.id === snapshot.session.activeQuestionId
  );
  const currentSlide = snapshot.slides[snapshot.session.currentSlideIndex];
  const orderedQuestions = useMemo(
    () =>
      snapshot.questions
        .slice()
        .sort((left, right) => {
          const leftSlide = snapshot.slides.find((slide) => slide.id === left.slideId);
          const rightSlide = snapshot.slides.find((slide) => slide.id === right.slideId);
          const leftIndex = leftSlide?.index ?? left.slideIndex ?? 0;
          const rightIndex = rightSlide?.index ?? right.slideIndex ?? 0;
          if (leftIndex !== rightIndex) return leftIndex - rightIndex;
          return (left.orderIndex ?? 0) - (right.orderIndex ?? 0);
        }),
    [snapshot.questions, snapshot.slides]
  );
  const timedSession =
    Boolean(snapshot.session.timerMode) ||
    (orderedQuestions.length > 0 && orderedQuestions.every((question) => Boolean(question.timer?.enabled)));
  const currentQuestionPosition =
    typeof snapshot.session.timedQuestionIndex === "number"
      ? snapshot.session.timedQuestionIndex + 1
      : 0;

  const participantProgress = useMemo(
    () =>
      snapshot.participants.map((participant) => {
        const questionIndex = participant.currentQuestionIndex ?? 0;
        const question = orderedQuestions[questionIndex] ?? null;
        return {
          participantId: participant.id,
          name: participant.displayName,
          questionIndex,
          questionLabel:
            questionIndex >= orderedQuestions.length
              ? "Finished"
              : question
                ? `Question ${questionIndex + 1}`
                : "Waiting",
          questionPrompt: question?.prompt ?? "Completed all questions"
        };
      }),
    [orderedQuestions, snapshot.participants]
  );

  useEffect(() => {
    if (!timedSession || !snapshot.session.quizEndsAt || snapshot.session.status !== "live") {
      setTimeRemaining(null);
      return;
    }

    const endsAt = new Date(snapshot.session.quizEndsAt).getTime();

    const tick = () => {
      const remaining = (endsAt - Date.now()) / 1000;
      setTimeRemaining(Math.max(0, remaining));
    };

    tick();
    const interval = window.setInterval(tick, 100);
    return () => window.clearInterval(interval);
  }, [snapshot.session.quizEndsAt, snapshot.session.status, timedSession]);

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

  const answerKey = useMemo(
    () =>
      snapshot.questions
        .map((question) => ({
          questionId: question.id,
          prompt: question.prompt,
          answer: getCorrectAnswerLabel(question)
        }))
        .filter((item) => item.answer),
    [snapshot.questions]
  );

  const leaderboard = useMemo(() => {
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
  }, [snapshot.participants, snapshot.questions, snapshot.responses]);

  const participantResults = useMemo(
    () =>
      snapshot.participants.map((participant) => {
        const participantResponses = snapshot.responses.filter((response) => response.participantId === participant.id);
        return {
          participantId: participant.id,
          name: participant.displayName,
          results: snapshot.questions.map((question) => {
            const response = participantResponses.find((item) => item.questionId === question.id);
            return {
              questionId: question.id,
              prompt: question.prompt,
              responseLabel: formatResponseLabel(question, response),
              isCorrect: response ? isResponseCorrect(question, response) : false,
              hasResponse: Boolean(response)
            };
          })
        };
      }),
    [snapshot.participants, snapshot.questions, snapshot.responses]
  );

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
    setBusyAction("start");
    setMessage("");
    try {
      await api.startSession(snapshot.session.id);
      setSnapshot(await api.getSession(snapshot.session.id));
      setMessage(timedSession ? "Timed quiz started for the class." : "Session started.");
    } finally {
      setBusyAction(null);
    }
  }

  async function endSession() {
    setBusyAction("end");
    setMessage("");
    try {
      await api.endSession(snapshot.session.id);
      setSnapshot(await api.getSession(snapshot.session.id));
      setMessage(timedSession ? "Quiz ended and results revealed." : "Session ended.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleExport() {
    setBusyAction("export");
    setMessage("");
    try {
      setExportCsv(await api.exportSession(snapshot.session.id));
      setMessage("CSV export generated below.");
    } finally {
      setBusyAction(null);
    }
  }

  async function copyJoinCode() {
    setBusyAction("copy");
    setMessage("");
    try {
      await navigator.clipboard.writeText(snapshot.session.joinCode);
      setMessage(`Join code ${snapshot.session.joinCode} copied.`);
    } finally {
      setBusyAction(null);
    }
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
          {message ? (
            <div className="mt-4 rounded-[1.2rem] bg-[#f4efff] px-4 py-3 text-sm text-[#5f47a6]">
              {message}
            </div>
          ) : null}
          {timedSession ? (
            <div className="mt-5 rounded-[1.5rem] bg-white/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-skillzy-soft">Auto-running timed quiz</p>
                  <p className="mt-1 text-sm text-skillzy-soft">
                    {snapshot.participants.filter((participant) => (participant.currentQuestionIndex ?? 0) >= orderedQuestions.length).length}
                    {" "}students finished, {orderedQuestions.length} total questions
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-skillzy-soft">Quiz time left</p>
                  <p className="text-2xl font-semibold">{Math.max(0, Math.ceil(timeRemaining ?? 0))}s</p>
                </div>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/10">
                <div
                  className="h-full rounded-full bg-[#8b62ff] transition-[width] duration-100"
                  style={{
                    width: `${
                      snapshot.session.startedAt && snapshot.session.quizEndsAt
                        ? Math.max(
                            0,
                            Math.min(
                              100,
                              ((new Date(snapshot.session.quizEndsAt).getTime() - Date.now()) /
                                (new Date(snapshot.session.quizEndsAt).getTime() -
                                  new Date(snapshot.session.startedAt).getTime())) *
                                100
                            )
                          )
                        : 0
                    }%`
                  }}
                />
              </div>
            </div>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={startSession}
              disabled={snapshot.session.status === "live" || busyAction !== null}
              className="rounded-full bg-skillzy-ink px-4 py-3 text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyAction === "start"
                ? "Starting..."
                : timedSession
                  ? "Start timed quiz"
                  : "Start session"}
            </button>
            <button
              onClick={endSession}
              disabled={busyAction !== null || snapshot.session.status === "draft"}
              className="rounded-full border border-black/10 px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyAction === "end" ? "Ending..." : timedSession ? "End quiz now" : "End session"}
            </button>
            <button
              onClick={copyJoinCode}
              disabled={busyAction !== null}
              className="rounded-full border border-black/10 px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyAction === "copy" ? "Copying..." : "Copy join code"}
            </button>
            <button
              onClick={handleExport}
              disabled={busyAction !== null}
              className="rounded-full border border-black/10 px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyAction === "export" ? "Exporting..." : "Export CSV"}
            </button>
            {!timedSession ? (
              <button
                onClick={() => sendControl("toggle-results")}
                disabled={busyAction !== null || snapshot.session.status !== "live"}
                className="rounded-full border border-black/10 px-4 py-3"
              >
                {snapshot.session.revealResults ? "Hide results" : "Reveal results"}
              </button>
            ) : null}
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
                    {timedSession ? (
                      <span className="rounded-full bg-[#f4efff] px-3 py-2 text-sm font-semibold text-[#6f58bb]">
                        Auto-run
                      </span>
                    ) : (
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
                    )}
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
            <Metric
              label="Answered current"
              value={
                activeQuestion
                  ? snapshot.responses.filter((response) => response.questionId === activeQuestion.id).length
                  : 0
              }
            />
            <Metric
              label={timedSession ? "Students are on" : "Active slide"}
              value={
                timedSession
                  ? `${Math.max(currentQuestionPosition, 0)}/${Math.max(snapshot.session.totalTimedQuestions ?? orderedQuestions.length, 0)}`
                  : snapshot.session.currentSlideIndex + 1
              }
            />
            <Metric label="Status" value={snapshot.session.status} />
          </div>
          {timedSession ? (
            <div className="mt-4 rounded-[1.5rem] bg-white/70 p-4 text-sm text-skillzy-soft">
              <p className="font-semibold text-skillzy-ink">Student positions</p>
              <div className="mt-3 space-y-2">
                {participantProgress.map((participant) => (
                  <div
                    key={participant.participantId}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[1rem] bg-white px-3 py-3"
                  >
                    <div>
                      <p className="font-medium text-skillzy-ink">{participant.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-skillzy-soft">
                        {participant.questionLabel}
                      </p>
                    </div>
                    <p className="max-w-[16rem] truncate text-sm text-skillzy-soft">
                      {participant.questionPrompt}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </CreamCard>

        {activeQuestion ? (
          <CreamCard>
            <h3 className="text-xl font-semibold">{activeQuestion.prompt}</h3>
            <AnalyticsView question={activeQuestion} analytics={analytics} />
          </CreamCard>
        ) : null}

        {snapshot.session.revealResults ? (
          <CreamCard>
            <h3 className="text-xl font-semibold">Reveal results</h3>
            <div className="mt-4 space-y-3">
              {answerKey.length > 0 ? (
                answerKey.map((item) => (
                  <div key={item.questionId} className="rounded-[1.5rem] bg-white/70 p-4">
                    <p className="text-sm text-skillzy-soft">{item.prompt}</p>
                    <p className="mt-2 font-semibold">{item.answer}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.5rem] bg-white/70 p-4 text-sm text-skillzy-soft">
                  This session does not have auto-gradable correct answers yet.
                </div>
              )}
            </div>

            <div className="mt-5">
              <h4 className="text-lg font-semibold">Leaderboard</h4>
              <div className="mt-3 space-y-3">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.participantId}
                    className="flex items-center justify-between rounded-[1.5rem] bg-white/70 p-4"
                  >
                    <div>
                      <p className="text-sm text-skillzy-soft">#{index + 1}</p>
                      <p className="font-semibold">{entry.name}</p>
                    </div>
                    <p className="text-sm font-semibold text-skillzy-soft">
                      {entry.correctCount}/{entry.totalQuestions} correct
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <h4 className="text-lg font-semibold">All student results</h4>
              <div className="mt-3 space-y-3">
                {participantResults.map((participant) => (
                  <div key={participant.participantId} className="rounded-[1.5rem] bg-white/70 p-4">
                    <p className="font-semibold">{participant.name}</p>
                    <div className="mt-3 space-y-2">
                      {participant.results.map((result, index) => (
                        <div
                          key={`${participant.participantId}-${result.questionId}`}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-[1rem] bg-white px-3 py-3 text-sm"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs uppercase tracking-[0.14em] text-skillzy-soft">
                              Question {index + 1}
                            </p>
                            <p className="truncate font-medium">{result.prompt}</p>
                          </div>
                          <p className="max-w-[15rem] truncate text-skillzy-soft">{result.responseLabel}</p>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                              !result.hasResponse
                                ? "bg-[#f4f0ff] text-[#6f6787]"
                                : result.isCorrect
                                  ? "bg-[#e6fbf0] text-[#249461]"
                                  : "bg-[#fff1ee] text-[#c45538]"
                            }`}
                          >
                            {!result.hasResponse ? "No answer" : result.isCorrect ? "Correct" : "Incorrect"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
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

function formatResponseLabel(
  question: Question,
  response: SessionSnapshot["responses"][number] | undefined
) {
  if (!response) return "No answer submitted";

  if ((question.type === "multiple-choice" || question.type === "mcq") && (response.type === "multiple-choice" || response.type === "mcq")) {
    return response.selectedOptionIndexes
      .map((index) => question.options[index])
      .filter(Boolean)
      .map((option) => getChoiceOptionLabel(option as string | { id: string; text: string; isCorrect?: boolean }))
      .join(", ");
  }

  if (response.type === "text") {
    return response.text;
  }

  if (response.type === "drawing") {
    return "Drawing submitted";
  }

  if (response.type === "rating-scale" || response.type === "rating") {
    return `Rating ${response.rating}`;
  }

  if (response.type === "image-hotspot") {
    return `Point ${response.point.x}, ${response.point.y}`;
  }

  if (response.type === "drag-rank") {
    return response.orderedItems.join(" -> ");
  }

  if (response.type === "true_false") {
    return response.selectedId;
  }

  return "Response submitted";
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
