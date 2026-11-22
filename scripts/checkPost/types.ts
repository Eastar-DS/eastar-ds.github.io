// 게시 전 점검(scripts/checkPost.ts)이 주고받는 값의 모양입니다.

/**
 * 검사 하나의 결과. 실패가 하나라도 있으면 스크립트가 1로 끝나고, 경고만 있으면 0으로 끝납니다.
 * `skip`(건너뜀)은 초안이라 배포 빌드에 글이 없는 것처럼 이번에 볼 수 없었던 검사입니다.
 */
export type CheckStatus = "pass" | "warn" | "fail" | "skip";

/** 검사가 찾은 것 하나. 줄 번호는 글 파일(index.mdx)의 줄입니다 */
export interface Finding {
  line?: number;
  message: string;
}

export interface CheckResult {
  /** 검사 이름. JSON 출력과 시험에서 씁니다. 예: `title-length` */
  id: string;
  /** 사람이 읽는 항목 이름. 예: 「제목 길이」 */
  label: string;
  status: CheckStatus;
  /** 한 줄 결과. 예: 「31자 (권장 25~32자, 상한 40자)」 */
  summary: string;
  findings: Finding[];
  /** 기준의 근거(정본 파일 · 절) */
  basis: string;
  /** docs/content-guide.md에서 이 검사가 맡는 절. 10장 확인 목록에 있으면 `10.1`처럼 10장의 절, 없으면 `5장`처럼 규칙이 있는 장 */
  section?: string;
  /** 통과하지 못했을 때 고칠 방법 */
  fix?: string;
}

/** 앞머리의 `series` */
export interface PostSeries {
  name: string;
  order: number;
}

/** 앞머리에서 읽은 값. 스키마(`src/content.config.ts`)가 빌드에서 다시 검사하므로 여기서는 점검에 필요한 칸만 읽습니다 */
export interface PostMeta {
  title?: string;
  description?: string;
  publishedAt?: string;
  updatedAt?: string;
  category?: string;
  series?: PostSeries;
  projects?: string[];
  draft: boolean;
}
