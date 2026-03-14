"use client";

import type { Question, SessionSnapshot } from "@skillzy/types";
import { useEffect, useState } from "react";
import { socket } from "../lib/socket";

function questionTypeLabel(question: Question) {
  return question.type.replace(/[-_]/g, " ");
}

export function ProjectorSession({
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

  useEffect(() => {
    socket.connect();
    const handleConnect = () => setConnectionState("connected");
    const handleDisconnect = () => setConnectionState("reconnecting");

    socket.emit("session:subscribe", sessionId);
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
  }, [sessionId]);

  const currentSlide = snapshot.slides[snapshot.session.currentSlideIndex];
  const activeQuestion = snapshot.questions.find(
    (question) => question.id === snapshot.session.activeQuestionId
  );

  return (
    <main className="min-h-screen bg-[#111019] px-6 py-8 text-white sm:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-white/50">Projector mode</p>
            <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">{snapshot.deck.title}</h1>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold">
            Join code {snapshot.session.joinCode}
          </div>
        </div>

        {connectionState !== "connected" ? (
          <div className="rounded-[1.5rem] border border-[#5a4a16] bg-[#2b2410] px-4 py-3 text-sm text-[#f3de95]">
            {connectionState === "connecting"
              ? "Connecting projector..."
              : "Projector connection lost. Reconnecting."}
          </div>
        ) : null}

        <section className="rounded-[2.2rem] border border-white/10 bg-white/5 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
          <p className="text-sm uppercase tracking-[0.24em] text-white/45">
            Slide {currentSlide ? currentSlide.index + 1 : snapshot.session.currentSlideIndex + 1}
          </p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight sm:text-6xl">
            {currentSlide?.title ?? "Waiting for slide"}
          </h2>
          <p className="mt-6 max-w-4xl text-lg leading-8 text-white/70 sm:text-2xl">
            {currentSlide?.body ?? "The teacher will begin shortly."}
          </p>
        </section>

        {activeQuestion ? (
          <section className="rounded-[2.2rem] border border-[#8f66ff]/30 bg-[#1c1531] p-8 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
            <p className="text-sm uppercase tracking-[0.24em] text-[#c9b8ff]">
              Live question / {questionTypeLabel(activeQuestion)}
            </p>
            <h3 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">
              {activeQuestion.prompt}
            </h3>
            <p className="mt-6 text-lg text-white/65">
              Students respond on their own devices. Results will appear when the teacher reveals them.
            </p>
          </section>
        ) : (
          <section className="rounded-[2rem] border border-dashed border-white/10 bg-white/5 px-6 py-8 text-lg text-white/60">
            Waiting for the teacher to activate a question.
          </section>
        )}
      </div>
    </main>
  );
}
