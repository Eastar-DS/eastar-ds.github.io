import { describe, expect, it } from "vitest";

import getStepStates from "./getStepStates";

const pickRerun = (propertyId: Parameters<typeof getStepStates>[0]["propertyId"]) =>
  getStepStates({ propertyId, frameCount: 3 }).map((step) => [
    step.id,
    step.isRerun,
    step.runCount,
  ]);

describe("getStepStates", () => {
  it("width는 네 단계를 모두 다시 한다", () => {
    expect(pickRerun("width")).toEqual([
      ["style", true, 3],
      ["layout", true, 3],
      ["paint", true, 3],
      ["composite", true, 3],
    ]);
  });

  it("background-color는 레이아웃을 건너뛴다", () => {
    expect(pickRerun("background-color")).toEqual([
      ["style", true, 3],
      ["layout", false, 0],
      ["paint", true, 3],
      ["composite", true, 3],
    ]);
  });

  it("transform은 레이아웃과 페인트를 건너뛴다", () => {
    expect(pickRerun("transform")).toEqual([
      ["style", true, 3],
      ["layout", false, 0],
      ["paint", false, 0],
      ["composite", true, 3],
    ]);
  });
});
