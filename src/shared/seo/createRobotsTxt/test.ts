import { describe, expect, it } from "vitest";

import createRobotsTxt, { ALLOWED_BOTS } from ".";

describe("createRobotsTxt", () => {
  const robots = createRobotsTxt();

  it("모든 로봇에 모든 주소를 허용한다", () => {
    expect(robots).toContain("User-agent: *\nAllow: /");
    expect(robots).not.toMatch(/Disallow/);
  });

  it("AI 검색 · 수집 로봇을 이름으로 적어 허용한다", () => {
    ["GPTBot", "OAI-SearchBot", "PerplexityBot", "ClaudeBot", "Google-Extended"].forEach((bot) => {
      expect(ALLOWED_BOTS).toContain(bot);
      expect(robots).toContain(`User-agent: ${bot}`);
    });
  });

  it("사이트맵 절대 주소를 알린다", () => {
    expect(robots).toContain("Sitemap: https://eastar-ds.github.io/sitemap-index.xml");
  });
});
