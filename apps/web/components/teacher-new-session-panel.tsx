"use client";

import type { DashboardData, LessonTemplate } from "@skillzy/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "../lib/api";

export function TeacherNewSessionPanel({ dashboard }: { dashboard: DashboardData }) {
  const router = useRouter();
  const [classId, setClassId] = useState(dashboard.classes[0]?.id ?? "");
  const [templateId, setTemplateId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const selectedTemplate = dashboard.templates.find((template) => template.id === templateId) ?? dashboard.templates[0] ?? null;

  useEffect(() => {
    if (!classId && dashboard.classes[0]?.id) {
      setClassId(dashboard.classes[0].id);
    }
  }, [classId, dashboard.classes]);

  useEffect(() => {
    const nextTemplateId = dashboard.templates[0]?.id ?? "";
    if (!templateId || !dashboard.templates.some((template) => template.id === templateId)) {
      setTemplateId(nextTemplateId);
    }
  }, [dashboard.templates, templateId]);

  async function handleCreateSession() {
    const targetTemplate = selectedTemplate;
    setSubmitting(true);
    setMessage("");
    try {
      const session = targetTemplate
        ? await api.createSession({ templateId: targetTemplate.id, classId })
        : null;
      if (!session) {
        throw new Error("No template source");
      }
      router.push(`/teacher/sessions/${session.id}`);
    } catch {
      setMessage("We couldn't create the session. Pick a template and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (dashboard.classes.length === 0) {
    return (
      <section className="rounded-[1.8rem] bg-white p-6 shadow-[0_18px_50px_rgba(95,73,166,0.09)]">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#9288b2]">New session</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#1a1630]">
          Create a class first
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6d6585]">
          Sessions need a class so join codes, reports, and templates stay scoped to the right group.
        </p>
        <Link
          href="/teacher/classes"
          className="mt-5 inline-flex rounded-full bg-[#8b62ff] px-5 py-3 text-sm font-semibold text-white"
        >
          Open classes
        </Link>
      </section>
    );
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
                setMessage("");
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
          Sessions start directly from templates, so you can skip deck setup and go straight into a live room.
        </p>
      </section>

      <section className="rounded-[1.8rem] bg-white p-6 shadow-[0_18px_50px_rgba(95,73,166,0.09)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#9288b2]">Step 2</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#1a1630]">
              Pick a template
            </h2>
          </div>
          <Link href="/teacher/templates" className="text-sm font-semibold text-[#6f49ff]">
            Open template library
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          {dashboard.templates.length > 0 ? (
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
          )}
        </div>

        <div className="mt-5 rounded-[1.3rem] border border-[#f1ebff] bg-[#fbf9ff] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#988eaf]">
            Selected template
          </p>
          {selectedTemplate ? (
            <>
              <p className="mt-2 font-semibold text-[#201936]">{selectedTemplate.title}</p>
              <p className="mt-1 text-sm text-[#6d6585]">{selectedTemplate.description}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[#988eaf]">
                {selectedTemplate.slides.length} questions
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-[#6d6585]">No template selected yet.</p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={handleCreateSession}
            disabled={
              submitting ||
              !classId ||
              !selectedTemplate
            }
            className="rounded-full bg-[#8b62ff] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create session from template"}
          </button>
          {message ? <p className="text-sm text-[#6d6585]">{message}</p> : null}
        </div>
      </section>
    </div>
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
