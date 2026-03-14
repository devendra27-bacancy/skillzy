"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-full border border-[#ebe4ff] bg-white px-5 py-3 text-sm font-semibold text-[#2b2142] shadow-sm transition hover:bg-[#f7f2ff]"
    >
      Sign out
    </button>
  );
}
