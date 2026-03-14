"use client";

import type {
  CreateLessonTemplateInput,
  CreateTemplateQuestionInput,
  CreateTemplateSlideInput,
  DashboardData
} from "@skillzy/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../lib/api";

const fieldClassName =
  "rounded-[1.1rem] border border-[#ebe4ff] bg-white px-4 py-3 text-[#1a1630] outline-none placeholder:text-[#8a82a2]";
const areaClassName =
  "w-full rounded-[1.3rem] border border-[#ebe4ff] bg-white px-4 py-3 text-[#1a1630] outline-none placeholder:text-[#8a82a2]";

function createEmptySlide(): CreateTemplateSlideInput {
  return {
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
  };
}

function createEmptyTemplate(): CreateLessonTemplateInput {
  return {
    title: "",
    description: "",
    subject: "",
    gradeBand: "",
    slides: [createEmptySlide()]
  };
}

function normalizeOptions(options: string[]) {
  return options.map((option) => option.trim()).filter(Boolean).slice(0, 4);
}

type JsonTemplateQuestion = {
  slideTitle?: string;
  questionPrompt?: string;
  slideInstructionsOrContext?: string;
  options?: string[];
  correctAnswer?: string;
};

type JsonTemplatePayload = {
  templateTitle?: string;
  subject?: string;
  gradeBand?: string;
  templatePurpose?: string;
  anonymous?: boolean;
  questions?: JsonTemplateQuestion[];
};

function parseCorrectAnswerIndex(value: string | undefined, optionsLength: number) {
  if (!value) return 0;
  const optionMatch = value.match(/option\s*(\d+)/i);
  if (optionMatch) {
    return Math.max(0, Math.min(Number(optionMatch[1]) - 1, Math.max(optionsLength - 1, 0)));
  }
  return 0;
}

function transformJsonTemplate(payload: JsonTemplatePayload): CreateLessonTemplateInput {
  const anonymous = payload.anonymous ?? true;
  const slides =
    payload.questions?.map((question) => {
      const options = normalizeOptions(question.options ?? []);
      return {
        title: question.slideTitle?.trim() || "Question",
        body: question.slideInstructionsOrContext?.trim() || "",
        question: {
          type: "multiple-choice" as const,
          prompt: question.questionPrompt?.trim() || "",
          anonymous,
          config: {
            options: options.length >= 2 ? options : ["Option 1", "Option 2"],
            allowMultiple: false,
            correctOptionIndexes: [parseCorrectAnswerIndex(question.correctAnswer, options.length >= 2 ? options.length : 2)]
          }
        }
      };
    }) ?? [createEmptySlide()];

  return {
    title: payload.templateTitle?.trim() || "",
    subject: payload.subject?.trim() || "",
    gradeBand: payload.gradeBand?.trim() || "",
    description: payload.templatePurpose?.trim() || "",
    slides
  };
}

