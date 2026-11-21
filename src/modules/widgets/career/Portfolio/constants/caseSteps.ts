import type { PortfolioStepKey } from "@/modules/widgets/career/Portfolio/types/portfolio";

/** 사례 칸의 순서와 이름표 */
export const CASE_STEPS: { key: PortfolioStepKey; label: string }[] = [
  { key: "problem", label: "문제" },
  { key: "hypothesis", label: "가설" },
  { key: "action", label: "한 일" },
  { key: "result", label: "결과" },
  { key: "lesson", label: "배운 것" },
];
