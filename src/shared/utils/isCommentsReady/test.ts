import { describe, expect, it } from "vitest";

import isCommentsReady from ".";

const ready = { isEnabled: true, workerUrl: "https://eastar-blog.example.workers.dev", turnstileSiteKey: "0x4AAA" };

describe("isCommentsReady", () => {
  it("켜져 있고 Worker 주소 · 사이트 키가 모두 있으면 그린다", () => {
    expect(isCommentsReady(ready)).toBe(true);
  });

  it.each([
    { ...ready, isEnabled: false },
    { ...ready, workerUrl: "" },
    { ...ready, turnstileSiteKey: "" },
    { ...ready, workerUrl: "  " },
  ])("하나라도 빠지면 그리지 않는다 %j", (params) => {
    expect(isCommentsReady(params)).toBe(false);
  });
});
