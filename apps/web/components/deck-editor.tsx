"use client";

import type {
  CreateQuestionInput,
  DeckBundle,
  Question,
  QuestionType
} from "@skillzy/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../lib/api";
import { CreamCard } from "./shell";

const questionTypes: QuestionType[] = [
  "multiple-choice",
  "text",
  "drawing",
  "rating-scale",
  "image-hotspot",
  "drag-rank"
];

export function DeckEditor({ bundle }: { bundle: DeckBundle }) {
  const router = useRouter();
  const [title, setTitle] = useState(bundle.deck.title);
  const [description, setDescription] = useState(bundle.deck.description);
  const [slideTitle, setSlideTitle] = useState("");
  const [slideBody, setSlideBody] = useState("");
  const [questionForms, setQuestionForms] = useState<Record<string, CreateQuestionInput>>(() =>
    Object.fromEntries(
      bundle.slides.map((slide) => {
        const existing = bundle.questions.find((question) => question.slideId === slide.id);
        return [
          slide.id,
          existing ? questionToInput(existing) : defaultQuestion(slide.id)
        ];
      })
    )
  );
  const [importFileName, setImportFileName] = useState("");
  const [importSource, setImportSource] = useState<"pptx" | "pdf" | "google-slides">("pptx");
  const [message, setMessage] = useState("");

  async function saveDeckMeta() {
    await api.updateDeck(bundle.deck.id, { title, description });
    setMessage("Deck details saved.");
    router.refresh();
  }

  async function addSlide() {
    if (!slideTitle || !slideBody) return;
    await api.createSlide({
      deckId: bundle.deck.id,
      title: slideTitle,
      body: slideBody
    });
    setSlideTitle("");
    setSlideBody("");
    setMessage("Slide added to deck.");
    router.refresh();
  }

  async function saveQuestion(slideId: string, questionId?: string) {
    const input = questionForms[slideId];
    if (!input.prompt) return;
    if (questionId) {
      await api.updateQuestion(questionId, input);
      setMessage("Question updated.");
    } else {
      await api.createQuestion(input);
      setMessage("Question added.");
    }
    router.refresh();
  }

  async function queueImport() {
    if (!importFileName) return;
    await api.queueImport(importFileName, importSource);
    setImportFileName("");
    setMessage("Import job queued. Use this to stage PPTX/PDF ingestion work.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <CreamCard className="ticket-notch pt-10">
          <p className="text-sm uppercase tracking-[0.25em] text-skillzy-soft">Deck builder</p>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-3 w-full rounded-[1.25rem] border border-black/10 bg-white/70 px-4 py-3 text-3xl font-semibold outline-none"
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-3 min-h-32 w-full rounded-[1.5rem] border border-black/10 bg-white/70 p-4 outline-none"
          />
          <button
            onClick={saveDeckMeta}
            className="mt-4 rounded-full bg-skillzy-ink px-5 py-3 font-semibold text-white"
          >
            Save deck details
          </button>
        </CreamCard>

        <CreamCard>
          <h2 className="text-xl font-semibold">Import pipeline stub</h2>
          <p className="mt-2 text-sm text-skillzy-soft">
            Queue PPTX, PDF, or Google Slides jobs against the normalized deck model.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              value={importFileName}
              onChange={(event) => setImportFileName(event.target.value)}
              placeholder="intro-lesson.pptx"
              className="rounded-full border border-black/10 bg-white/70 px-4 py-3 outline-none"
            />
            <select
              value={importSource}
              onChange={(event) =>
                setImportSource(event.target.value as "pptx" | "pdf" | "google-slides")
              }
              className="rounded-full border border-black/10 bg-white/70 px-4 py-3 outline-none"
            >
              <option value="pptx">PPTX</option>
              <option value="pdf">PDF</option>
              <option value="google-slides">Google Slides</option>
            </select>
          </div>
          <button
            onClick={queueImport}
            className="mt-4 rounded-full border border-black/10 px-5 py-3 font-semibold"
          >
            Queue import
          </button>
          {message ? <p className="mt-3 text-sm text-skillzy-soft">{message}</p> : null}
        </CreamCard>
      </div>

      <CreamCard>
        <h2 className="text-xl font-semibold">Add slide</h2>
        <div className="mt-4 grid gap-3">
          <input
            value={slideTitle}
            onChange={(event) => setSlideTitle(event.target.value)}
            placeholder="Slide title"
            className="rounded-full border border-black/10 bg-white/70 px-4 py-3 outline-none"
          />
          <textarea
            value={slideBody}
            onChange={(event) => setSlideBody(event.target.value)}
            placeholder="Slide body"
            className="min-h-28 rounded-[1.5rem] border border-black/10 bg-white/70 p-4 outline-none"
          />
          <button
            onClick={addSlide}
            className="w-fit rounded-full bg-skillzy-ink px-5 py-3 font-semibold text-white"
          >
            Add slide
          </button>
        </div>
      </CreamCard>

      <CreamCard>
        <h2 className="text-xl font-semibold">Slide map</h2>
        <div className="mt-4 grid gap-4">
          {bundle.slides.map((slide) => {
            const question = bundle.questions.find((item) => item.slideId === slide.id);
            const form = questionForms[slide.id] ?? defaultQuestion(slide.id);
            return (
              <div key={slide.id} className="rounded-[1.5rem] bg-white/70 p-4">
                <p className="text-sm text-skillzy-soft">Slide {slide.index + 1}</p>
                <h3 className="text-lg font-semibold">{slide.title}</h3>
                <p className="mt-1 text-sm text-skillzy-soft">{slide.body}</p>

                <div className="mt-4 grid gap-3">
                  <select
                    value={form.type}
                    onChange={(event) =>
                      setQuestionForms((current) => ({
                        ...current,
                        [slide.id]: {
                          ...defaultQuestion(slide.id),
                          ...current[slide.id],
                          type: event.target.value as QuestionType,
                          slideId: slide.id
                        }
                      }))
                    }
                    className="rounded-full border border-black/10 bg-white px-4 py-3 outline-none"
                  >
                    {questionTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <input
                    value={form.prompt}
                    onChange={(event) =>
                      setQuestionForms((current) => ({
                        ...current,
                        [slide.id]: { ...current[slide.id], prompt: event.target.value }
                      }))
                    }
                    placeholder="Question prompt"
                    className="rounded-full border border-black/10 bg-white px-4 py-3 outline-none"
                  />
                  <QuestionFields
                    form={form}
                    onChange={(next) =>
                      setQuestionForms((current) => ({
                        ...current,
                        [slide.id]: { ...current[slide.id], ...next }
                      }))
                    }
                  />
                  <label className="flex items-center gap-2 text-sm text-skillzy-soft">
                    <input
                      type="checkbox"
                      checked={form.anonymous}
                      onChange={(event) =>
                        setQuestionForms((current) => ({
                          ...current,
                          [slide.id]: { ...current[slide.id], anonymous: event.target.checked }
                        }))
                      }
                    />
                    Anonymous responses
                  </label>
                  <button
                    onClick={() => saveQuestion(slide.id, question?.id)}
                    className="w-fit rounded-full bg-skillzy-ink px-4 py-3 text-sm font-semibold text-white"
                  >
                    {question ? "Update question" : "Add question"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </CreamCard>
    </div>
  );
}

function defaultQuestion(slideId: string): CreateQuestionInput {
  return {
    slideId,
    type: "multiple-choice",
    prompt: "",
    anonymous: true,
    options: ["Option 1", "Option 2"],
    allowMultiple: false
  };
}

function questionToInput(question: Question): CreateQuestionInput {
  switch (question.type) {
    case "multiple-choice":
      return {
        slideId: question.slideId,
        sessionId: question.sessionId,
        slideIndex: question.slideIndex,
        type: question.type,
        prompt: question.prompt,
        anonymous: question.anonymous,
        timer: question.timer,
        explanation: question.explanation,
        options: question.options
          .map((option) => (typeof option === "string" ? option : option.text))
          .filter(Boolean),
        allowMultiple: question.allowMultiple,
        correctOptionIndexes: question.correctOptionIndexes
      };
    case "text":
      return { ...question };
    case "drawing":
      return { ...question };
    case "rating-scale":
      return { ...question };
    case "image-hotspot":
      return { ...question };
    case "drag-rank":
      return { ...question };
    case "mcq":
      return {
        slideId: question.slideId,
        sessionId: question.sessionId,
        slideIndex: question.slideIndex,
        type: "multiple-choice",
        prompt: question.prompt,
        anonymous: question.anonymous,
        timer: question.timer,
        explanation: question.explanation,
        options: question.options
          .map((option) => (typeof option === "string" ? option : option.text))
          .filter(Boolean),
        allowMultiple: question.allowMultiple,
        correctOptionIndexes:
          question.correctId === undefined ? undefined : [question.correctId === "true" ? 0 : 1]
      };
    case "rating":
      return {
        ...question,
        type: "rating-scale"
      };
    case "true_false":
      return {
        slideId: question.slideId,
        sessionId: question.sessionId,
        slideIndex: question.slideIndex,
        type: "multiple-choice",
        prompt: question.prompt,
        anonymous: question.anonymous,
        timer: question.timer,
        explanation: question.explanation,
        options: ["True", "False"],
        allowMultiple: false,
        correctOptionIndexes:
          question.correctId === undefined ? undefined : [question.correctId === "true" ? 0 : 1]
      };
  }
}

function QuestionFields({
  form,
  onChange
}: {
  form: CreateQuestionInput;
  onChange: (next: Partial<CreateQuestionInput>) => void;
}) {
  if (form.type === "multiple-choice") {
    return (
      <textarea
        value={(form.options ?? []).join("\n")}
        onChange={(event) =>
          onChange({
            options: event.target.value.split("\n").filter(Boolean)
          })
        }
        placeholder="One option per line"
        className="min-h-28 rounded-[1.5rem] border border-black/10 bg-white p-4 outline-none"
      />
    );
  }

  if (form.type === "text") {
    return (
      <input
        type="number"
        value={form.maxLength ?? 180}
        onChange={(event) => onChange({ maxLength: Number(event.target.value) })}
        className="rounded-full border border-black/10 bg-white px-4 py-3 outline-none"
      />
    );
  }

  if (form.type === "drawing") {
    return (
      <input
        value={form.placeholder ?? ""}
        onChange={(event) => onChange({ placeholder: event.target.value })}
        placeholder="Drawing prompt hint"
        className="rounded-full border border-black/10 bg-white px-4 py-3 outline-none"
      />
    );
  }

  if (form.type === "rating-scale") {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        <input
          value={form.minLabel ?? ""}
          onChange={(event) => onChange({ minLabel: event.target.value })}
          placeholder="Min label"
          className="rounded-full border border-black/10 bg-white px-4 py-3 outline-none"
        />
        <input
          value={form.maxLabel ?? ""}
          onChange={(event) => onChange({ maxLabel: event.target.value })}
          placeholder="Max label"
          className="rounded-full border border-black/10 bg-white px-4 py-3 outline-none"
        />
        <input
          type="number"
          value={form.scale ?? 5}
          onChange={(event) => onChange({ scale: Number(event.target.value) })}
          className="rounded-full border border-black/10 bg-white px-4 py-3 outline-none"
        />
      </div>
    );
  }

  if (form.type === "image-hotspot") {
    return (
      <div className="grid gap-3">
        <input
          value={form.imageUrl ?? ""}
          onChange={(event) => onChange({ imageUrl: event.target.value })}
          placeholder="Image URL"
          className="rounded-full border border-black/10 bg-white px-4 py-3 outline-none"
        />
        <input
          value={form.hotspotLabel ?? ""}
          onChange={(event) => onChange({ hotspotLabel: event.target.value })}
          placeholder="Hotspot label"
          className="rounded-full border border-black/10 bg-white px-4 py-3 outline-none"
        />
      </div>
    );
  }

  return (
    <textarea
      value={(form.items ?? []).join("\n")}
      onChange={(event) =>
        onChange({
          items: event.target.value.split("\n").filter(Boolean)
        })
      }
      placeholder="One rank item per line"
      className="min-h-28 rounded-[1.5rem] border border-black/10 bg-white p-4 outline-none"
    />
  );
}
