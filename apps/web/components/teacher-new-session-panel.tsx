"use client";

import type { DashboardData, Deck, LessonTemplate } from "@skillzy/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { api } from "../lib/api";

export function TeacherNewSessionPanel({ dashboard }: { dashboard: DashboardData }) {
  const router = useRouter();
  const [classId, setClassId] = useState(dashboard.classes[0]?.id ?? "");
  const [deckId, setDeckId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [sourceType, setSourceType] = useState<"template" | "deck">("template");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const classDecks = useMemo(
    () => dashboard.decks.filter((deck) => deck.classId === classId),
    [classId, dashboard.decks]
  );

  async function handleCreateSession() {
    const targetDeck = classDecks.find((deck) => deck.id === deckId) ?? classDecks[0];
    const targetTemplate = dashboard.templates.find((template) => template.id === templateId) ?? dashboard.templates[0];
    setSubmitting(true);
    setMessage("");
    try {
      const session =
        sourceType === "deck" && targetDeck
          ? await api.createSession({ deckId: targetDeck.id, classId })
          : targetTemplate
            ? await api.createSession({ templateId: targetTemplate.id, classId })
            : null;
      if (!session) {
        throw new Error("No session source");
      }
      router.push(`/teacher/sessions/${session.id}`);
    } catch {
      setMessage("We couldn't create the session. Pick a template or a ready deck and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[1.8rem] bg-white p-6 shadow-[0_18px_50px_rgba(95,73,166,0.09)]">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#9288b2]">Step 1</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#1a1630]">
          Choose a class
        </h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {dashboard.classes.map((classroom) => (
            <button
              key={classroom.id}
              onClick={() => {
                setClassId(classroom.id);
                setDeckId("");
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                classroom.id === classId ? "bg-[#8b62ff] text-white" : "bg-[#f4f0ff] text-[#6f6787]"
              }`}
            >
              {classroom.name}
            </button>
          ))}
        </div>
        <p className="mt-5 text-sm leading-6 text-[#6d6585]">
          Sessions can start directly from a template now, or from an existing deck if you already customized one.
        </p>
      </section>

      <section className="rounded-[1.8rem] bg-white p-6 shadow-[0_18px_50px_rgba(95,73,166,0.09)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#9288b2]">Step 2</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#1a1630]">
              Pick a template or deck
            </h2>
          </div>
          <Link href="/teacher/templates" className="text-sm font-semibold text-[#6f49ff]">
            Open template library
          </Link>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => setSourceType("template")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              sourceType === "template" ? "bg-[#8b62ff] text-white" : "bg-[#f4f0ff] text-[#6f6787]"
            }`}
          >
            Start from template
          </button>
          <button
            onClick={() => setSourceType("deck")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              sourceType === "deck" ? "bg-[#8b62ff] text-white" : "bg-[#f4f0ff] text-[#6f6787]"
            }`}
          >
            Use existing deck
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {sourceType === "template" ? (
            dashboard.templates.length > 0 ? (
              dashboard.templates.map((template) => (
                <TemplateChoice
                  key={template.id}
                  template={template}
                  selected={template.id === templateId}
                  onSelect={() => setTemplateId(template.id)}
                />
              ))
            ) : (
              <div className="rounded-[1.3rem] border border-dashed border-[#e2d9ff] bg-[#faf7ff] px-4 py-5 text-sm text-[#706885]">
                No templates found yet.
              </div>
            )
          ) : (
            classDecks.length > 0 ? (
              classDecks.map((deck) => (
                <DeckChoice
                  key={deck.id}
                  deck={deck}
                  selected={deck.id === deckId}
                  onSelect={() => setDeckId(deck.id)}
                />
              ))
            ) : (
              <div className="rounded-[1.3rem] border border-dashed border-[#e2d9ff] bg-[#faf7ff] px-4 py-5 text-sm text-[#706885]">
                No decks found for this class yet.
              </div>
            )
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={handleCreateSession}
            disabled={
              submitting ||
              (sourceType === "template" ? dashboard.templates.length === 0 : classDecks.length === 0)
            }
            className="rounded-full bg-[#8b62ff] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Creating..." : sourceType === "template" ? "Create session from template" : "Create session"}
          </button>
          {message ? <p className="text-sm text-[#6d6585]">{message}</p> : null}
        </div>
      </section>
    </div>
  );
}

function DeckChoice({
  deck,
  selected,
  onSelect
}: {
  deck: Deck;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-[1.3rem] border px-4 py-4 text-left ${
        selected ? "border-[#8b62ff] bg-[#f4efff]" : "border-[#f1ebff] bg-[#fbf9ff]"
      }`}
    >
      <p className="font-semibold text-[#201936]">{deck.title}</p>
      <p className="mt-1 text-sm text-[#6d6585]">{deck.description}</p>
    </button>
  );
}

function TemplateChoice({
  template,
  selected,
  onSelect
}: {
  template: LessonTemplate;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-[1.3rem] border px-4 py-4 text-left ${
        selected ? "border-[#8b62ff] bg-[#f4efff]" : "border-[#f1ebff] bg-[#fbf9ff]"
      }`}
    >
      <p className="font-semibold text-[#201936]">{template.title}</p>
      <p className="mt-1 text-sm text-[#6d6585]">{template.description}</p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#988eaf]">
        {template.slides.length} questions
      </p>
    </button>
  );
}
