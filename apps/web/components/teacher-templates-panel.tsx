"use client";

import type { CreateLessonTemplateInput, DashboardData } from "@skillzy/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../lib/api";

export function TeacherTemplatesPanel({ dashboard }: { dashboard: DashboardData }) {
  const router = useRouter();
  const [classId, setClassId] = useState(dashboard.classes[0]?.id ?? "");
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [customTemplate, setCustomTemplate] = useState<CreateLessonTemplateInput>({
    title: "",
    description: "",
    subject: "",
    gradeBand: "",
    slides: [
      {
        title: "",
        body: "",
        question: {
          type: "multiple-choice",
          prompt: "",
          anonymous: true,
          config: {
            options: ["Option 1", "Option 2"],
            allowMultiple: false,
            correctOptionIndexes: [0]
          }
        }
      }
    ]
  });
  const [isSavingCustomTemplate, setIsSavingCustomTemplate] = useState(false);

  const customSlide = customTemplate.slides[0];
  const customQuestion = customSlide?.question;
  const customOptions = Array.isArray(customQuestion?.config.options)
    ? (customQuestion?.config.options as string[])
    : [];

  function updateCustomQuestionConfig(next: Record<string, unknown>) {
    setCustomTemplate((current) => ({
      ...current,
      slides: [
        {
          ...current.slides[0],
          question: current.slides[0].question
            ? {
                ...current.slides[0].question,
                config: {
                  ...current.slides[0].question.config,
                  ...next
                }
              }
            : undefined
        }
      ]
    }));
  }

  async function handleCreateDeck(templateId: string) {
    const targetClass = dashboard.classes.find((classroom) => classroom.id === classId);
    const template = dashboard.templates.find((item) => item.id === templateId);
    if (!targetClass || !template) return;

    setCreatingTemplateId(templateId);
    setMessage("");
    try {
      await api.createDeck({
        classId: targetClass.id,
        title: template.title,
        description: template.description,
        templateId
      });
      setMessage(`Created a new deck in ${targetClass.name}.`);
      router.refresh();
    } finally {
      setCreatingTemplateId(null);
    }
  }

  async function handleCreateCustomTemplate() {
    if (
      !customTemplate.title.trim() ||
      !customTemplate.subject.trim() ||
      !customSlide?.title.trim() ||
      !customQuestion?.prompt.trim() ||
      customOptions.length < 2
    ) {
      setMessage("Add a template title, subject, slide, and at least two answer options.");
      return;
    }

    setIsSavingCustomTemplate(true);
    setMessage("");
    try {
      await api.createTemplate(customTemplate);
      setCustomTemplate({
        title: "",
        description: "",
        subject: "",
        gradeBand: "",
        slides: [
          {
            title: "",
            body: "",
            question: {
              type: "multiple-choice",
              prompt: "",
              anonymous: true,
              config: {
                options: ["Option 1", "Option 2"],
                allowMultiple: false,
                correctOptionIndexes: [0]
              }
            }
          }
        ]
      });
      setMessage("Custom template saved to your library.");
      router.refresh();
    } finally {
      setIsSavingCustomTemplate(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[1.8rem] bg-white p-6 shadow-[0_18px_50px_rgba(95,73,166,0.09)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#9288b2]">Create your own template</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#1a1630]">
              Build a custom question set
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6d6585]">
              Add your own multiple-choice question, answer options, and correct answer, then save it straight into the template library.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <input
            value={customTemplate.title}
            onChange={(event) => setCustomTemplate((current) => ({ ...current, title: event.target.value }))}
            placeholder="Template title"
            className="rounded-[1.1rem] border border-[#ebe4ff] px-4 py-3 outline-none"
          />
          <input
            value={customTemplate.subject}
            onChange={(event) => setCustomTemplate((current) => ({ ...current, subject: event.target.value }))}
            placeholder="Subject"
            className="rounded-[1.1rem] border border-[#ebe4ff] px-4 py-3 outline-none"
          />
          <input
            value={customTemplate.gradeBand}
            onChange={(event) => setCustomTemplate((current) => ({ ...current, gradeBand: event.target.value }))}
            placeholder="Grade band"
            className="rounded-[1.1rem] border border-[#ebe4ff] px-4 py-3 outline-none"
          />
          <input
            value={customSlide.title}
            onChange={(event) =>
              setCustomTemplate((current) => ({
                ...current,
                slides: [{ ...current.slides[0], title: event.target.value }]
              }))
            }
            placeholder="Slide title"
            className="rounded-[1.1rem] border border-[#ebe4ff] px-4 py-3 outline-none"
          />
        </div>

        <textarea
          value={customTemplate.description}
          onChange={(event) => setCustomTemplate((current) => ({ ...current, description: event.target.value }))}
          placeholder="What is this template for?"
          className="mt-3 min-h-24 w-full rounded-[1.3rem] border border-[#ebe4ff] px-4 py-3 outline-none"
        />
        <textarea
          value={customSlide.body}
          onChange={(event) =>
            setCustomTemplate((current) => ({
              ...current,
              slides: [{ ...current.slides[0], body: event.target.value }]
            }))
          }
          placeholder="Slide instructions or context"
          className="mt-3 min-h-24 w-full rounded-[1.3rem] border border-[#ebe4ff] px-4 py-3 outline-none"
        />
        <input
          value={customQuestion?.prompt ?? ""}
          onChange={(event) =>
            setCustomTemplate((current) => ({
              ...current,
              slides: [
                {
                  ...current.slides[0],
                  question: current.slides[0].question
                    ? { ...current.slides[0].question, prompt: event.target.value }
                    : undefined
                }
              ]
            }))
          }
          placeholder="Question prompt"
          className="mt-3 w-full rounded-[1.1rem] border border-[#ebe4ff] px-4 py-3 outline-none"
        />
        <textarea
          value={customOptions.join("\n")}
          onChange={(event) =>
            updateCustomQuestionConfig({
              options: event.target.value.split("\n").map((option) => option.trim()).filter(Boolean)
            })
          }
          placeholder="One answer option per line"
          className="mt-3 min-h-28 w-full rounded-[1.3rem] border border-[#ebe4ff] px-4 py-3 outline-none"
        />

        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <select
            value={String((customQuestion?.config.correctOptionIndexes as number[] | undefined)?.[0] ?? 0)}
            onChange={(event) =>
              updateCustomQuestionConfig({
                correctOptionIndexes: [Number(event.target.value)]
              })
            }
            className="rounded-[1.1rem] border border-[#ebe4ff] px-4 py-3 outline-none"
          >
            {customOptions.map((option, index) => (
              <option key={`${option}-${index}`} value={index}>
                Correct answer: {option}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 rounded-[1.1rem] border border-[#ebe4ff] px-4 py-3 text-sm text-[#6d6585]">
            <input
              type="checkbox"
              checked={Boolean(customQuestion?.anonymous)}
              onChange={(event) =>
                setCustomTemplate((current) => ({
                  ...current,
                  slides: [
                    {
                      ...current.slides[0],
                      question: current.slides[0].question
                        ? { ...current.slides[0].question, anonymous: event.target.checked }
                        : undefined
                    }
                  ]
                }))
              }
            />
            Anonymous
          </label>
          <button
            onClick={handleCreateCustomTemplate}
            disabled={isSavingCustomTemplate}
            className="rounded-full bg-[#8b62ff] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingCustomTemplate ? "Saving..." : "Save template"}
          </button>
        </div>
      </section>

      <section className="rounded-[1.8rem] bg-white p-6 shadow-[0_18px_50px_rgba(95,73,166,0.09)]">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#9288b2]">Target class</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {dashboard.classes.map((classroom) => (
            <button
              key={classroom.id}
              onClick={() => setClassId(classroom.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                classroom.id === classId ? "bg-[#8b62ff] text-white" : "bg-[#f4f0ff] text-[#6f6787]"
              }`}
            >
              {classroom.name}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {dashboard.templates.map((template) => (
          <article
            key={template.id}
            className="rounded-[1.9rem] bg-white p-6 shadow-[0_18px_50px_rgba(95,73,166,0.09)]"
          >
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#9288b2]">
              {template.subject}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#1a1630]">
              {template.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#6d6585]">{template.description}</p>
            <p className="mt-4 text-sm text-[#8a82a2]">{template.slides.length} slides</p>
            <button
              onClick={() => handleCreateDeck(template.id)}
              disabled={creatingTemplateId === template.id || !classId}
              className="mt-5 rounded-full border border-[#ebe4ff] px-4 py-3 text-sm font-semibold text-[#2d2446] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creatingTemplateId === template.id ? "Creating..." : "Create deck from template"}
            </button>
          </article>
        ))}
      </section>

      {message ? <p className="text-sm text-[#6d6585]">{message}</p> : null}
    </div>
  );
}
