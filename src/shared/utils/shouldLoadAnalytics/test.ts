import { describe, expect, it } from "vitest";

import shouldLoadAnalytics from ".";

describe("shouldLoadAnalytics", () => {
  it("Worker 주소와 프로젝트 키가 모두 있을 때만 불러온다", () => {
    expect(shouldLoadAnalytics({ workerUrl: "https://eastar-blog.example.workers.dev", projectKey: "phc_x" })).toBe(true);
    expect(shouldLoadAnalytics({ workerUrl: "", projectKey: "phc_x" })).toBe(false);
    expect(shouldLoadAnalytics({ workerUrl: "https://eastar-blog.example.workers.dev", projectKey: "" })).toBe(false);
    expect(shouldLoadAnalytics({ workerUrl: "", projectKey: "" })).toBe(false);
  });
});
