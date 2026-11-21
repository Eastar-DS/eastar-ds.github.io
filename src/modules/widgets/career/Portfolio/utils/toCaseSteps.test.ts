import { describe, expect, it } from "vitest";

import type { PortfolioCase } from "@/modules/widgets/career/Portfolio/types/portfolio";

import toCaseSteps from "./toCaseSteps";

const portfolioCase: PortfolioCase = {
  title: "사례",
  result: "결과 글",
  action: [{ title: "가설 A", text: "한 일 글" }],
  hypothesis: "가설 글",
  problem: "문제 글",
};

describe("toCaseSteps", () => {
  it("문제 → 가설 → 한 일 → 결과 순서로 칸을 만든다", () => {
    expect(toCaseSteps(portfolioCase).map((step) => step.label)).toEqual([
      "문제",
      "가설",
      "한 일",
      "결과",
    ]);
  });

  it("배운 것이 있으면 결과 뒤에 붙인다", () => {
    const steps = toCaseSteps({ ...portfolioCase, lesson: "배운 것 글" });

    expect(steps.at(-1)).toEqual({
      key: "lesson",
      label: "배운 것",
      content: "배운 것 글",
    });
  });

  it("칸의 글을 그대로 넘긴다", () => {
    expect(toCaseSteps(portfolioCase)[2]?.content).toEqual([
      { title: "가설 A", text: "한 일 글" },
    ]);
  });
});
