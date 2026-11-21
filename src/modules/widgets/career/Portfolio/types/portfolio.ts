import type { CareerProject } from "@/shared/types/career";

/** 사례 칸의 목록 한 줄. 제목이 있으면 글 위에 작은 이름표로 둡니다 */
export interface PortfolioListItem {
  title?: string;
  text: string;
}

/** 사례 칸 하나의 글. 문자열이면 문단 하나, 배열이면 목록입니다 */
export type PortfolioContent = string | PortfolioListItem[];

/** 사례 끝에 붙이는 블로그 밖 링크. 예: 결정 기록(ADR), 검증 보고서. 블로그 글은 `relatedPostSlugs`에 적습니다 */
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
  /**
   * 이 사례를 자세히 쓴 블로그 글 이름(slug, `src/content/posts/{slug}`). 사례 끝에 「관련 글: 제목」 링크로 보입니다.
   * 없는 글 이름을 적으면 빌드가 멈춥니다.
   */
  relatedPostSlugs?: string[];
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
