import { describe, expect, it } from "vitest";

import resolveTheme from "./resolveTheme";

describe("resolveTheme", () => {
  it("사용자가 고른 테마를 시스템 설정보다 먼저 쓴다", () => {
    expect(resolveTheme({ chosenTheme: "light", isSystemDark: true })).toBe(
      "light",
    );
  });

  it("고른 테마가 없으면 시스템 설정을 따른다", () => {
    expect(resolveTheme({ chosenTheme: undefined, isSystemDark: true })).toBe(
      "dark",
    );
    expect(resolveTheme({ chosenTheme: null, isSystemDark: false })).toBe(
      "light",
    );
  });

  it("알 수 없는 값은 고르지 않은 것으로 본다", () => {
    expect(resolveTheme({ chosenTheme: "blue", isSystemDark: false })).toBe(
      "light",
    );
  });
});
