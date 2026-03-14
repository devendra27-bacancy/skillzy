import { describe, expect, it } from "vitest";
import { SkillzyStore } from "./store";

describe("SkillzyStore", () => {
  it("creates sessions with four digit join codes", async () => {
    const store = new SkillzyStore();
    const session = await store.createSession({
      classId: "class_design_101",
      deckId: "deck_sprint_intro"
    });

    expect(session).not.toBeNull();
    if (!session) {
      throw new Error("Session should be created for the seeded deck.");
    }
    expect(session.joinCode).toMatch(/^\d{4}$/);
    expect(session.status).toBe("draft");
  });

  it("reuses participants during reconnect", async () => {
    const store = new SkillzyStore();
    const session = await store.createSession({
      classId: "class_design_101",
      deckId: "deck_sprint_intro"
    });
    expect(session).not.toBeNull();
    if (!session) {
      throw new Error("Session should be created for the seeded deck.");
    }
    const joined = await store.joinSession({
      joinCode: session.joinCode,
      displayName: "Ava"
    });

    const rejoined = await store.joinSession({
      joinCode: session.joinCode,
      displayName: "Ava",
      reconnectToken: joined?.participant.reconnectToken
    });

    expect(rejoined?.participant.id).toBe(joined?.participant.id);
  });
});
