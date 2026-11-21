import { describe, expect, it } from "vitest";

import getNextTheme from "./getNextTheme";

describe("getNextTheme", () => {
  it("밝은 화면과 어두운 화면을 서로 바꾼다", () => {
    expect(getNextTheme("light")).toBe("dark");
    expect(getNextTheme("dark")).toBe("light");
  });
});
