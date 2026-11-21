import { describe, expect, it } from "vitest";

import createPosthogConfig, { toRelayHost } from "./createPosthogConfig";

describe("toRelayHost", () => {
  it.each([
    ["https://eastar-blog.example.workers.dev", "/bridge"],
    ["https://eastar-blog.example.workers.dev/", "bridge/"],
  ])("%s + %s → 중계 주소", (workerUrl, relayPath) => {
    expect(toRelayHost({ workerUrl, relayPath })).toBe("https://eastar-blog.example.workers.dev/bridge");
  });
});

describe("createPosthogConfig", () => {
  it("Worker 중계로 보내고, 쿠키를 쓰지 않고, 녹화는 꺼 둔 채 입력 칸을 가린다", () => {
    expect(
      createPosthogConfig({
        workerUrl: "https://eastar-blog.example.workers.dev",
        relayPath: "/bridge",
        uiHost: "https://us.posthog.com",
      }),
    ).toEqual({
      api_host: "https://eastar-blog.example.workers.dev/bridge",
      ui_host: "https://us.posthog.com",
      defaults: "2026-08-30",
      person_profiles: "identified_only",
      persistence: "localStorage",
      respect_dnt: true,
      disable_session_recording: true,
      session_recording: { maskAllInputs: true },
    });
  });
});