export function TeacherTemplatesPanel({ dashboard }: { dashboard: DashboardData }) {
  const router = useRouter();
  const [classId, setClassId] = useState(dashboard.classes[0]?.id ?? "");
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [customTemplate, setCustomTemplate] = useState<CreateLessonTemplateInput>(createEmptyTemplate);
  const [isSavingCustomTemplate, setIsSavingCustomTemplate] = useState(false);
  const [jsonTemplate, setJsonTemplate] = useState("");

  function updateSlide(index: number, updater: (slide: CreateTemplateSlideInput) => CreateTemplateSlideInput) {
    setCustomTemplate((current) => ({
      ...current,
      slides: current.slides.map((slide, slideIndex) => (slideIndex === index ? updater(slide) : slide))
    }));
  }

  function updateQuestion(
    index: number,
    updater: (question: CreateTemplateQuestionInput) => CreateTemplateQuestionInput
  ) {
    updateSlide(index, (slide) => ({
      ...slide,
      question: updater(
        slide.question ?? {
          type: "multiple-choice",
          prompt: "",
          anonymous: true,
          config: {
            options: ["Option 1", "Option 2"],
            allowMultiple: false,
            correctOptionIndexes: [0]
          }
        }
      )
    }));
  }

  function addSlide() {
    setCustomTemplate((current) => ({
      ...current,
      slides: [...current.slides, createEmptySlide()]
    }));
  }

  function removeSlide(index: number) {
    setCustomTemplate((current) => ({
      ...current,
      slides: current.slides.length === 1 ? [createEmptySlide()] : current.slides.filter((_, slideIndex) => slideIndex !== index)
    }));
  }

  async function handleCreateSessionFromTemplate(templateId: string) {
    const targetClass = dashboard.classes.find((classroom) => classroom.id === classId);
    const template = dashboard.templates.find((item) => item.id === templateId);
    if (!targetClass || !template) return;

    setCreatingTemplateId(templateId);
    setMessage("");
    try {
      const session = await api.createSession({
        classId: targetClass.id,
        templateId
      });
      router.push(`/teacher/sessions/${session.id}`);
    } finally {
      setCreatingTemplateId(null);
    }
  }

  async function handleCreateCustomTemplate() {
    const invalidSlide = customTemplate.slides.find((slide) => {
      const question = slide.question;
      const options = Array.isArray(question?.config.options) ? (question?.config.options as string[]) : [];
      return !slide.title.trim() || !question?.prompt.trim() || options.length < 2;
    });

    if (!customTemplate.title.trim() || !customTemplate.subject.trim() || invalidSlide) {
      setMessage("Add a template title, subject, and complete each slide with a question and at least two answer options.");
      return;
    }

    setIsSavingCustomTemplate(true);
    setMessage("");
    try {
      await api.createTemplate(customTemplate);
      setCustomTemplate(createEmptyTemplate());
      setMessage("Custom template saved to your library.");
      router.refresh();
    } finally {
      setIsSavingCustomTemplate(false);
    }
  }

  function handleLoadJsonTemplate() {
    try {
      const parsed = JSON.parse(jsonTemplate) as JsonTemplatePayload;
      const nextTemplate = transformJsonTemplate(parsed);
      setCustomTemplate(nextTemplate);
      setMessage("JSON template loaded into the builder.");
    } catch {
      setMessage("That JSON could not be parsed. Check the format and try again.");
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[1.8rem] bg-white p-6 shadow-[0_18px_50px_rgba(95,73,166,0.09)]">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#9288b2]">
          JSON template builder
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#1a1630]">
          Paste JSON and create a template
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6d6585]">
          Paste a JSON payload with template title, subject, grade band, and questions. We will map it into the builder so you can review it and save it as a template.
        </p>
        <textarea
          value={jsonTemplate}
          onChange={(event) => setJsonTemplate(event.target.value)}
          placeholder='{"templateTitle":"Easy India Quiz","subject":"General Knowledge","gradeBand":"Grades 3-5","templatePurpose":"This template is for a very easy quiz test based on India.","anonymous":true,"questions":[{"slideTitle":"Question 1","questionPrompt":"What is the capital of India?","slideInstructionsOrContext":"Choose the correct answer.","options":["New Delhi","Mumbai","Kolkata","Chennai"],"correctAnswer":"Option 1"}]}'
          className="mt-4 min-h-56 w-full rounded-[1.3rem] border border-[#ebe4ff] bg-white px-4 py-3 font-mono text-sm text-[#1a1630] outline-none placeholder:text-[#8a82a2]"
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={handleLoadJsonTemplate}
            className="rounded-full border border-[#ebe4ff] px-5 py-3 text-sm font-semibold text-[#2d2446]"
          >
            Load JSON into builder
          </button>
          <button
            onClick={() => setJsonTemplate("")}
            className="rounded-full border border-[#ebe4ff] px-5 py-3 text-sm font-semibold text-[#6f6787]"
          >
            Clear JSON
          </button>
        </div>
      </section>

      <section className="rounded-[1.8rem] bg-white p-6 shadow-[0_18px_50px_rgba(95,73,166,0.09)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#9288b2]">
              Create your own template
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#1a1630]">
              Build a multi-question template
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6d6585]">
              Add as many slides as you need, write your own questions, create answer options, and mark the correct answer for each one.
            </p>
          </div>
          <button
            onClick={addSlide}
            className="rounded-full border border-[#ebe4ff] px-4 py-3 text-sm font-semibold text-[#2d2446]"
          >
            Add another question
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <input
            value={customTemplate.title}
            onChange={(event) => setCustomTemplate((current) => ({ ...current, title: event.target.value }))}
            placeholder="Template title"
            className={fieldClassName}
          />
          <input
            value={customTemplate.subject}
            onChange={(event) => setCustomTemplate((current) => ({ ...current, subject: event.target.value }))}
            placeholder="Subject"
            className={fieldClassName}
          />
          <input
            value={customTemplate.gradeBand}
            onChange={(event) => setCustomTemplate((current) => ({ ...current, gradeBand: event.target.value }))}
            placeholder="Grade band"
            className={fieldClassName}
          />
          <input
            value={customTemplate.description}
            onChange={(event) => setCustomTemplate((current) => ({ ...current, description: event.target.value }))}
            placeholder="What is this template for?"
            className={fieldClassName}
          />
        </div>

        <div className="mt-6 space-y-4">
          {customTemplate.slides.map((slide, index) => {
            const question = slide.question;
            const options = Array.isArray(question?.config.options)
              ? normalizeOptions(question.config.options as string[])
              : [];
            const correctOptionIndexes =
              (question?.config.correctOptionIndexes as number[] | undefined) ?? [];

            return (
              <div
                key={`custom-slide-${index}`}
                className="rounded-[1.5rem] border border-[#ebe4ff] bg-[#fcfaff] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#9288b2]">
                      Question {index + 1}
                    </p>
                    <p className="mt-1 text-sm text-[#6d6585]">
                      Each slide becomes one question in the template.
                    </p>
                  </div>
                  <button
                    onClick={() => removeSlide(index)}
                    className="rounded-full border border-[#ebe4ff] px-4 py-2 text-sm font-semibold text-[#6f6787]"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <input
                    value={slide.title}
                    onChange={(event) =>
                      updateSlide(index, (current) => ({ ...current, title: event.target.value }))
                    }
                    placeholder="Slide title"
                    className={fieldClassName}
                  />
                  <input
                    value={question?.prompt ?? ""}
                    onChange={(event) =>
                      updateQuestion(index, (current) => ({ ...current, prompt: event.target.value }))
                    }
                    placeholder="Question prompt"
                    className={fieldClassName}
                  />
                </div>

                <textarea
                  value={slide.body}
                  onChange={(event) =>
                    updateSlide(index, (current) => ({ ...current, body: event.target.value }))
                  }
                  placeholder="Slide instructions or context"
                  className={`mt-3 min-h-24 ${areaClassName}`}
                />

                <div className="mt-3 space-y-3">
                  {options.map((option, optionIndex) => (
                    <div key={`${index}-${optionIndex}`} className="flex gap-3">
                      <input
                        value={option}
                        onChange={(event) =>
                          updateQuestion(index, (current) => {
                            const nextOptions = normalizeOptions(
                              (Array.isArray(current.config.options)
                                ? (current.config.options as string[])
                                : []
                              ).map((item, currentIndex) =>
                                currentIndex === optionIndex ? event.target.value : item
                              )
                            );
                            const currentCorrectIndex =
                              (current.config.correctOptionIndexes as number[] | undefined)?.[0] ?? 0;
                            return {
                              ...current,
                              config: {
                                ...current.config,
                                options: nextOptions,
                                correctOptionIndexes: [Math.min(currentCorrectIndex, Math.max(nextOptions.length - 1, 0))]
                              }
                            };
                          })
                        }
                        placeholder={`Option ${optionIndex + 1}`}
                        className={`flex-1 ${fieldClassName}`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateQuestion(index, (current) => {
                            const currentOptions = Array.isArray(current.config.options)
                              ? (current.config.options as string[])
                              : [];
                            const nextOptions = normalizeOptions(
                              currentOptions.filter((_, currentIndex) => currentIndex !== optionIndex)
                            );
                            const safeOptions = nextOptions.length >= 2 ? nextOptions : ["Option 1", "Option 2"];
                            return {
                              ...current,
                              config: {
                                ...current.config,
                                options: safeOptions,
                                correctOptionIndexes: [0]
                              }
                            };
                          })
                        }
                        className="rounded-full border border-[#ebe4ff] px-4 py-3 text-sm font-semibold text-[#6f6787]"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuestion(index, (current) => ({
                          ...current,
                          config: {
                            ...current.config,
                            options: normalizeOptions([
                              ...(Array.isArray(current.config.options)
                                ? (current.config.options as string[])
                                : []),
                              `Option ${options.length + 1}`
                            ])
                          }
                        }))
                      }
                      disabled={options.length >= 4}
                      className="rounded-full border border-[#ebe4ff] px-4 py-3 text-sm font-semibold text-[#2d2446] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {options.length >= 4 ? "Maximum 4 options" : "Add option"}
                    </button>
                    <p className="text-sm text-[#8a82a2]">{options.length}/4 options</p>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto_auto]">
                  <select
                    value={String(correctOptionIndexes[0] ?? 0)}
                    onChange={(event) =>
                      updateQuestion(index, (current) => ({
                        ...current,
                        config: {
                          ...current.config,
                          correctOptionIndexes: [Number(event.target.value)]
                        }
                      }))
                    }
                    className={fieldClassName}
                  >
                    {options.map((option, optionIndex) => (
                      <option key={`${option}-${optionIndex}`} value={optionIndex}>
                        Correct answer: {option}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 rounded-[1.1rem] border border-[#ebe4ff] px-4 py-3 text-sm text-[#6d6585]">
                    <input
                      type="checkbox"
                      checked={Boolean(question?.anonymous)}
                      onChange={(event) =>
                        updateQuestion(index, (current) => ({
                          ...current,
                          anonymous: event.target.checked
                        }))
                      }
                    />
                    Anonymous
                  </label>
                  <label className="flex items-center gap-2 rounded-[1.1rem] border border-[#ebe4ff] px-4 py-3 text-sm text-[#6d6585]">
                    <input
                      type="checkbox"
                      checked={Boolean(question?.config.allowMultiple)}
                      onChange={(event) =>
                        updateQuestion(index, (current) => ({
                          ...current,
                          config: {
                            ...current.config,
                            allowMultiple: event.target.checked
                          }
                        }))
                      }
                    />
                    Multi select
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={handleCreateCustomTemplate}
            disabled={isSavingCustomTemplate}
            className="rounded-full bg-[#8b62ff] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingCustomTemplate ? "Saving..." : "Save template"}
          </button>
          <button
            onClick={() => setCustomTemplate(createEmptyTemplate())}
            className="rounded-full border border-[#ebe4ff] px-5 py-3 text-sm font-semibold text-[#2d2446]"
          >
            Reset
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
              onClick={() => handleCreateSessionFromTemplate(template.id)}
              disabled={creatingTemplateId === template.id || !classId}
              className="mt-5 rounded-full border border-[#ebe4ff] px-4 py-3 text-sm font-semibold text-[#2d2446] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creatingTemplateId === template.id ? "Creating..." : "Create session from template"}
            </button>
          </article>
        ))}
      </section>

      {message ? <p className="text-sm text-[#6d6585]">{message}</p> : null}
    </div>
  );
}
