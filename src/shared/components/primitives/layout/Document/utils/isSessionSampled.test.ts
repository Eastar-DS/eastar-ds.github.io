import { describe, expect, it } from "vitest";

import isSessionSampled from "./isSessionSampled";

const sessionIds = Array.from({ length: 4000 }, (_, index) => `019a${index.toString(16).padStart(8, "0")}-7c3e-7000-8000-${index}`);

describe("isSessionSampled", () => {
  it("같은 세션 id는 늘 같은 답이다", () => {
    const sessionId = "019a1b2c-3d4e-7f00-8a9b-0c1d2e3f4a5b";

    expect(isSessionSampled({ sessionId, sampleRate: 0.1 })).toBe(isSessionSampled({ sessionId, sampleRate: 0.1 }));
  });

  it("비율 0은 아무도, 1은 모두 녹화한다", () => {
    expect(sessionIds.some((sessionId) => isSessionSampled({ sessionId, sampleRate: 0 }))).toBe(false);
    expect(sessionIds.every((sessionId) => isSessionSampled({ sessionId, sampleRate: 1 }))).toBe(true);
  });

  it("비율 0.1이면 대략 10%를 녹화한다", () => {
    const sampled = sessionIds.filter((sessionId) => isSessionSampled({ sessionId, sampleRate: 0.1 })).length;

    expect(sampled / sessionIds.length).toBeGreaterThan(0.07);
    expect(sampled / sessionIds.length).toBeLessThan(0.13);
  });

  it("세션 id가 없으면 녹화하지 않는다", () => {
    expect(isSessionSampled({ sessionId: "", sampleRate: 1 })).toBe(false);
  });
});
