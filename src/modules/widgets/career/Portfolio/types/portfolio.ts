import type { CareerProject } from "@/shared/types/career";

/** 사례 칸의 목록 한 줄. 제목이 있으면 글 위에 작은 이름표로 둡니다 */
export interface PortfolioListItem {
  title?: string;
  text: string;
}

/** 사례 칸 하나의 글. 문자열이면 문단 하나, 배열이면 목록입니다 */
export type PortfolioContent = string | PortfolioListItem[];

/** 사례 끝에 붙이는 링크. 예: 같은 일을 자세히 쓴 글 */
export interface PortfolioLink {
  label: string;
  href: string;
}

/** 문제 하나를 풀어 간 사례. 칸은 문제 → 가설 → 한 일 → 결과 → 배운 것(있을 때만) 순서로 그립니다 */
export interface PortfolioCase {
  title: string;
  problem: PortfolioContent;
  hypothesis: PortfolioContent;
  action: PortfolioContent;
  result: PortfolioContent;
  lesson?: PortfolioContent;
  links?: PortfolioLink[];
}

/** 프로젝트 하나와 그 안의 사례들. 머리 줄은 이력서와 함께 쓰는 프로젝트 정보입니다 */
export interface PortfolioProject {
  project: CareerProject;
  cases: PortfolioCase[];
}

/** 사례 칸의 종류 */
export type PortfolioStepKey =
  | "problem"
  | "hypothesis"
  | "action"
  | "result"
  | "lesson";
