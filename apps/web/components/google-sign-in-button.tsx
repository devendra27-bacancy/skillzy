"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "../lib/supabase/browser";

export function GoogleSignInButton({
  next = "/teacher",
  label = "Continue with Google"
}: {
  next?: string;
  label?: string;
}) {
  const [pending, setPending] = useState(false);

  async function handleSignIn() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setPending(true);

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "consent"
        }
      }
    });
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={pending}
      className="rounded-full bg-skillzy-ink px-5 py-3 font-semibold text-white"
    >
      {pending ? "Redirecting..." : label}
    </button>
  );
}
