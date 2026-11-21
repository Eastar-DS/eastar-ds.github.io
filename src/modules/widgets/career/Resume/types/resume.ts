import type { CareerProject } from "@/shared/types/career";

/** 이력서의 줄 하나. 제목이 있으면 제목을 한 줄 위에 두고 그 아래에 글을 둡니다 */
export interface ResumeItem {
  title?: string;
  text: string;
  /**
   * 이 줄의 내용을 자세히 쓴 블로그 글 이름(slug, `src/content/posts/{slug}`). 글 아래에 「관련 글: 제목」 링크로 보입니다.
   * 없는 글 이름을 적으면 이력서를 그릴 때 빌드가 멈춥니다.
   */
  relatedPostSlugs?: string[];
  /** 줄 아래에 들여 쓰는 자세한 줄 */
  details?: ResumeItem[];
}

/** 경험 안에서 줄을 묶는 덩어리. 제목이 없으면 줄만 보입니다 */
export interface ResumeItemGroup {
  title?: string;
  items: ResumeItem[];
}

/** 경험 하나. 머리 줄(이름, 한 줄 소개, 기간 등)은 이력서와 포트폴리오가 함께 쓰는 프로젝트 정보입니다 */
export interface ResumeExperience {
  project: CareerProject;
  groups: ResumeItemGroup[];
}

/** 기술 한 줄. 예: 프론트엔드 → React, TypeScript */
export interface ResumeSkill {
  label: string;
  value: string;
}
