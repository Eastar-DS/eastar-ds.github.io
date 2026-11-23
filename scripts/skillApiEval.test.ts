import { describe, expect, it } from "vitest";
import { canStart, childEnv, isApiKeyAuth, selectedSkills } from "./skillApiEval.mjs";

describe("API 평가의 인증과 비용 제한", () => {
  it("55달러와 진행 중인 실행의 예약 비용을 함께 확인함", () => {
    expect(canStart({ total_cost_usd: 54, runs: [] }, 0.6)).toBe(true);
    expect(canStart({ total_cost_usd: 55, runs: [] }, 0.1)).toBe(false);
    expect(canStart({ total_cost_usd: 54, runs: [{ status: "running", budget: 0.6 }] }, 0.6)).toBe(false);
    expect(canStart({ total_cost_usd: 0, runs: [], haltReason: "인증 실패" }, 0.6)).toBe(false);
    expect(canStart({ total_cost_usd: 0, runs: [] }, NaN)).toBe(false);
  });
  it("인증 출처가 환경 변수 API 키일 때만 인정함", () => {
    expect(isApiKeyAuth({ apiKeySource: "ANTHROPIC_API_KEY" })).toBe(true);
    for (const apiKeySource of [undefined, "oauth", "user", "apiKeyHelper"]) expect(isApiKeyAuth({ apiKeySource })).toBe(false);
  });
  it("이번 작업의 중단 기준과 예약 비용을 적용함", () => {
    expect(canStart({ total_cost_usd: 60, stop_new_runs_usd: 65, runs: [] }, 5)).toBe(true);
    expect(canStart({ total_cost_usd: 65, stop_new_runs_usd: 65, runs: [] }, 0.1)).toBe(false);
    expect(canStart({ total_cost_usd: 60, stop_new_runs_usd: 65, runs: [{ status: "running", budget: 4 }] }, 2)).toBe(false);
  });
  it("추가 환경에도 OAuth 토큰과 API 우회 설정을 허용하지 않음", () => {
    const env: Record<string, string | undefined> = childEnv("test-key", { CLAUDE_CODE_OAUTH_TOKEN: "test-oauth", ANTHROPIC_AUTH_TOKEN: "test-auth", ANTHROPIC_BASE_URL: "https://example.invalid", BLOG_WORK_CONFIG: "/tmp/eval.json" });
    expect(env.ANTHROPIC_API_KEY).toBe("test-key");
    expect(env.CLAUDE_CODE_OAUTH_TOKEN).toBeUndefined();
    expect(env.ANTHROPIC_AUTH_TOKEN).toBeUndefined();
    expect(env.ANTHROPIC_BASE_URL).toBeUndefined();
    expect(env.BLOG_WORK_CONFIG).toBe("/tmp/eval.json");
  });
  it("실제 Skill 호출과 SKILL.md 읽기를 세고 단순 언급은 세지 않음", () => {
    const tool = (name: string, input: Record<string, string>) => ({ type: "tool_use", name, input });
    expect(selectedSkills([{ type: "assistant", message: { content: [
      { type: "text", text: "write-post 사용" }, tool("Skill", { skill: "fact-check-post" }),
      tool("Read", { file_path: "/tmp/.claude/skills/prepublish-check/SKILL.md" }),
      tool("Read", { file_path: "/tmp/.claude/skills/plan-post/evals/evals.json" }),
      tool("Skill", { skill: "fact-check-post" }),
    ] } }])).toEqual(["fact-check-post", "prepublish-check"]);
  });
});
