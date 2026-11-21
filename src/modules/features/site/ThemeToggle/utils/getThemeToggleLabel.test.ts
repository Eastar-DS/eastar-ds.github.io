import { describe, expect, it } from "vitest";

import getThemeToggleLabel from "./getThemeToggleLabel";

describe("getThemeToggleLabel", () => {
  it("누르면 바뀔 화면을 이름으로 쓴다", () => {
    expect(getThemeToggleLabel("light")).toBe("어두운 화면으로");
    expect(getThemeToggleLabel("dark")).toBe("밝은 화면으로");
  });
});
