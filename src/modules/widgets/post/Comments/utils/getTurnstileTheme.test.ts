import { describe, expect, it } from "vitest";

import getTurnstileTheme from "./getTurnstileTheme";

describe("getTurnstileTheme", () => {
  it.each([
    ["light", "light"],
    ["dark", "dark"],
    [undefined, "auto"],
    ["sepia", "auto"],
  ])("%s → %s", (chosenTheme, expected) => {
    expect(getTurnstileTheme(chosenTheme)).toBe(expected);
  });
});
