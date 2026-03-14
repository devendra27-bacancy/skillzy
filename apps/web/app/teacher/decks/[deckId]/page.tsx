import type { DeckBundle } from "@skillzy/types";
import { notFound } from "next/navigation";
import { DeckEditor } from "../../../../components/deck-editor";
import { GoogleSignInButton } from "../../../../components/google-sign-in-button";
import { AppShell } from "../../../../components/shell";
import { API_URL } from "../../../../lib/api";
import { unwrapApiResult } from "../../../../lib/api-result";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

async function getDecks() {
  const response = await fetch(`${API_URL}/api/decks`, { cache: "no-store" });
  return unwrapApiResult<DeckBundle[]>(response);
}

export default async function DeckPage({
  params
}: {
  params: Promise<{ deckId: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const authResult = supabase ? await supabase.auth.getUser() : null;
  if (!authResult?.data.user) {
    return (
      <AppShell className="max-w-2xl pt-16">
        <GoogleSignInButton next="/teacher" />
      </AppShell>
    );
  }

  const { deckId } = await params;
  const bundles = await getDecks();
  const bundle = bundles.find((item) => item.deck.id === deckId);
  if (!bundle) notFound();

  return (
    <AppShell>
      <DeckEditor bundle={bundle} />
    </AppShell>
  );
}
