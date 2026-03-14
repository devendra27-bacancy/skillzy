"use client";

import { useState } from "react";
import { api } from "../lib/api";

export function SessionExportButton({ sessionId }: { sessionId: string }) {
  const [pending, setPending] = useState(false);

  async function handleExport() {
    setPending(true);
    try {
      const csv = await api.exportSession(sessionId);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `skillzy-session-${sessionId}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={pending}
      className="rounded-full bg-[#1f1832] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Exporting..." : "Download CSV"}
    </button>
  );
}
