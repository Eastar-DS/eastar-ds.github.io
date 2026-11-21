import { describe, expect, it } from "vitest";

import getContrastRatio from ".";

describe("getContrastRatio", () => {
  it("검정과 흰색은 21:1이다", () => {
    expect(getContrastRatio({ foreground: "#000000", background: "#FFFFFF" })).toBeCloseTo(21, 5);
  });

  it("앞뒤를 바꿔도 같은 값이다", () => {
    const a = getContrastRatio({ foreground: "#2457D6", background: "#FFFFFF" });
    const b = getContrastRatio({ foreground: "#FFFFFF", background: "#2457D6" });

    expect(a).toBeCloseTo(b, 10);
    expect(a).toBeCloseTo(6.16, 2);
  });

  it("투명도가 붙은 8자리 색은 투명도를 빼고 센다", () => {
    expect(getContrastRatio({ foreground: "#000000ff", background: "#F6F8FA" })).toBeCloseTo(
      19.73,
      1,
    );
  });

  it("색 꼴이 아니면 알린다", () => {
    expect(() => getContrastRatio({ foreground: "red", background: "#FFFFFF" })).toThrow();
  });
});
