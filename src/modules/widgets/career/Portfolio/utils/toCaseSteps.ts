import { CASE_STEPS } from "@/modules/widgets/career/Portfolio/constants/caseSteps";
import type { PortfolioCase } from "@/modules/widgets/career/Portfolio/types/portfolio";

/** 사례를 그릴 칸 목록으로 바꿉니다. 칸은 문제 → 가설 → 한 일 → 결과 → 배운 것 순서이고, 글이 없는 칸(배운 것)은 뺍니다 */
const toCaseSteps = (portfolioCase: PortfolioCase) =>
  CASE_STEPS.flatMap(({ key, label }) => {
    const content = portfolioCase[key];

    return content ? [{ key, label, content }] : [];
  });

export default toCaseSteps;
