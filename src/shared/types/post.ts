/** 화면에 쓰는 글 정보. 콘텐츠 모음의 항목을 `shared/content`에서 이 모양으로 바꿉니다 */
export interface Post {
  slug: string;
  title: string;
  description: string;
  category: string;
  publishedAt: Date;
  /** 고친 날이 없으면 발행일과 같습니다 */
  updatedAt: Date;
  readingMinutes: number;
  series?: PostSeries;
  /** 이 글과 이어진 프로젝트 id(`shared/constants/career`). 글 끝에 포트폴리오의 프로젝트 구획으로 잇습니다 */
  projects?: string[];
  /** 초안이면 true. 배포에서 본문은 빠지며, 공개 시리즈의 편 목록에는 제목과 「준비 중」을 보입니다 */
  draft?: boolean;
}

export interface PostSeries {
  id: string;
  name: string;
  order: number;
}

/** 연도별로 묶은 글 목록의 한 묶음 */
export interface PostYearGroup {
  year: string;
  posts: Post[];
}

/** 시리즈 하나의 요약 */
export interface SeriesSummary {
  id: string;
  description: string;
  name: string;
  count: number;
  /** 시리즈의 첫 글 */
  firstPostSlug: string;
}

/** 시리즈 목록에 보일 편. 배포에서 초안이면 slug가 없어 링크를 만들 수 없습니다. */
export interface SeriesPart {
  title: string;
  order: number;
  slug?: string;
}
