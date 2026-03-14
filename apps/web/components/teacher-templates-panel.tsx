"use client";

import type { DashboardData } from "@skillzy/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../lib/api";

export function TeacherTemplatesPanel({ dashboard }: { dashboard: DashboardData }) {
  const router = useRouter();
  const [classId, setClassId] = useState(dashboard.classes[0]?.id ?? "");
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

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

  return (
    <div className="space-y-5">
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
