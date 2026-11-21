import { describe, expect, it } from "vitest";

import { shouldShowLineNumbers } from ".";

describe("shouldShowLineNumbers", () => {
  it("20줄까지는 줄 번호를 두지 않는다", () => {
    expect(shouldShowLineNumbers(4)).toBe(false);
    expect(shouldShowLineNumbers(20)).toBe(false);
  });

  it("20줄을 넘으면 줄 번호를 둔다", () => {
    expect(shouldShowLineNumbers(21)).toBe(true);
  });
});
