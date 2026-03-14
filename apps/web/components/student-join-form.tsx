"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import { api } from "../lib/api";

type JoinStep = "code" | "name";

function autoName() {
  return `Guest ${Math.floor(Math.random() * 900 + 100)}`;
}

export function StudentJoinForm() {
  const router = useRouter();
  const codeInputRef = useRef<HTMLInputElement | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [step, setStep] = useState<JoinStep>("code");
  const [sessionMeta, setSessionMeta] = useState<{
    sessionId: string;
    title: string;
    anonymous_mode: boolean;
    code: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleCodeSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const nextMeta = await api.lookupJoinCode(joinCode);
      setSessionMeta(nextMeta);

      if (nextMeta.anonymous_mode) {
        await completeJoin(nextMeta.code, autoName());
        return;
      }

      setStep("name");
    } catch {
      setError("We couldn't find that live class. Double-check the code and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function completeJoin(code: string, name: string) {
    const reconnectToken =
      typeof window !== "undefined"
        ? localStorage.getItem("skillzyReconnectToken") ?? undefined
        : undefined;
    const joined = await api.joinSession({
      joinCode: code,
      displayName: name,
      reconnectToken
    });
    localStorage.setItem("skillzyParticipantId", joined.participant.id);
    localStorage.setItem("skillzyReconnectToken", joined.participant.reconnectToken);
    router.push(`/session/${code}`);
  }

  async function handleNameSubmit(event: FormEvent) {
    event.preventDefault();
    if (!sessionMeta) return;
    setSubmitting(true);
    setError("");

    try {
      await completeJoin(sessionMeta.code, displayName.trim() || autoName());
    } catch {
      setError("We couldn't finish joining the session. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return step === "code" ? (
    <form onSubmit={handleCodeSubmit} className="space-y-4">
      <label className="space-y-2">
        <span className="text-sm font-semibold text-skillzy-soft">4-digit code</span>
        <input
          ref={codeInputRef}
          autoFocus
          value={joinCode}
          onChange={(event) => setJoinCode(event.target.value.replace(/\D/g, "").slice(0, 4))}
          className="w-full rounded-[1.75rem] border border-black/10 bg-white/70 px-5 py-5 text-center text-3xl tracking-[0.35em] outline-none"
          placeholder="1234"
          inputMode="numeric"
          required
        />
      </label>
      <button
        type="submit"
        disabled={submitting || joinCode.length !== 4}
        className="w-full rounded-full bg-skillzy-ink px-5 py-4 font-semibold text-white transition hover:translate-y-[-1px] disabled:opacity-60"
      >
        {submitting ? "Checking code..." : "Continue"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  ) : (
    <form onSubmit={handleNameSubmit} className="space-y-4">
      <div className="rounded-[1.5rem] bg-[#f8f4ff] px-4 py-4">
        <p className="text-sm font-semibold text-[#241d39]">{sessionMeta?.title}</p>
        <p className="mt-1 text-sm text-[#6d6585]">Code {sessionMeta?.code}</p>
      </div>
      <label className="space-y-2">
        <span className="text-sm font-semibold text-skillzy-soft">Your name</span>
        <input
          autoFocus
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className="w-full rounded-[1.2rem] border border-black/10 bg-white/70 px-5 py-4 outline-none"
          placeholder="Ava"
          required
        />
      </label>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            setStep("code");
            setSessionMeta(null);
            setDisplayName("");
            setTimeout(() => codeInputRef.current?.focus(), 0);
          }}
          className="rounded-full border border-black/10 px-5 py-4 font-semibold text-[#2d2446]"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={submitting || !displayName.trim()}
          className="flex-1 rounded-full bg-skillzy-ink px-5 py-4 font-semibold text-white transition hover:translate-y-[-1px] disabled:opacity-60"
        >
          {submitting ? "Joining class..." : "Join live session"}
        </button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
