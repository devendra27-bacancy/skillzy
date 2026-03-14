import { describe, expect, it } from "vitest";

describe("student join input", () => {
  it("strips non-digits from join code values", () => {
    const normalized = "12ab34".replace(/\D/g, "").slice(0, 4);
    expect(normalized).toBe("1234");
  });
});
